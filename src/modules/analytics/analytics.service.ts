import { Injectable, Inject } from '@nestjs/common';
import { IAnalyticsRepository } from './repository/analytics.repository.interface';
import { LoggerService } from '../../common/logger/logger.service';
import { ILogger } from '../../common/logger/logger.interface';
import { DateRange } from '../../common/repositories/base.analytics.repository';

@Injectable()
export class AnalyticsService {
  private readonly logger: ILogger;

  constructor(
    @Inject('IAnalyticsRepository')
    private readonly analyticsRepository: IAnalyticsRepository,
    logger: LoggerService,
  ) {
    this.logger = logger.child('AnalyticsService');
  }

  async getRevenueBySource(tenantId: string, dateRange?: DateRange) {
    const data = await this.analyticsRepository.getRevenueBySource(
      tenantId,
      dateRange,
    );
    const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrders = data.reduce((sum, item) => sum + item.orders, 0);
    return {
      sources: data,
      summary: {
        totalRevenue,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      },
    };
  }

  async getTopProducts(tenantId: string, limit = 10, dateRange?: DateRange) {
    return this.analyticsRepository.getTopProducts(tenantId, limit, dateRange);
  }

  async getOrderCount(
    tenantId: string,
    dateRange?: DateRange,
  ): Promise<number> {
    return this.analyticsRepository.getOrderCount(tenantId, dateRange);
  }
}
