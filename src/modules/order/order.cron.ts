import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IOrderRepository } from './repository/order.repository.interface';
import { OrderStatus, PaymentHoldStatus } from 'generated/prisma/client';
import { LoggerService } from '../../common/logger/logger.service';
import { ILogger } from '../../common/logger/logger.interface';
import { EventBus } from '../../domain/events/event-bus.service';
import { ORDER_EVENTS } from '../../domain/events/event-types';

@Injectable()
export class OrderCron {
  private readonly logger: ILogger;

  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
    private readonly eventBus: EventBus,
    logger: LoggerService,
  ) {
    this.logger = logger.child('OrderCron');
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async autoReleaseExpiredOrders(): Promise<void> {
    const now = new Date();
    const expiredOrders = await this.orderRepository.findMany({
      where: {
        paymentHoldStatus: PaymentHoldStatus.HELD,
        autoReleaseAt: { lte: now },
        status: { not: OrderStatus.COMPLETED },
      },
    });

    for (const order of expiredOrders) {
      await this.orderRepository.update(order.id, {
        paymentHoldStatus: PaymentHoldStatus.RELEASED,
        status: OrderStatus.COMPLETED,
      });
      await this.eventBus.emit({
        name: ORDER_EVENTS.AUTO_RELEASED,
        payload: { orderId: order.id, tenantId: order.tenantId },
      });
      this.logger.info(`Auto-released order ${order.id}`);
    }
  }
}
