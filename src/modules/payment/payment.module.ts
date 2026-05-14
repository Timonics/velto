import { forwardRef, Module } from '@nestjs/common';
import { PaymentController } from './paystack.controller';
import { PaymentService } from './payment.service';
import { PaymentRepositoryImpl } from './repository/payment.repository.impl';
import { PaystackGateway } from './gateways/paystack.gateway';
import {
  PAYMENT_GATEWAY,
} from './gateways/payment-gateway.interface';
import { OrderModule } from '../order/order.module'; // for IOrderRepository
import { LoggerModule } from '../../common/logger/logger.module';
import { EventBusModule } from '../../domain/events/event-bus.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [
    OrderModule,
    forwardRef(() => TenantModule),
    LoggerModule,
    EventBusModule,
    DatabaseModule,
  ],
  controllers: [PaymentController],
  providers: [
    {
      provide: 'IPaymentRepository',
      useClass: PaymentRepositoryImpl,
    },
    {
      provide: PAYMENT_GATEWAY,
      useClass: PaystackGateway,
    },
    PaymentService,
  ],
  exports: [PaymentService, PAYMENT_GATEWAY],
})
export class PaymentModule {}
