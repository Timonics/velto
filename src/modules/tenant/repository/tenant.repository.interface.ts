import { IBaseRepository } from '../../../common/repositories/base.repository.interface';
import { Tenant, Prisma } from 'generated/prisma/client';

export interface ITenantRepository extends IBaseRepository<
  Tenant,
  Prisma.TenantCreateInput,
  Prisma.TenantUpdateInput
> {
  /**
   * Find tenant by slug (subdomain identifier)
   */
  findBySlug(slug: string, includeInactive?: boolean): Promise<Tenant | null>;

  /**
   * Find tenants by business type (PRODUCT_SELLER / SERVICE_PROVIDER)
   */
  findByBusinessType(
    businessType: string,
    skip?: number,
    take?: number,
  ): Promise<Tenant[]>;

  /**
   * Search tenants by business name, description, or location
   */
  searchTenants(
    searchTerm: string,
    skip?: number,
    take?: number,
  ): Promise<Tenant[]>;

  /**
   * Get tenant with full storefront data (products, services, portfolio)
   */
  getStorefront(slug: string): Promise<Tenant | null>;

  /**
   * Find tenants by category with pagination
   */
  findByCategory(
    category: string,
    skip?: number,
    take?: number,
  ): Promise<Tenant[]>;
}
