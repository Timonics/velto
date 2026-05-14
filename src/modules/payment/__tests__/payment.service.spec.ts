import { PaymentService } from '../payment.service';
import { IPaymentRepository } from '../repository/payment.repository.interface';
import { IOrderRepository } from '../../order/repository/order.repository.interface';
import { ITenantRepository } from '../../tenant/repository/tenant.repository.interface';
import { IPaymentGateway } from '../gateways/payment-gateway.interface';
import { EventBus } from '../../../domain/events/event-bus.service';
import { ITransactionManager } from '../../../common/transactions/transaction-manager.interface';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import {
  PaymentStatus,
  OrderStatus,
  PaymentHoldStatus,
} from 'generated/prisma/client';

// Mock uuid
jest.mock('uuid', () => ({
  v4: () => 'mock-uuid-1234',
}));

// Mock randomInt
jest.mock('crypto', () => ({
  randomInt: jest.fn(() => 123456),
}));

describe('PaymentService', () => {
  let service: PaymentService;
  let paymentRepository: jest.Mocked<IPaymentRepository>;
  let orderRepository: jest.Mocked<IOrderRepository>;
  let tenantRepository: jest.Mocked<ITenantRepository>;
  let paymentGateway: jest.Mocked<IPaymentGateway>;
  let eventBus: jest.Mocked<EventBus>;
  let transactionManager: jest.Mocked<ITransactionManager>;

  const mockOrderId = 'order-123';
  const mockTenantId = 'tenant-456';
  const mockUserId = 'user-789';
  const mockReference = 'pay_ref_123';
  const mockCustomerEmail = 'customer@example.com';
  const mockSubaccountCode = 'sub_abc123';

  const mockOrder = {
    id: mockOrderId,
    orderNumber: 'ORD-123',
    customerId: mockUserId,
    tenantId: mockTenantId,
    totalAmount: 100,
    paymentStatus: PaymentStatus.PENDING,
    status: OrderStatus.PENDING,
    deliveryAddress: '123 St',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTenant = {
    id: mockTenantId,
    paystackSubaccountCode: mockSubaccountCode,
    businessName: 'Test Store',
    bankName: null,
    bankAccountNumber: null,
    bankAccountName: null,
  };

  const mockPayment = {
    id: 'pay-123',
    reference: mockReference,
    amount: 100,
    status: PaymentStatus.PENDING,
    orderId: mockOrderId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    paymentRepository = {
      findByReference: jest.fn(),
      updateStatus: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
      findByOrderId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    } as any;

    orderRepository = {
      findById: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      findByCustomerId: jest.fn(),
      findByTenantId: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    } as any;

    tenantRepository = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    } as any;

    paymentGateway = {
      initializePayment: jest.fn(),
      verifyPayment: jest.fn(),
      getGatewayName: jest.fn().mockReturnValue('paystack'),
      createSubaccount: jest.fn(),
      fetchSubaccount: jest.fn(),
      updateSubaccount: jest.fn(),
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

    service = new PaymentService(
      paymentRepository,
      orderRepository,
      tenantRepository,
      paymentGateway,
      transactionManager,
      eventBus,
      loggerMock as any,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initializePayment', () => {
    it('should initialize payment successfully with split config when tenant has subaccount', async () => {
      orderRepository.findById.mockResolvedValue(mockOrder as any);
      tenantRepository.findById.mockResolvedValue(mockTenant as any);
      paymentGateway.initializePayment.mockResolvedValue({
        authorizationUrl: 'https://paystack.com/pay/ref123',
        reference: mockReference,
      });
      paymentRepository.create.mockResolvedValue(mockPayment as any);

      const result = await service.initializePayment(
        mockOrderId,
        mockCustomerEmail,
      );

      expect(result).toEqual({
        authorizationUrl: 'https://paystack.com/pay/ref123',
        reference: mockReference,
        orderId: mockOrderId,
        amount: 100,
      });
      expect(paymentGateway.initializePayment).toHaveBeenCalledWith(
        expect.objectContaining({
          email: mockCustomerEmail,
          amount: 100,
          splitConfig: expect.objectContaining({
            subaccount: mockSubaccountCode,
          }),
        }),
      );
      expect(paymentRepository.create).toHaveBeenCalled();
    });

    it('should initialize payment without split config if tenant has no subaccount', async () => {
      orderRepository.findById.mockResolvedValue(mockOrder as any);
      tenantRepository.findById.mockResolvedValue({
        ...mockTenant,
        paystackSubaccountCode: null,
      } as any);
      paymentGateway.initializePayment.mockResolvedValue({
        authorizationUrl: 'https://paystack.com/pay/ref123',
        reference: mockReference,
      });
      paymentRepository.create.mockResolvedValue(mockPayment as any);

      await service.initializePayment(mockOrderId, mockCustomerEmail);
      expect(paymentGateway.initializePayment).toHaveBeenCalledWith(
        expect.not.objectContaining({ splitConfig: expect.anything() }),
      );
    });

    it('should throw NotFoundException if order not found', async () => {
      orderRepository.findById.mockResolvedValue(null);
      await expect(
        service.initializePayment(mockOrderId, mockCustomerEmail),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if order already paid', async () => {
      orderRepository.findById.mockResolvedValue({
        ...mockOrder,
        paymentStatus: PaymentStatus.PAID,
      } as any);
      tenantRepository.findById.mockResolvedValue(mockTenant as any);
      await expect(
        service.initializePayment(mockOrderId, mockCustomerEmail),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if order is cancelled', async () => {
      orderRepository.findById.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELLED,
      } as any);
      tenantRepository.findById.mockResolvedValue(mockTenant as any);
      await expect(
        service.initializePayment(mockOrderId, mockCustomerEmail),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('handleSuccessfulPayment', () => {
    it('should process successful payment and update order atomically', async () => {
      paymentGateway.verifyPayment.mockResolvedValue({
        status: 'success',
        transactionId: mockReference,
        amount: 100,
        currency: 'NGN',
        channel: 'card',
        rawData: {},
      });

      paymentRepository.findByReference.mockResolvedValue(mockPayment as any);
      orderRepository.findById.mockResolvedValue({
        ...mockOrder,
        customer: { phone: '+123' },
      } as any);
      paymentRepository.updateStatus.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.PAID,
      } as any);
      orderRepository.update.mockResolvedValue({
        ...mockOrder,
        paymentStatus: PaymentStatus.PAID,
      } as any);

      await service.handleSuccessfulPayment(mockReference);

      expect(paymentRepository.updateStatus).toHaveBeenCalledWith(
        mockPayment.id,
        PaymentStatus.PAID,
        {},
      );
      expect(orderRepository.update).toHaveBeenCalledWith(
        mockOrderId,
        expect.objectContaining({
          paymentStatus: PaymentStatus.PAID,
          status: OrderStatus.AWAITING_CONFIRMATION,
          paymentHoldStatus: PaymentHoldStatus.HELD,
          releaseToken: '123456',
          autoReleaseAt: expect.any(Date),
        }),
        {},
      );
      expect(eventBus.emit).toHaveBeenCalled();
    });

    it('should do nothing if payment verification status is not success', async () => {
      paymentGateway.verifyPayment.mockResolvedValue({
        status: 'failed',
        transactionId: mockReference,
        amount: 100,
        currency: 'NGN',
        channel: 'card',
        rawData: {},
      });
      await service.handleSuccessfulPayment(mockReference);
      expect(paymentRepository.updateStatus).not.toHaveBeenCalled();
      expect(orderRepository.update).not.toHaveBeenCalled();
    });

    it('should do nothing if payment record not found', async () => {
      paymentGateway.verifyPayment.mockResolvedValue({
        status: 'success',
        transactionId: mockReference,
        amount: 100,
        currency: 'NGN',
        channel: 'card',
        rawData: {},
      });
      paymentRepository.findByReference.mockResolvedValue(null);
      await service.handleSuccessfulPayment(mockReference);
      expect(paymentRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should skip processing if payment already paid (idempotency)', async () => {
      paymentGateway.verifyPayment.mockResolvedValue({
        status: 'success',
        transactionId: mockReference,
        amount: 100,
        currency: 'NGN',
        channel: 'card',
        rawData: {},
      });
      paymentRepository.findByReference.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.PAID,
      } as any);
      await service.handleSuccessfulPayment(mockReference);
      expect(paymentRepository.updateStatus).not.toHaveBeenCalled();
      expect(orderRepository.update).not.toHaveBeenCalled();
    });
  });
});
