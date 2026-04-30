import { IBaseService } from '../../../common/services/base.service.interface';
import { Order } from 'generated/prisma/client';
import { CreateOrderDto, UpdateOrderStatusDto } from '../dto';

export interface IOrderService extends IBaseService<
  Order,
  CreateOrderDto,
  UpdateOrderStatusDto
> {
  createOrder(
    data: CreateOrderDto & { customerId: string; tenantId: string },
  ): Promise<Order>;
  updateOrderStatus(orderId: string, status: string): Promise<Order>;
  getCustomerOrders(
    customerId: string,
    skip?: number,
    take?: number,
  ): Promise<Order[]>;
  getTenantOrders(
    tenantId: string,
    skip?: number,
    take?: number,
  ): Promise<Order[]>;
}
