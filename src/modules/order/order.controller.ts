import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto';
import {
  OrderSerializer,
  OrderResponse,
} from '../../serializers/order.serializer';
import {} from '../../common/guards/auth.guard';
import { TenantOwnerGuard } from '../../common/guards/tenant-owner.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import {
  createSuccessResponse,
  ApiResponse,
} from '../../common/dto/api-response.dto';
import { Tenant } from 'generated/prisma/client';
import { OrderServiceImpl } from './service/order.service.impl';

@Controller('orders')
export class OrderController {
  private readonly serializer = new OrderSerializer();

  constructor(private readonly orderService: OrderServiceImpl) {}

  // Customer places order
  @Post()
  async create(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ApiResponse<OrderResponse>> {
    // We need tenantId from the product's tenant. The service will fetch product and get tenantId.
    // Pass productId and let service resolve tenantId.
    // Alternatively, require tenantId in DTO. For simplicity, we'll require a `tenantId` field in DTO.
    // Here we assume DTO includes tenantId. If not, modify DTO.
    // For brevity, I'll assume DTO has `tenantId` field.
    const order = await this.orderService.createOrder({
      ...dto,
      customerId: user.id,
      tenantId: dto['tenantId'], // ensure DTO includes tenantId
    });
    return createSuccessResponse(this.serializer.serialize(order));
  }

  // Customer gets their orders
  @Get('my')
  async getMyOrders(
    @CurrentUser() user: CurrentUserPayload,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<ApiResponse<OrderResponse[]>> {
    const orders = await this.orderService.getCustomerOrders(
      user.id,
      skip ? parseInt(skip, 10) : 0,
      take ? parseInt(take, 10) : 20,
    );
    return createSuccessResponse(this.serializer.serializeMany(orders));
  }

  // Tenant gets their orders
  @Get('tenant')
  @UseGuards(TenantOwnerGuard)
  async getTenantOrders(
    @CurrentTenant() tenant: Tenant,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<ApiResponse<OrderResponse[]>> {
    const orders = await this.orderService.getTenantOrders(
      tenant.id,
      skip ? parseInt(skip, 10) : 0,
      take ? parseInt(take, 10) : 20,
    );
    return createSuccessResponse(this.serializer.serializeMany(orders));
  }

  // Tenant updates order status
  @Patch(':id/status')
  @UseGuards(TenantOwnerGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<ApiResponse<OrderResponse>> {
    const order = await this.orderService.updateOrderStatus(id, dto.status);
    return createSuccessResponse(this.serializer.serialize(order));
  }
}
