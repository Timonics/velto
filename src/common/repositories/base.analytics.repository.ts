import { PrismaService } from '../../infrastructure/database/prisma.service';

export interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

export abstract class BaseAnalyticsRepository {
  constructor(protected readonly prisma: PrismaService) {}

  /**
   * Helper to apply date range filter to a `where` clause.
   */
  protected applyDateRange(where: any, dateRange?: DateRange): void {
    if (dateRange?.startDate || dateRange?.endDate) {
      where.createdAt = {};
      if (dateRange.startDate) where.createdAt.gte = dateRange.startDate;
      if (dateRange.endDate) where.createdAt.lte = dateRange.endDate;
    }
  }

  /**
   * Helper to apply date range to a nested relation (e.g., order items).
   */
  protected applyNestedDateRange(
    nestedWhere: any,
    dateRange?: DateRange,
  ): void {
    if (dateRange?.startDate || dateRange?.endDate) {
      nestedWhere.order = { createdAt: {} };
      if (dateRange.startDate)
        nestedWhere.order.createdAt.gte = dateRange.startDate;
      if (dateRange.endDate)
        nestedWhere.order.createdAt.lte = dateRange.endDate;
    }
  }
}
