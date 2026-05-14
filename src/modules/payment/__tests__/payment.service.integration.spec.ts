import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { PaymentService } from '../../../modules/payment/payment.service';
import { PaymentRepositoryImpl } from '../../../modules/payment/repository/payment.repository.impl';
import { OrderRepositoryImpl } from '../../../modules/order/repository/order.repository.impl';
import { TenantRepositoryImpl } from '../../../modules/tenant/repository/tenant.repository.impl';
import { PaystackGateway } from '../../../modules/payment/gateways/paystack.gateway';
import { EventBus } from '../../../domain/events/event-bus.service';
import { PrismaTransactionManager } from '../../../infrastructure/database/prisma.transaction-manager';
import { LoggerService } from '../../../common/logger/logger.service';
import { PaymentStatus, OrderStatus, PaymentHoldStatus } from 'generated/prisma/client';
import { randomInt } from 'crypto';

// Mock randomInt for deterministic token
jest.mock('crypto', () => ({
  randomInt: jest.fn(() => 123456),
}));

describe('PaymentService Integration (Transaction)', () => {
  let prisma: PrismaService;
  let paymentService: PaymentService;
  let paystackGatewayMock: jest.Mocked<PaystackGateway>;
  let eventBusMock: jest.Mocked<EventBus>;

  let testOrder: any;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();

    // Clean database
    await prisma.payment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.tenant.deleteMany();
    await prisma.user.deleteMany();

    // Create test user, tenant, product, order
    const user = await prisma.user.create({
      data: {
        phone: '+2348098765432',
        email: 'payment@example.com',
        passwordHash: 'hash',
        role: 'CUSTOMER',
        customer: { create: {} },
      },
    });
    const tenant = await prisma.tenant.create({
      data: {
        businessName: 'Payment Test Store',
        slug: 'payment-test',
        businessType: 'PRODUCT_SELLER',
        category: 'ELECTRONICS',
        isActive: true,
        user: { connect: { id: user.id } },
      },
    });
    const product = await prisma.product.create({
      data: {
        name: 'Test Product',
        price: 100,
        stock: 10,
        category: 'ELECTRONICS',
        tenant: { connect: { id: tenant.id } },
      },
    });
    testOrder = await prisma.order.create({
      data: {
        orderNumber: 'INT-ORDER-001',
        totalAmount: 100,
        deliveryFee: 0,
        paymentStatus: PaymentStatus.PENDING,
        paymentHoldStatus: PaymentHoldStatus.NOT_HELD,
        deliveryAddress: '123 St',
        status: OrderStatus.PENDING,
        customer: { connect: { id: user.id } },
        tenant: { connect: { id: tenant.id } },
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    paystackGatewayMock = {
      verifyPayment: jest.fn(),
    } as any;
    eventBusMock = { emit: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        { provide: 'IPaymentRepository', useClass: PaymentRepositoryImpl },
        { provide: 'IOrderRepository', useClass: OrderRepositoryImpl },
        { provide: 'ITenantRepository', useClass: TenantRepositoryImpl },
        { provide: PaystackGateway, useValue: paystackGatewayMock },
        { provide: EventBus, useValue: eventBusMock },
        { provide: 'ITransactionManager', useClass: PrismaTransactionManager },
        {
          provide: LoggerService,
          useValue: { child: jest.fn().mockReturnValue({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }) },
        },
        PaymentService,
      ],
    }).compile();

    paymentService = module.get<PaymentService>(PaymentService);
  });

  afterEach(async () => {
    await prisma.payment.deleteMany();
    await prisma.order.update({
      where: { id: testOrder.id },
      data: {
        paymentStatus: PaymentStatus.PENDING,
        paymentHoldStatus: PaymentHoldStatus.NOT_HELD,
        status: OrderStatus.PENDING,
        releaseToken: null,
        autoReleaseAt: null,
      },
    });
  });

  it('should successfully process payment and update order atomically', async () => {
    // Mock Paystack verification
    paystackGatewayMock.verifyPayment.mockResolvedValue({
      status: 'success',
      transactionId: 'pay_ref_123',
      amount: 100,
      currency: 'NGN',
      channel: 'card',
      rawData: {},
    });

    // Create payment record first (simulate initialization)
    await prisma.payment.create({
      data: {
        reference: 'pay_ref_123',
        amount: 100,
        status: PaymentStatus.PENDING,
        orderId: testOrder.id,
      },
    });

    await paymentService.handleSuccessfulPayment('pay_ref_123');

    // Check payment status
    const payment = await prisma.payment.findUnique({ where: { reference: 'pay_ref_123' } });
    expect(payment?.status).toBe(PaymentStatus.PAID);

    // Check order updates
    const order = await prisma.order.findUnique({ where: { id: testOrder.id } });
    expect(order?.paymentStatus).toBe(PaymentStatus.PAID);
    expect(order?.paymentHoldStatus).toBe(PaymentHoldStatus.HELD);
    expect(order?.releaseToken).toBe('123456');
    expect(order?.autoReleaseAt).toBeInstanceOf(Date);
    expect(order?.status).toBe('AWAITING_CONFIRMATION');

    expect(eventBusMock.emit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'order.payment_held' })
    );
  });

  it('should not update order if payment record already paid (idempotency)', async () => {
    // Create payment already paid
    await prisma.payment.create({
      data: {
        reference: 'pay_ref_456',
        amount: 100,
        status: PaymentStatus.PAID,
        orderId: testOrder.id,
      },
    });

    paystackGatewayMock.verifyPayment.mockResolvedValue({
      status: 'success',
      transactionId: 'pay_ref_456',
      amount: 100,
      currency: 'NGN',
      channel: 'card',
      rawData: {},
    });

    await paymentService.handleSuccessfulPayment('pay_ref_456');

    // Order should not be updated again
    const order = await prisma.order.findUnique({ where: { id: testOrder.id } });
    expect(order?.paymentHoldStatus).toBe(PaymentHoldStatus.NOT_HELD);
    expect(eventBusMock.emit).not.toHaveBeenCalled();
  });

  it('should not update anything if payment verification fails', async () => {
    paystackGatewayMock.verifyPayment.mockResolvedValue({
      status: 'failed',
      transactionId: 'pay_ref_fail',
      amount: 100,
      currency: 'NGN',
      channel: 'card',
      rawData: {},
    });

    // No payment record created
    await paymentService.handleSuccessfulPayment('pay_ref_fail');

    const payment = await prisma.payment.findUnique({ where: { reference: 'pay_ref_fail' } });
    expect(payment).toBeNull();

    const order = await prisma.order.findUnique({ where: { id: testOrder.id } });
    expect(order?.paymentStatus).toBe(PaymentStatus.PENDING);
  });
});