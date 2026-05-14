import { IBaseService } from '../../../common/services/base.service.interface';
import { Tenant } from 'generated/prisma/client';
import { CreateTenantDto, UpdateBrandingDto, UpdateTenantDto } from '../dto';

export interface ITenantService extends IBaseService<
  Tenant,
  CreateTenantDto,
  UpdateTenantDto
> {
  /**
   * Override base create to handle tenant-specific logic
   */
  create(data: CreateTenantDto & { userId: string }): Promise<Tenant>;

  /**
   * Find tenant by slug (from subdomain)
   */
  findBySlug(slug: string): Promise<Tenant | null>;

  /**
   * Get tenant storefront with all related data
   */
  getStorefront(slug: string): Promise<Tenant | null>;

  /**
   * Search tenants for marketplace
   */
  searchTenants(query: string, skip?: number, take?: number): Promise<Tenant[]>;

  /**
   * Get tenants by category
   */
  getByCategory(
    category: string,
    skip?: number,
    take?: number,
  ): Promise<Tenant[]>;

  /**
   * Get tenants by business type
   */
  getByBusinessType(
    businessType: string,
    skip?: number,
    take?: number,
  ): Promise<Tenant[]>;

  /**
   * Verify tenant (used by admin to approve/reject tenant applications)
   */
  verifyTenant(tenantId: string, isVerified: boolean): Promise<Tenant>;

  /**
   * Update tenant branding (used by tenant owners to update their storefront)
   */
  updateBranding(
    tenantId: string,
    branding: UpdateBrandingDto,
  ): Promise<Tenant>;
}
