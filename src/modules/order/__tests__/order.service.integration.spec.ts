import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { OrderServiceImpl } from '../../../modules/order/service/order.service.impl';
import { OrderRepositoryImpl } from '../../../modules/order/repository/order.repository.impl';
import { ProductRepositoryImpl } from '../../../modules/product/repository/product.repository.impl';
import { UserRepositoryImpl } from '../../../modules/user/repository/user.repository.impl';
import { EventBus } from '../../../domain/events/event-bus.service';
import { PrismaTransactionManager } from '../../../infrastructure/database/prisma.transaction-manager';
import { LoggerService } from '../../../common/logger/logger.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  Role,
  BusinessType,
  Category,
  OrderStatus,
} from 'generated/prisma/client';
import * as bcrypt from 'bcrypt';

describe('OrderService Integration (Transaction)', () => {
  let prisma: PrismaService;
  let orderService: OrderServiceImpl;
  let eventBusMock: jest.Mocked<EventBus>;
  let testData: {
    userId: string;
    tenantId: string;
    productId: string;
  };

  beforeAll(async () => {
    // Use real PrismaService with test database
    prisma = new PrismaService();
    await prisma.$connect();

    // Clean database
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.tenant.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        phone: '+2348012345678',
        email: 'integration@example.com',
        passwordHash: hashedPassword,
        role: Role.CUSTOMER,
        customer: { create: {} },
      },
    });

    // Create test tenant
    const tenant = await prisma.tenant.create({
      data: {
        businessName: 'Integration Store',
        slug: 'integration-store',
        businessType: BusinessType.PRODUCT_SELLER,
        category: Category.ELECTRONICS,
        isActive: true,
        user: { connect: { id: user.id } },
      },
    });

    // Create test product with stock 10
    const product = await prisma.product.create({
      data: {
        name: 'Test Product',
        price: 100,
        stock: 10,
        category: Category.ELECTRONICS,
        isAvailable: true,
        tenant: { connect: { id: tenant.id } },
      },
    });

    testData = {
      userId: user.id,
      tenantId: tenant.id,
      productId: product.id,
    };
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Reset mocks before each test
    eventBusMock = { emit: jest.fn() } as any;

    // Build module with real repositories + mocked EventBus
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        { provide: 'IOrderRepository', useClass: OrderRepositoryImpl },
        { provide: 'IProductRepository', useClass: ProductRepositoryImpl },
        { provide: 'IUserRepository', useClass: UserRepositoryImpl },
        { provide: EventBus, useValue: eventBusMock },
        { provide: 'ITransactionManager', useClass: PrismaTransactionManager },
        {
          provide: LoggerService,
          useValue: {
            child: jest
              .fn()
              .mockReturnValue({
                info: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
              }),
          },
        },
        OrderServiceImpl,
      ],
    }).compile();

    orderService = module.get<OrderServiceImpl>(OrderServiceImpl);
  });

  afterEach(async () => {
    // Clean up orders and order items after each test
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    // Reset product stock to 10
    await prisma.product.update({
      where: { id: testData.productId },
      data: { stock: 10 },
    });
  });

  it('should successfully create order and deduct stock (happy path)', async () => {
    const createData = {
      items: [{ productId: testData.productId, quantity: 2 }],
      customerId: testData.userId,
      deliveryAddress: '123 Test St',
      paymentMethod: 'card',
      deliveryFee: 50,
    };

    const order = await orderService.createOrder(createData);

    // Verify order created
    expect(order).toBeDefined();
    expect(order.totalAmount).toBe(250); // 2*100 + 50
    expect(order.status).toBe(OrderStatus.PENDING);

    // Verify stock decreased
    const product = await prisma.product.findUnique({
      where: { id: testData.productId },
    });
    expect(product?.stock).toBe(8);

    // Verify order items created
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId: order.id },
    });
    expect(orderItems).toHaveLength(1);
    expect(orderItems[0].quantity).toBe(2);

    // Verify event emitted
    expect(eventBusMock.emit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'order.created' }),
    );
  });

  it('should rollback entire transaction if product stock insufficient', async () => {
    // Set stock to 1
    await prisma.product.update({
      where: { id: testData.productId },
      data: { stock: 1 },
    });

    const createData = {
      items: [{ productId: testData.productId, quantity: 5 }],
      customerId: testData.userId,
      deliveryAddress: '123 Test St',
    };

    await expect(orderService.createOrder(createData)).rejects.toThrow(
      BadRequestException,
    );

    // Verify no order created
    const orders = await prisma.order.findMany();
    expect(orders).toHaveLength(0);

    // Verify stock unchanged (still 1)
    const product = await prisma.product.findUnique({
      where: { id: testData.productId },
    });
    expect(product?.stock).toBe(1);

    // Verify no event emitted
    expect(eventBusMock.emit).not.toHaveBeenCalled();
  });

  it('should rollback if product not found', async () => {
    const createData = {
      items: [{ productId: 'non-existent-id', quantity: 1 }],
      customerId: testData.userId,
      deliveryAddress: '123 Test St',
    };

    await expect(orderService.createOrder(createData)).rejects.toThrow(
      NotFoundException,
    );

    const orders = await prisma.order.findMany();
    expect(orders).toHaveLength(0);

    const product = await prisma.product.findUnique({
      where: { id: testData.productId },
    });
    expect(product?.stock).toBe(10); // unchanged

    expect(eventBusMock.emit).not.toHaveBeenCalled();
  });

  it('should rollback if products belong to different tenants', async () => {
    // Create second tenant and product
    const secondTenant = await prisma.tenant.create({
      data: {
        businessName: 'Second Store',
        slug: 'second-store',
        businessType: BusinessType.PRODUCT_SELLER,
        category: Category.FASHION,
        isActive: true,
        user: { connect: { id: testData.userId } },
      },
    });
    const secondProduct = await prisma.product.create({
      data: {
        name: 'Second Product',
        price: 50,
        stock: 10,
        category: Category.FASHION,
        isAvailable: true,
        tenant: { connect: { id: secondTenant.id } },
      },
    });

    const createData = {
      items: [
        { productId: testData.productId, quantity: 1 },
        { productId: secondProduct.id, quantity: 1 },
      ],
      customerId: testData.userId,
      deliveryAddress: '123 Test St',
    };

    await expect(orderService.createOrder(createData)).rejects.toThrow(
      BadRequestException,
    );

    // No orders created
    const orders = await prisma.order.findMany();
    expect(orders).toHaveLength(0);

    // Both products stock unchanged
    const product1 = await prisma.product.findUnique({
      where: { id: testData.productId },
    });
    const product2 = await prisma.product.findUnique({
      where: { id: secondProduct.id },
    });
    expect(product1?.stock).toBe(10);
    expect(product2?.stock).toBe(10);
  });
});
