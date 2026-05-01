import { IBaseService } from '../../common/services/base.service.interface';
import { PortfolioItem } from 'generated/prisma/client';
import { CreatePortfolioItemDto, UpdatePortfolioItemDto } from './dto';

export interface IPortfolioService extends IBaseService<
  PortfolioItem,
  CreatePortfolioItemDto,
  UpdatePortfolioItemDto
> {
  /**
   * Retrieves portfolio items for a specific tenant.
   *
   * @param tenantId
   * @param skip
   * @param take
   */
  getPortfolioByTenant(
    tenantId: string,
    skip?: number,
    take?: number,
  ): Promise<PortfolioItem[]>;

  /**
   * Creates a new portfolio item associated with a tenant.
   * @param data
   */
  create(
    data: CreatePortfolioItemDto & { tenantId: string },
  ): Promise<PortfolioItem>;
}
