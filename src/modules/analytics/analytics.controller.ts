import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { TenantOwnerGuard } from '../../common/guards/tenant-owner.guard';
import { Tenant } from 'generated/prisma/client';
import {
  createSuccessResponse,
  ApiResponse,
} from '../../common/dto/api-response.dto';
import {
  RevenueBySourceResponse,
  TopProductResponse,
  OrderCountResponse,
} from './dto/analytics-response.dto';

@Controller('analytics')
@UseGuards(TenantOwnerGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('revenue-by-source')
  async getRevenueBySource(
    @CurrentTenant() tenant: Tenant,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ApiResponse<RevenueBySourceResponse>> {
    const dateRange = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };
    const result = await this.analyticsService.getRevenueBySource(
      tenant.id,
      dateRange,
    );
    return createSuccessResponse(result);
  }

  @Get('top-products')
  async getTopProducts(
    @CurrentTenant() tenant: Tenant,
    @Query('limit') limit = '10',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ApiResponse<TopProductResponse[]>> {
    const dateRange = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };
    const result = await this.analyticsService.getTopProducts(
      tenant.id,
      parseInt(limit, 10),
      dateRange,
    );
    return createSuccessResponse(result);
  }

  @Get('order-count')
  async getOrderCount(
    @CurrentTenant() tenant: Tenant,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ApiResponse<OrderCountResponse>> {
    const dateRange = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };
    const totalOrders = await this.analyticsService.getOrderCount(
      tenant.id,
      dateRange,
    );
    return createSuccessResponse({ totalOrders });
  }
}
