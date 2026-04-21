import { Injectable, ConflictException } from '@nestjs/common';
import { BaseServiceImpl } from '../../../common/services/base.service.impl';
import { ITenantService } from './tenant.service.interface';
import { ITenantRepository } from '../repository/tenant.repository.interface';
import { LoggerService } from '../../../common/logger/logger.service';
import { EventBus } from '../../../domain/events/event-bus.service';
import { TENANT_EVENTS } from '../../../domain/events/event-types';
import { Tenant } from 'generated/prisma/client';
import { CreateTenantDto, UpdateTenantDto } from '../dto/requests';
import { Slug } from '../../../domain/value-objects/slug.vo';
import { ConflictError } from '../../../common/errors/app-error';
import { ILogger } from 'src/common/logger/logger.interface';

@Injectable()
export class TenantServiceImpl extends BaseServiceImpl<Tenant, CreateTenantDto, UpdateTenantDto> implements ITenantService {
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

  async findBySlug(slug: string): Promise<Tenant | null> {
    this.logger.debug(`Finding tenant by slug`, { slug });
    return this.repository.findBySlug(slug);
  }

  async getStorefront(slug: string): Promise<Tenant | null> {
    this.logger.debug(`Getting storefront for tenant`, { slug });
    return this.repository.getStorefront(slug);
  }

  async searchTenants(query: string, skip = 0, take = 20): Promise<Tenant[]> {
    this.logger.debug(`Searching tenants`, { query, skip, take });
    return this.repository.searchTenants(query, skip, take);
  }

  async getByCategory(category: string, skip = 0, take = 20): Promise<Tenant[]> {
    this.logger.debug(`Getting tenants by category`, { category, skip, take });
    return this.repository.findByCategory(category, skip, take);
  }

  async getByBusinessType(businessType: string, skip = 0, take = 20): Promise<Tenant[]> {
    this.logger.debug(`Getting tenants by business type`, { businessType, skip, take });
    return this.repository.findByBusinessType(businessType, skip, take);
  }

  /**
   * Override create to generate slug and ensure uniqueness.
   * Also associates the tenant with the authenticated user (userId must be passed in DTO extension).
   */
  async create(data: CreateTenantDto & { userId: string }): Promise<Tenant> {
    // Generate slug from business name
    const slugResult = Slug.create(data.businessName);
    if (slugResult.isErr()) {
      throw new ConflictError(slugResult.error);
    }
    const slug = slugResult.getValue().getValue();

    // Check if slug already exists
    const existing = await this.repository.findBySlug(slug, true);
    if (existing) {
      throw new ConflictError('Business name already taken. Please choose another.', { field: 'businessName' });
    }

    const createData = {
      ...data,
      slug,
      isActive: true,
    };

    const tenant = await super.create(createData);

    // Emit domain event for tenant registration
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

  /**
   * Override update to prevent slug changes and re-validation.
   */
  async update(id: string, data: UpdateTenantDto): Promise<Tenant> {
    // Prevent updating slug (businessName changes should not change slug for existing tenants)
    if (data.businessName) {
      this.logger.warn('Attempt to change businessName – slug remains unchanged', { tenantId: id });
      delete data.businessName;
    }
    return super.update(id, data);
  }

  /**
   * Override delete to soft delete (set isActive = false) instead of hard delete.
   */
  async delete(id: string): Promise<Tenant> {
    this.logger.info(`Soft deleting tenant`, { tenantId: id });
    await this.findById(id); // ensure exists
    return this.repository.update(id, { isActive: false } as any);
  }

  protected sanitizeForLog(data: any): any {
    const { ...rest } = data;
    return rest;
  }
}