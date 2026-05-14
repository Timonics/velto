import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { BaseAnalyticsRepository } from '../../../common/repositories/base.analytics.repository';
import {
  IAnalyticsRepository,
  RevenueBySourceResult,
  TopProductResult,
} from './analytics.repository.interface';
import { DateRange } from '../../../common/repositories/base.analytics.repository';

@Injectable()
export class AnalyticsRepositoryImpl
  extends BaseAnalyticsRepository
  implements IAnalyticsRepository
{
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  async getRevenueBySource(
    tenantId: string,
    dateRange?: DateRange,
  ): Promise<RevenueBySourceResult[]> {
    const where: any = {
      tenantId,
      paymentStatus: 'PAID',
    };
    this.applyDateRange(where, dateRange);

    const results = await this.prisma.order.groupBy({
      by: ['utmSource'],
      where,
      _sum: { totalAmount: true },
      _count: { id: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
    });

    return results.map((item) => ({
      source: item.utmSource || 'direct',
      revenue: item._sum.totalAmount || 0,
      orders: item._count.id,
    }));
  }

  async getTopProducts(
    tenantId: string,
    limit: number,
    dateRange?: DateRange,
  ): Promise<TopProductResult[]> {
    const orderWhere: any = {
      tenantId,
      paymentStatus: 'PAID',
    };
    this.applyDateRange(orderWhere, dateRange);

    const results = await this.prisma.orderItem.groupBy({
      by: ['productId', 'productName'],
      where: {
        order: orderWhere,
      },
      _sum: {
        quantity: true,
        unitPrice: true,
      },
      orderBy: {
        _sum: { quantity: 'desc' },
      },
      take: limit,
    });

    return results.map((item) => ({
      productId: item.productId,
      name: item.productName,
      totalSold: item._sum.quantity || 0,
      revenue: (item._sum.unitPrice || 0) * (item._sum.quantity || 0),
    }));
  }

  async getOrderCount(
    tenantId: string,
    dateRange?: DateRange,
  ): Promise<number> {
    const where: any = {
      tenantId,
      paymentStatus: 'PAID',
    };
    this.applyDateRange(where, dateRange);
    return this.prisma.order.count({ where });
  }
}
