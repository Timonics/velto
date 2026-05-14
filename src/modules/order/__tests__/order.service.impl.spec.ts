import { OrderServiceImpl } from '../service/order.service.impl';
import { IOrderRepository } from '../repository/order.repository.interface';
import { IProductRepository } from '../../product/repository/product.repository.interface';
import { IUserRepository } from '../../user/repository/user.repository.interface';
import { EventBus } from '../../../domain/events/event-bus.service';
import { ITransactionManager } from '../../../common/transactions/transaction-manager.interface';
import { LoggerService } from '../../../common/logger/logger.service';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from '../../../common/errors/app-error';
import {
  OrderStatus,
  PaymentStatus,
  PaymentHoldStatus,
} from 'generated/prisma/client';

describe('OrderServiceImpl', () => {
  let service: OrderServiceImpl;
  let orderRepository: jest.Mocked<IOrderRepository>;
  let productRepository: jest.Mocked<IProductRepository>;
  let userRepository: jest.Mocked<IUserRepository>;
  let eventBus: jest.Mocked<EventBus>;
  let transactionManager: jest.Mocked<ITransactionManager>;

  const mockUserId = 'user-123';
  const mockTenantId = 'tenant-456';
  const mockProductId = 'product-789';
  const mockOrderId = 'order-001';
  const mockOrderNumber = 'ORD-1234567890';

  const mockProduct = {
    id: mockProductId,
    name: 'Test Product',
    price: 100,
    stock: 10,
    tenantId: mockTenantId,
    mediaUrls: ['https://example.com/img.jpg'],
  };

  const mockUser = {
    id: mockUserId,
    phone: '+2348012345678',
    email: 'customer@example.com',
  };

  const mockOrder = {
    id: mockOrderId,
    orderNumber: mockOrderNumber,
    customerId: mockUserId,
    tenantId: mockTenantId,
    totalAmount: 250,
    deliveryFee: 50,
    paymentStatus: PaymentStatus.PENDING,
    paymentHoldStatus: PaymentHoldStatus.NOT_HELD,
    deliveryAddress: '123 Main St',
    status: OrderStatus.PENDING,
    paymentMethod: 'card',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    orderRepository = {
      findById: jest.fn(),
      findByCustomerId: jest.fn(),
      findByTenantId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findOne: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    } as any;

    productRepository = {
      findById: jest.fn(),
      findMany: jest.fn(),
      updateStock: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByTenantId: jest.fn(),
      findByCategory: jest.fn(),
      count: jest.fn(),
    } as any;

    userRepository = {
      findById: jest.fn(),
      findByPhone: jest.fn(),
      findByEmail: jest.fn(),
      updateRefreshToken: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    } as any;

    eventBus = { emit: jest.fn() } as any;
    transactionManager = {
      runInTransaction: jest.fn((callback) => callback({ client: {} })),
    } as any;

    const loggerMock = {
      child: jest.fn().mockReturnValue({
        info: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        error: jest.fn(),
      }),
    };

    service = new OrderServiceImpl(
      orderRepository,
      productRepository,
      userRepository,
      eventBus,
      transactionManager,
      loggerMock as any,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    const createData = {
      items: [{ productId: mockProductId, quantity: 2 }],
      customerId: mockUserId,
      deliveryAddress: '123 Main St',
      paymentMethod: 'card',
      deliveryFee: 50,
      source: 'test',
    };

    it('should create order successfully with valid items', async () => {
      productRepository.findMany.mockResolvedValue([mockProduct as any]);
      userRepository.findById.mockResolvedValue(mockUser as any);
      orderRepository.create.mockResolvedValue({
        ...mockOrder,
        orderNumber: 'NEW-ORDER-123',
        id: 'new-id',
      } as any);
      productRepository.updateStock.mockResolvedValue({} as any);

      const result = await service.createOrder(createData);

      expect(result).toBeDefined();
      expect(orderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          totalAmount: 250,
          deliveryFee: 50,
          paymentStatus: PaymentStatus.PENDING,
          deliveryAddress: '123 Main St',
          status: OrderStatus.PENDING,
        }),
        {}, // client from transaction mock
      );
      expect(productRepository.updateStock).toHaveBeenCalledWith(
        mockProductId,
        2,
        {},
      );
      expect(eventBus.emit).toHaveBeenCalled();
    });

    it('should throw BadRequestError if items array is empty', async () => {
      await expect(
        service.createOrder({ ...createData, items: [] }),
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw NotFoundError if product not found', async () => {
      productRepository.findMany.mockResolvedValue([]);
      await expect(service.createOrder(createData)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should throw BadRequestError if product stock insufficient', async () => {
      productRepository.findMany.mockResolvedValue([
        { ...mockProduct, stock: 1 } as any,
      ]);
      await expect(service.createOrder(createData)).rejects.toThrow(
        BadRequestError,
      );
    });

    it('should throw BadRequestError if products belong to different tenants', async () => {
      const otherProduct = {
        ...mockProduct,
        id: 'other',
        tenantId: 'other-tenant',
      };
      productRepository.findMany.mockResolvedValue([
        mockProduct,
        otherProduct,
      ] as any);

      const multiItemData = {
        ...createData,
        items: [
          { productId: mockProductId, quantity: 1 },
          { productId: 'other', quantity: 1 },
        ],
      };

      await expect(service.createOrder(multiItemData)).rejects.toThrow(
        BadRequestError,
      );
    });
  });

  describe('reorder', () => {
    const orderWithItems = {
      ...mockOrder,
      orderItems: [{ productId: mockProductId, quantity: 2, unitPrice: 100 }],
    };

    it('should reorder successfully', async () => {
      orderRepository.findById.mockResolvedValue(orderWithItems as any);
      productRepository.findMany.mockResolvedValue([mockProduct as any]);
      userRepository.findById.mockResolvedValue(mockUser as any);
      orderRepository.create.mockResolvedValue({
        ...mockOrder,
        id: 'new-order',
      } as any);
      productRepository.updateStock.mockResolvedValue({} as any);

      const result = await service.reorder(mockOrderId, mockUserId);
      expect(result.id).toBe('new-order');
      expect(orderRepository.create).toHaveBeenCalled();
      expect(eventBus.emit).toHaveBeenCalled();
    });

    it('should throw NotFoundError if original order not found', async () => {
      orderRepository.findById.mockResolvedValue(null);
      await expect(service.reorder(mockOrderId, mockUserId)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should throw ForbiddenError if customer does not own order', async () => {
      orderRepository.findById.mockResolvedValue({
        ...orderWithItems,
        customerId: 'other-user',
      } as any);
      await expect(service.reorder(mockOrderId, mockUserId)).rejects.toThrow(
        ForbiddenError,
      );
    });

    it('should throw BadRequestError if order has no items', async () => {
      orderRepository.findById.mockResolvedValue({
        ...mockOrder,
        orderItems: [],
      } as any);
      await expect(service.reorder(mockOrderId, mockUserId)).rejects.toThrow(
        BadRequestError,
      );
    });
  });

  describe('getCustomerHistory', () => {
    it('should return aggregated customer history', async () => {
      const orders = [
        {
          ...mockOrder,
          customer: { id: 'c1', phone: '+123', email: 'a@b.com' },
          totalAmount: 100,
          createdAt: new Date('2024-01-01'),
        },
        {
          ...mockOrder,
          id: 'o2',
          customer: { id: 'c1' },
          totalAmount: 200,
          createdAt: new Date('2024-01-02'),
        },
        {
          ...mockOrder,
          id: 'o3',
          customer: { id: 'c2', phone: '+456', email: 'c@d.com' },
          totalAmount: 50,
          createdAt: new Date('2024-01-03'),
        },
      ];
      orderRepository.findMany.mockResolvedValue(orders as any);

      const result = await service.getCustomerHistory(mockTenantId);
      expect(result.customers).toHaveLength(2);
      expect(result.customers[0]).toMatchObject({
        customerId: 'c1',
        totalOrders: 2,
        totalSpent: 300,
      });
      expect(result.total).toBe(2);
    });

    it('should return empty array when no orders', async () => {
      orderRepository.findMany.mockResolvedValue([]);
      const result = await service.getCustomerHistory(mockTenantId);
      expect(result.customers).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      // Mock findById to return the order so base service update doesn't throw
      orderRepository.findById.mockResolvedValue(mockOrder as any);
      orderRepository.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CONFIRMED,
      } as any);

      const result = await service.updateOrderStatus(
        mockOrderId,
        OrderStatus.CONFIRMED,
      );
      expect(result.status).toBe(OrderStatus.CONFIRMED);
      expect(orderRepository.update).toHaveBeenCalledWith(mockOrderId, {
        status: OrderStatus.CONFIRMED,
      });
    });
  });
});
