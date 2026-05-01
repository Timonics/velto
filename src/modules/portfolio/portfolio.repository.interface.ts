import { IBaseRepository } from '../../common/repositories/base.repository.interface';
import { PortfolioItem, Prisma } from 'generated/prisma/client';

export interface IPortfolioRepository extends IBaseRepository<
  PortfolioItem,
  Prisma.PortfolioItemCreateInput,
  Prisma.PortfolioItemUpdateInput
> {
  /**
   * Retrieves portfolio items for a specific tenant.
   * @param tenantId
   * @param skip
   * @param take
   */
  findByTenantId(
    tenantId: string,
    skip?: number,
    take?: number,
  ): Promise<PortfolioItem[]>;
}
