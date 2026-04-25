import { Injectable } from '@nestjs/common';
import { BaseServiceImpl } from '../../../common/services/base.service.impl';
import { ITenantService } from './tenant.service.interface';
import { ITenantRepository } from '../repository/tenant.repository.interface';
import { LoggerService } from '../../../common/logger/logger.service';
import { EventBus } from '../../../domain/events/event-bus.service';
import { TENANT_EVENTS } from '../../../domain/events/event-types';
import { Tenant, Prisma } from 'generated/prisma/client';
import { CreateTenantDto, UpdateTenantDto } from '../dto/requests';
import { Slug } from '../../../domain/value-objects/slug.vo';
import { ConflictError } from '../../../common/errors/app-error';
import { ILogger } from 'src/common/logger/logger.interface';

@Injectable()
export class TenantServiceImpl
  extends BaseServiceImpl<Tenant, CreateTenantDto, UpdateTenantDto, Prisma.TenantCreateInput, Prisma.TenantUpdateInput>
  implements ITenantService
{
  protected readonly logger: ILogger;
  protected readonly entityName = 'Tenant';

  constructor(
    protected readonly repository: ITenantRepository,
    private readonly eventBus: EventBus,
    logger: LoggerService,
  ) {
    super(repository);
    this.logger = logger.child('TenantService');
  }

  // Override mapping for create (including userId)
  protected mapToCreateInput(dto: CreateTenantDto & { userId?: string }): Prisma.TenantCreateInput {
    const userId = (dto as any).userId;
    if (!userId) throw new Error('userId is required to create tenant');

    const slugResult = Slug.create(dto.businessName);
    if (slugResult.isErr()) throw new ConflictError(slugResult.error);
    const slug = slugResult.getValue().getValue();

    return {
      businessName: dto.businessName,
      slug,
      businessType: dto.businessType,
      category: dto.category,
      description: dto.description,
      location: dto.location,
      lga: dto.lga,
      contactPhone: dto.contactPhone,
      isActive: true,
      user: { connect: { id: userId } },
    };
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

  async getByCategory(category: string, skip = 0, take = 20): Promise<Tenant[]> {
    return this.repository.findByCategory(category, skip, take);
  }

  async getByBusinessType(businessType: string, skip = 0, take = 20): Promise<Tenant[]> {
    return this.repository.findByBusinessType(businessType, skip, take);
  }

  // Override create to check uniqueness and emit event
  async create(data: CreateTenantDto & { userId: string }): Promise<Tenant> {
    const slugResult = Slug.create(data.businessName);
    if (slugResult.isErr()) throw new ConflictError(slugResult.error);
    const slug = slugResult.getValue().getValue();

    const existing = await this.repository.findBySlug(slug, true);
    if (existing) throw new ConflictError('Business name already taken', { field: 'businessName' });

    const tenant = await super.create(data);
    await this.eventBus.emit({
      name: TENANT_EVENTS.REGISTERED,
      payload: {
        tenantId: tenant.id,
        businessName: tenant.businessName,
        slug: tenant.slug,
        userId: data.userId,
      },
    });
    this.logger.info('Tenant created', { tenantId: tenant.id, slug: tenant.slug });
    return tenant;
  }

  // Prevent slug changes on update
  async update(id: string, data: UpdateTenantDto): Promise<Tenant> {
    if (data.businessName) {
      this.logger.warn('Attempt to change businessName – slug remains unchanged', { tenantId: id });
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
}