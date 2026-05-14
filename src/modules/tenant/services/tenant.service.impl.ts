import { Inject, Injectable } from '@nestjs/common';
import { BaseServiceImpl } from '../../../common/services/base.service.impl';
import { ITenantService } from './tenant.service.interface';
import { ITenantRepository } from '../repository/tenant.repository.interface';
import { LoggerService } from '../../../common/logger/logger.service';
import { EventBus } from '../../../domain/events/event-bus.service';
import { TENANT_EVENTS } from '../../../domain/events/event-types';
import { Tenant, Prisma } from 'generated/prisma/client';
import { CreateTenantDto, UpdateBrandingDto, UpdateTenantDto } from '../dto';
import { Slug } from '../../../domain/value-objects/slug.vo';
import { ConflictError, NotFoundError } from '../../../common/errors/app-error';
import { ILogger } from 'src/common/logger/logger.interface';
import { PaystackGateway } from 'src/modules/payment/gateways/paystack.gateway';
import { PAYMENT_GATEWAY } from 'src/modules/payment/gateways/payment-gateway.interface';

@Injectable()
export class TenantServiceImpl
  extends BaseServiceImpl<
    Tenant,
    CreateTenantDto,
    UpdateTenantDto,
    Prisma.TenantCreateInput,
    Prisma.TenantUpdateInput
  >
  implements ITenantService
{
  protected readonly logger: ILogger;
  protected readonly entityName = 'Tenant';

  constructor(
    @Inject('ITenantRepository')
    protected readonly repository: ITenantRepository,
    private readonly eventBus: EventBus,
    @Inject(PAYMENT_GATEWAY)
    private readonly paystackGateway: PaystackGateway,
    logger: LoggerService,
  ) {
    super(repository);
    this.logger = logger.child('TenantService');
  }

  protected mapToUpdateInput(dto: UpdateTenantDto): Prisma.TenantUpdateInput {
    const input: Prisma.TenantUpdateInput = {};
    if (dto.businessName) input.businessName = dto.businessName;
    if (dto.description) input.description = dto.description;
    if (dto.location) input.location = dto.location;
    if (dto.lga) input.lga = dto.lga;
    if (dto.contactPhone) input.contactPhone = dto.contactPhone;
    if (dto.logoUrl) input.logoUrl = dto.logoUrl;
    if (dto.bannerUrl) input.bannerUrl = dto.bannerUrl;
    if (dto.businessType) input.businessType = dto.businessType;
    if (dto.category) input.category = dto.category;
    return input;
  }

  private async getBankCode(bankName: string): Promise<string> {
    const bankMap: Record<string, string> = {
      GTBank: '058',
      'First Bank': '011',
      'Access Bank': '044',
      UBA: '033',
      'Zenith Bank': '057',
      'Fidelity Bank': '070',
      'Union Bank': '032',
      'Wema Bank': '035',
    };
    const code = bankMap[bankName];
    if (!code) {
      this.logger.warn(
        `Unknown bank name: ${bankName}, defaulting to GTBank code 058`,
      );
      return '058';
    }
    return code;
  }

  // Additional business methods
  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.repository.findBySlug(slug);
  }

  async getStorefront(slug: string): Promise<Tenant | null> {
    return this.repository.getStorefront(slug);
  }

  async searchTenants(query: string, skip = 0, take = 20): Promise<Tenant[]> {
    return this.repository.searchTenants(query, skip, take);
  }

  async getByCategory(
    category: string,
    skip = 0,
    take = 20,
  ): Promise<Tenant[]> {
    return this.repository.findByCategory(category, skip, take);
  }

  async getByBusinessType(
    businessType: string,
    skip = 0,
    take = 20,
  ): Promise<Tenant[]> {
    return this.repository.findByBusinessType(businessType, skip, take);
  }

  // Override create to check uniqueness and emit event
  async create(data: CreateTenantDto & { userId: string }): Promise<Tenant> {
    const slugResult = Slug.create(data.businessName);
    if (slugResult.isErr()) throw new ConflictError(slugResult.getError());
    const slug = slugResult.getValue().getValue();

    const existing = await this.repository.findBySlug(slug, true);
    if (existing)
      throw new ConflictError('Business name already taken', {
        field: 'businessName',
      });

    let paystackSubaccountCode: string | undefined;
    if (data.bankName && data.bankAccountNumber && data.bankAccountName) {
      const bankCode = await this.getBankCode(data.bankName);
      const subaccount = await this.paystackGateway.createSubaccount({
        businessName: data.businessName,
        bankCode,
        accountNumber: data.bankAccountNumber,
        percentageCharge: 0,
        description: `Subaccount for ${data.businessName}`,
      });
      paystackSubaccountCode = subaccount.subaccount_code;
      this.logger.info(
        `Created Paystack subaccount for ${data.businessName}: ${paystackSubaccountCode}`,
      );
    }

    const createInput: Prisma.TenantCreateInput = {
      businessName: data.businessName,
      slug,
      businessType: data.businessType,
      category: data.category,
      description: data.description,
      location: data.location,
      lga: data.lga,
      contactPhone: data.contactPhone,
      isActive: true,
      paystackSubaccountCode,
      bankName: data.bankName,
      bankAccountNumber: data.bankAccountNumber,
      bankAccountName: data.bankAccountName,
      user: { connect: { id: data.userId } },
    };

    const tenant = await this.repository.create(createInput);
    await this.eventBus.emit({
      name: TENANT_EVENTS.REGISTERED,
      payload: {
        tenantId: tenant.id,
        businessName: tenant.businessName,
        slug: tenant.slug,
        userId: data.userId,
      },
    });
    this.logger.info('Tenant created', {
      tenantId: tenant.id,
      slug: tenant.slug,
    });
    return tenant;
  }

  // Prevent slug changes on update
  async update(id: string, data: UpdateTenantDto): Promise<Tenant> {
    if (data.businessName) {
      this.logger.warn(
        'Attempt to change businessName – slug remains unchanged',
        { tenantId: id },
      );
      delete data.businessName;
    }
    return super.update(id, data);
  }

  // Soft delete
  async delete(id: string): Promise<Tenant> {
    this.logger.info(`Soft deleting tenant`, { tenantId: id });
    await this.findById(id);
    return this.repository.update(id, { isActive: false });
  }

  async verifyTenant(tenantId: string, isVerified: boolean): Promise<Tenant> {
    const tenant = await this.repository.findById(tenantId);
    if (!tenant) throw new NotFoundError('Tenant', tenantId);

    const updated = await this.repository.update(tenantId, {
      isVerified,
      verifiedAt: isVerified ? new Date() : null,
    });

    // Emit event for notification
    if (isVerified) {
      await this.eventBus.emit({
        name: TENANT_EVENTS.VERIFIED,
        payload: {
          tenantId: tenant.id,
          businessName: tenant.businessName,
          userId: tenant.userId,
        },
      });
    } else {
      await this.eventBus.emit({
        name: TENANT_EVENTS.UNVERIFIED,
        payload: {
          tenantId: tenant.id,
          businessName: tenant.businessName,
          userId: tenant.userId,
        },
      });
    }

    this.logger.info(`Tenant ${tenantId} verification set to ${isVerified}`);
    return updated;
  }

  async updateBranding(
    tenantId: string,
    branding: UpdateBrandingDto,
  ): Promise<Tenant> {
    const tenant = await this.repository.findById(tenantId);
    if (!tenant) throw new NotFoundError('Tenant', tenantId);

    const updated = await this.repository.update(tenantId, {
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
      accentColor: branding.accentColor,
      fontFamily: branding.fontFamily,
      socialLinks: branding.socialLinks,
      heroTitle: branding.heroTitle,
      heroSubtitle: branding.heroSubtitle,
      footerText: branding.footerText,
    });

    this.logger.info(`Branding updated for tenant ${tenantId}`);
    return updated;
  }
}
