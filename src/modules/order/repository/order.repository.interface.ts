import { IBaseRepository } from '../../../common/repositories/base.repository.interface';
import { Order, Prisma } from 'generated/prisma/client';

export interface IOrderRepository extends IBaseRepository<
  Order,
  Prisma.OrderCreateInput,
  Prisma.OrderUpdateInput
> {
  /**
   * Find orders by customer ID with pagination.
   * @param customerId - The customer's user ID.
   * @param skip - Number of records to skip.
   * @param take - Number of records to take.
   * @param tx - Optional transactional client.
   */
  findByCustomerId(
    customerId: string,
    skip?: number,
    take?: number,
    tx?: any,
  ): Promise<Order[]>;

  /**
   * Find orders by tenant ID with pagination.
   * @param tenantId - The tenant ID.
   * @param skip - Number of records to skip.
   * @param take - Number of records to take.
   * @param tx - Optional transactional client.
   */
  findByTenantId(
    tenantId: string,
    skip?: number,
    take?: number,
    tx?: any,
  ): Promise<Order[]>;
}