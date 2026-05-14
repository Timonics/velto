import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IPaymentRepository } from './repository/payment.repository.interface';
import { IOrderRepository } from '../order/repository/order.repository.interface';
import {
  IPaymentGateway,
  PAYMENT_GATEWAY,
} from './gateways/payment-gateway.interface';
import { EventBus } from '../../domain/events/event-bus.service';
import { ORDER_EVENTS } from '../../domain/events/event-types';
import { LoggerService } from '../../common/logger/logger.service';
import { ILogger } from '../../common/logger/logger.interface';
import {
  PaymentStatus,
  OrderStatus,
  PaymentHoldStatus,
} from 'generated/prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { ITenantRepository } from '../tenant/repository/tenant.repository.interface';
import { randomInt } from 'crypto';
import { ITransactionManager } from 'src/common/transactions/transaction-manager.interface';

@Injectable()
export class PaymentService {
  private readonly logger: ILogger;

  constructor(
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: IPaymentGateway,
    @Inject('ITransactionManager')
    private readonly transactionManager: ITransactionManager,
    private readonly eventBus: EventBus,
    private readonly loggerService: LoggerService,
  ) {
    this.logger = this.loggerService.child('PaymentService');
  }

  async initializePayment(
    orderId: string,
    customerEmail: string,
    callbackUrl?: string,
  ) {
    // Fetch order using repository
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');

    const tenant = await this.tenantRepository.findById(order.tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');

    if (order.paymentStatus === 'PAID')
      throw new BadRequestException('Order already paid');
    if (order.status === 'CANCELLED')
      throw new BadRequestException('Order is cancelled');

    const reference = `PAY-${Date.now()}-${uuidv4().slice(0, 8)}`;
    const amount = order.totalAmount;
    const platformFee = amount * 0.05; // 5% platform fee example
    const sellerAmount = amount - platformFee;

    let splitConfig: any = undefined;
    if (tenant.paystackSubaccountCode && sellerAmount > 0) {
      splitConfig = {
        subaccount: tenant.paystackSubaccountCode,
        split: [
          {
            subaccount: tenant.paystackSubaccountCode,
            amount: Math.round(sellerAmount * 100), // in kobo
          },
        ],
      };
    }

    // Initialize with gateway
    const { authorizationUrl, reference: gatewayRef } =
      await this.paymentGateway.initializePayment({
        email: customerEmail,
        amount,
        reference,
        callbackUrl,
        metadata: { orderId, userId: order.customerId },
        splitConfig,
      });

    // Create Payment record using repository
    await this.paymentRepository.create({
      reference: gatewayRef,
      amount,
      status: PaymentStatus.PENDING,
      order: { connect: { id: order.id } },
      paystackResponse: {
        gateway: this.paymentGateway.getGatewayName(),
        reference: gatewayRef,
      },
    } as any); // Type assertion for Prisma input

    this.logger.info(
      `Payment initialized for order ${orderId}, reference ${gatewayRef}`,
    );
    return {
      authorizationUrl,
      reference: gatewayRef,
      orderId: order.id,
      amount,
    };
  }

  async handleSuccessfulPayment(reference: string) {
    // Verify with gateway
    const verification = await this.paymentGateway.verifyPayment(reference);
    if (verification.status !== 'success') {
      this.logger.warn(
        `Payment not successful for reference ${reference}, status: ${verification.status}`,
      );
      return;
    }

    await this.transactionManager.runInTransaction(async (txContext) => {
      // Find payment record using repository
      const payment = await this.paymentRepository.findByReference(
        reference,
        txContext.client,
      );
      if (!payment) {
        this.logger.warn(`Payment record not found for reference ${reference}`);
        return;
      }
      if (payment.status === PaymentStatus.PAID) {
        this.logger.debug(
          `Payment already processed for reference ${reference}`,
        );
        return;
      }

      // Update payment
      await this.paymentRepository.updateStatus(
        payment.id,
        PaymentStatus.PAID,
        txContext.client,
      );

      const releaseToken = randomInt(100000, 999999).toString();
      const autoReleaseAt = new Date();
      autoReleaseAt.setDate(autoReleaseAt.getDate() + 7);

      // Update order payment status via repository
      await this.orderRepository.update(
        payment.orderId,
        {
          paymentStatus: PaymentStatus.PAID,
          status: OrderStatus.AWAITING_CONFIRMATION,
          paymentHoldStatus: PaymentHoldStatus.HELD,
          releaseToken,
          autoReleaseAt,
        },
        txContext.client,
      );

      // Fetch order details for notifications (customer phone, email)
      const order = await this.orderRepository.findById(
        payment.orderId,
        {
          customer: true,
        },
        txContext.client,
      );
      if (!order) {
        this.logger.error(`Order not found for payment ${payment.id}`);
        return;
      }

      // Emit ORDER_EVENTS.PAID for general purposes (analytics, etc.)
      await this.eventBus.emit({
        name: ORDER_EVENTS.PAID,
        payload: {
          orderId: payment.orderId,
          paymentMethod: verification.channel || 'card',
          transactionId: reference,
        },
      });

      // Emit event
      await this.eventBus.emit({
        name: ORDER_EVENTS.HELD,
        payload: {
          orderId: payment.orderId,
          releaseToken,
          autoReleaseAt,
          customerPhone: (order as any).customer?.phone,
          customerEmail: (order as any).customer?.email,
        },
      });

      this.logger.info(
        `Payment successful for order ${payment.orderId}, token ${releaseToken} expires ${autoReleaseAt}`,
      );
    });
  }
}
