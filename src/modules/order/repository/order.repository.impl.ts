import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { BaseRepositoryImpl } from '../../../common/repositories/base.repository.impl';
import { IOrderRepository } from './order.repository.interface';
import { Order, Prisma } from 'generated/prisma/client';

@Injectable()
export class OrderRepositoryImpl
  extends BaseRepositoryImpl<
    Prisma.OrderDelegate,
    Order,
    Prisma.OrderCreateInput,
    Prisma.OrderUpdateInput
  >
  implements IOrderRepository
{
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, prisma.order);
  }

  async findByCustomerId(
    customerId: string,
    skip = 0,
    take = 20,
  ): Promise<Order[]> {
    return this.modelDelegate.findMany({
      where: { customerId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { product: true, tenant: true },
    });
  }

  async findByTenantId(
    tenantId: string,
    skip = 0,
    take = 20,
  ): Promise<Order[]> {
    return this.modelDelegate.findMany({
      where: { tenantId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { product: true },
    });
  }
}
