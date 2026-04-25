import { IBaseService } from '../../../common/services/base.service.interface';
import { Tenant } from 'generated/prisma/client';
import { CreateTenantDto, UpdateTenantDto } from '../dto';

export interface ITenantService extends IBaseService<Tenant, CreateTenantDto, UpdateTenantDto> {
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
  getByCategory(category: string, skip?: number, take?: number): Promise<Tenant[]>;

  /**
   * Get tenants by business type
   */
  getByBusinessType(businessType: string, skip?: number, take?: number): Promise<Tenant[]>;
}