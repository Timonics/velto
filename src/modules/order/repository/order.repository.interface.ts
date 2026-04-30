import { IBaseRepository } from '../../../common/repositories/base.repository.interface';
import { Order, Prisma } from 'generated/prisma/client';

export interface IOrderRepository extends IBaseRepository<
  Order,
  Prisma.OrderCreateInput,
  Prisma.OrderUpdateInput
> {
  findByCustomerId(
    customerId: string,
    skip?: number,
    take?: number,
  ): Promise<Order[]>;
  findByTenantId(
    tenantId: string,
    skip?: number,
    take?: number,
  ): Promise<Order[]>;
}
