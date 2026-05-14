import { DateRange } from '../../../common/repositories/base.analytics.repository';

export interface RevenueBySourceResult {
  source: string;
  revenue: number;
  orders: number;
}

export interface TopProductResult {
  productId: string;
  name: string;
  totalSold: number;
  revenue: number;
}

export interface IAnalyticsRepository {
  getRevenueBySource(
    tenantId: string,
    dateRange?: DateRange,
  ): Promise<RevenueBySourceResult[]>;

  getTopProducts(
    tenantId: string,
    limit: number,
    dateRange?: DateRange,
  ): Promise<TopProductResult[]>;

  getOrderCount(tenantId: string, dateRange?: DateRange): Promise<number>;
}
