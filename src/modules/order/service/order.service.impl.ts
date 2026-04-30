import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { BaseServiceImpl } from '../../../common/services/base.service.impl';
import { IOrderService } from './order.service.interface';
import { IOrderRepository } from '../repository/order.repository.interface';
import { IProductRepository } from '../../product/repository/product.repository.interface';
import { Order, Prisma } from 'generated/prisma/client';
import { CreateOrderDto, UpdateOrderStatusDto } from '../dto';
import { EventBus } from '../../../domain/events/event-bus.service';
import { ORDER_EVENTS } from '../../../domain/events/event-types';
import { LoggerService } from '../../../common/logger/logger.service';
import { ILogger } from '../../../common/logger/logger.interface';
import { IUserRepository } from 'src/modules/user/user.repository.interface';

@Injectable()
export class OrderServiceImpl
  extends BaseServiceImpl<
    Order,
    CreateOrderDto,
    UpdateOrderStatusDto,
    Prisma.OrderCreateInput,
    Prisma.OrderUpdateInput
  >
  implements IOrderService
{
  protected readonly logger: ILogger;
  protected readonly entityName = 'Order';

  constructor(
    protected readonly repository: IOrderRepository,
    private readonly productRepository: IProductRepository,
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBus,
    logger: LoggerService,
  ) {
    super(repository);
    this.logger = logger.child('OrderService');
  }

  protected mapToCreateInput(
    dto: CreateOrderDto & { customerId: string; tenantId: string },
  ): Prisma.OrderCreateInput {
    return {
      orderNumber: this.generateOrderNumber(),
      quantity: dto.quantity,
      totalPrice: 0, // will be set after fetching product price
      deliveryAddress: dto.deliveryAddress,
      status: 'PENDING',
      paymentMethod: dto.paymentMethod,
      product: { connect: { id: dto.productId } },
      customer: { connect: { id: dto.customerId } },
      tenant: { connect: { id: dto.tenantId } },
    };
  }

  protected mapToUpdateInput(
    dto: UpdateOrderStatusDto,
  ): Prisma.OrderUpdateInput {
    return { status: dto.status };
  }

  private generateOrderNumber(): string {
    return `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  async createOrder(
    data: CreateOrderDto & { customerId: string; tenantId: string },
  ): Promise<Order> {
    // Fetch product to get price and check stock
    const product = await this.productRepository.findById(data.productId);
    if (!product) throw new NotFoundException('Product not found');
    if (product.stock < data.quantity) throw new Error('Insufficient stock');

    // Fetch customer user details
    const user = await this.userRepository.findById(data.customerId);
    if (!user) throw new NotFoundException('Customer not found');

    const totalPrice = product.price * data.quantity;
    const input: Prisma.OrderCreateInput = {
      orderNumber: this.generateOrderNumber(),
      quantity: data.quantity,
      totalPrice,
      deliveryAddress: data.deliveryAddress,
      status: 'PENDING',
      paymentMethod: data.paymentMethod,
      product: { connect: { id: data.productId } },
      customer: { connect: { id: data.customerId } },
      tenant: { connect: { id: data.tenantId } },
    };
    const order = await this.repository.create(input);

    // Decrement product stock
    await this.productRepository.updateStock(data.productId, data.quantity);

    // Emit domain event
    await this.eventBus.emit({
      name: ORDER_EVENTS.CREATED,
      payload: {
        orderId: order.id,
        tenantId: order.tenantId,
        customerId: order.customerId,
        totalPrice: order.totalPrice,
        customerName: 'Customer', // assuming user has name? Not in schema. Maybe from Customer model.
        customerPhone: user.phone,
        customerEmail: user.email ?? "",
        items: [
          {
            productId: product.id,
            quantity: data.quantity,
            price: product.price,
          },
        ],
      },
    });

    this.logger.info(`Order created: ${order.orderNumber}`);
    return order;
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    const order = await this.update(orderId, {
      status,
    } as UpdateOrderStatusDto);
    // await this.eventBus.emit({
    //   name: ORDER_EVENTS.UPDATED,
    //   payload: { orderId: order.id, orderNumber: order.orderNumber, status },
    // });
    return order;
  }

  async getCustomerOrders(
    customerId: string,
    skip = 0,
    take = 20,
  ): Promise<Order[]> {
    return this.repository.findByCustomerId(customerId, skip, take);
  }

  async getTenantOrders(
    tenantId: string,
    skip = 0,
    take = 20,
  ): Promise<Order[]> {
    return this.repository.findByTenantId(tenantId, skip, take);
  }
}
