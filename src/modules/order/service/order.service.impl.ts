import { Inject, Injectable } from '@nestjs/common';
import { BaseServiceImpl } from '../../../common/services/base.service.impl';
import { IOrderService } from './order.service.interface';
import { IOrderRepository } from '../repository/order.repository.interface';
import { IProductRepository } from '../../product/repository/product.repository.interface';
import {
  Order,
  Prisma,
  PaymentStatus,
  PaymentHoldStatus,
  OrderStatus,
  OrderItem,
} from 'generated/prisma/client';
import { CreateOrderDto, UpdateOrderStatusDto, OrderItemDto } from '../dto';
import { EventBus } from '../../../domain/events/event-bus.service';
import { ORDER_EVENTS } from '../../../domain/events/event-types';
import { LoggerService } from '../../../common/logger/logger.service';
import { ILogger } from '../../../common/logger/logger.interface';
import { IUserRepository } from 'src/modules/user/repository/user.repository.interface';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from 'src/common/errors/app-error';
import { ITransactionManager } from 'src/common/transactions/transaction-manager.interface';

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
    @Inject('IOrderRepository')
    protected readonly repository: IOrderRepository,
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBus,
    @Inject('ITransactionManager')
    private readonly transactionManager: ITransactionManager,
    logger: LoggerService,
  ) {
    super(repository);
    this.logger = logger.child('OrderService');
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
    data: Omit<CreateOrderDto, 'items'> & {
      items: OrderItemDto[];
      customerId: string;
    },
  ): Promise<Order & { orderItems?: any[] }> {
    // Validate items array not empty
    if (!data.items || data.items.length === 0) {
      throw new BadRequestError('Order must contain at least one item');
    }

    // Fetch all products
    const productIds = data.items.map((item) => item.productId);
    const products = await this.productRepository.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      throw new NotFoundError('One or more products not found');
    }

    // Validate all products belong to same tenant
    const tenantId = products[0].tenantId;
    const allSameTenant = products.every((p) => p.tenantId === tenantId);
    if (!allSameTenant) {
      throw new BadRequestError(
        'All products in an order must belong to the same seller',
      );
    }

    // Calculate total and prepare order items snapshot data
    let subtotal = 0;
    const orderItemsData: any[] = [];

    for (const item of data.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product)
        throw new NotFoundError(`Product ${item.productId} not found`);

      if (product.stock < item.quantity) {
        throw new BadRequestError(
          `Insufficient stock for product: ${product.name}`,
        );
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItemsData.push({
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        productImage: product.mediaUrls?.[0] || null,
        quantity: item.quantity,
        unitPrice: product.price,
      });
    }

    const deliveryFee = data.deliveryFee || 0;
    const totalAmount = subtotal + deliveryFee;

    // Fetch customer details for event
    const user = await this.userRepository.findById(data.customerId);
    if (!user) throw new NotFoundError('Customer not found');

    return this.transactionManager.runInTransaction(async (txContext) => {
      // Create Order record with nested OrderItems
      const orderInput: Prisma.OrderCreateInput = {
        orderNumber: this.generateOrderNumber(),
        totalAmount,
        deliveryFee,
        paymentStatus: PaymentStatus.PENDING,
        paymentHoldStatus: PaymentHoldStatus.NOT_HELD,
        source: data.source || null,
        utmSource: data.utmSource || null,
        utmMedium: data.utmMedium || null,
        utmCampaign: data.utmCampaign || null,
        utmTerm: data.utmTerm || null,
        utmContent: data.utmContent || null,
        deliveryAddress: data.deliveryAddress,
        status: 'PENDING',
        paymentMethod: data.paymentMethod,
        customer: { connect: { id: data.customerId } },
        tenant: { connect: { id: tenantId } },
        orderItems: {
          create: orderItemsData,
        },
      };

      const order = await this.repository.create(orderInput, txContext.client);

      // Decrement stock for each product
      for (const item of data.items) {
        await this.productRepository.updateStock(
          item.productId,
          item.quantity,
          txContext.client,
        );
      }

      // Emit domain event with items array
      await this.eventBus.emit({
        name: ORDER_EVENTS.CREATED,
        payload: {
          orderId: order.id,
          tenantId: order.tenantId,
          customerId: order.customerId,
          totalPrice: order.totalAmount,
          customerName: 'Customer',
          customerPhone: user.phone,
          customerEmail: user.email ?? '',
          items: orderItemsData.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.unitPrice,
          })),
        },
      });

      this.logger.info(
        `Order created: ${order.orderNumber} with ${orderItemsData.length} items`,
      );
      return { ...order, orderItems: orderItemsData };
    });
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    const order = await this.update(orderId, {
      status,
    } as UpdateOrderStatusDto);
    // TODO: emit event
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

  async confirmOrderByToken(
    token: string,
    customerPhone: string,
  ): Promise<Order> {
    // Find order by release token
    const order = await this.repository.findOne({
      where: { releaseToken: token },
      include: { customer: true, tenant: true },
    });
    if (!order) throw new NotFoundError('Order', token);

    // Validate hold status
    if (order.paymentHoldStatus !== 'HELD') {
      throw new BadRequestError('Order is not in held status');
    }

    // Validate phone number (denormalized or from relation)
    const orderCustomerPhone = (order as any).customer?.phone;
    if (orderCustomerPhone && orderCustomerPhone !== customerPhone) {
      throw new ForbiddenError('Phone number does not match order');
    }

    // Update order
    const updated = await this.repository.update(order.id, {
      paymentHoldStatus: 'RELEASED',
      status: OrderStatus.COMPLETED,
    });

    // Emit event for fund release and notifications
    await this.eventBus.emit({
      name: ORDER_EVENTS.COMPLETED,
      payload: { orderId: order.id, token, tenantId: order.tenantId },
    });

    this.logger.info(`Order ${order.id} confirmed via token ${token}`);
    return updated;
  }

  async getCustomerHistory(
    tenantId: string,
    skip = 0,
    take = 20,
  ): Promise<{ customers: any[]; total: number }> {
    // Group orders by customer
    const orders = await this.repository.findMany({
      where: { tenantId, paymentStatus: 'PAID' },
      include: { customer: true },
      skip,
      take,
    });

    const customerMap = new Map<string, any>();
    for (const order of orders) {
      const customer = (order as any).customer;
      if (!customer) continue;
      if (!customerMap.has(customer.id)) {
        customerMap.set(customer.id, {
          customerId: customer.id,
          phone: customer.phone,
          email: customer.email,
          totalOrders: 0,
          totalSpent: 0,
          firstOrderAt: order.createdAt,
          lastOrderAt: order.createdAt,
        });
      }
      const record = customerMap.get(customer.id);
      record.totalOrders++;
      record.totalSpent += order.totalAmount;
      if (order.createdAt < record.firstOrderAt)
        record.firstOrderAt = order.createdAt;
      if (order.createdAt > record.lastOrderAt)
        record.lastOrderAt = order.createdAt;
    }

    const customers = Array.from(customerMap.values());
    const total = customers.length;

    return { customers, total };
  }

  async reorder(orderId: string, customerId: string): Promise<Order> {
    const previousOrder = await this.repository.findById(orderId, {
      orderItems: true,
    });
    if (!previousOrder) throw new NotFoundError('Order not found');
    if (previousOrder.customerId !== customerId)
      throw new ForbiddenError('Not your order');

    const orderItems = (previousOrder as any).orderItems as OrderItem[];
    if (!orderItems.length) throw new BadRequestError('No items to reorder');

    const items = orderItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    // Fetch current product data for stock check
    const productIds = orderItems.map((item) => item.productId);
    const products = await this.productRepository.findMany({
      where: { id: { in: productIds } },
    });

    const unavailableProducts: string[] = [];
    const availableItems: { productId: string; quantity: number }[] = [];

    for (const item of orderItems) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        unavailableProducts.push(
          `Product ${item.productName || item.productId} (not found)`,
        );
        continue;
      }
      if (product.stock < item.quantity) {
        unavailableProducts.push(
          `${product.name} (only ${product.stock} left, need ${item.quantity})`,
        );
        continue;
      }
      availableItems.push({
        productId: item.productId,
        quantity: item.quantity,
      });
    }

    if (unavailableProducts.length > 0) {
      throw new BadRequestError(
        `Cannot reorder. Unavailable: ${unavailableProducts.join(', ')}`,
      );
    }

    if (availableItems.length === 0) {
      throw new BadRequestError('No available items to reorder');
    }

    const newOrder = await this.createOrder({
      items,
      deliveryAddress: previousOrder.deliveryAddress, // could allow override via DTO
      paymentMethod: previousOrder.paymentMethod!,
      deliveryFee: previousOrder.deliveryFee,
      source: 'reorder',
      customerId,
    });

    return newOrder;
  }
}
