import { forwardRef, Global, Module } from '@nestjs/common';
import { TenantController } from './tenant.controller';
import { TenantRepositoryImpl } from './repository/tenant.repository.impl';
import { TenantServiceImpl } from './services/tenant.service.impl';
import { PaystackGateway } from '../payment/gateways/paystack.gateway';
import { PAYMENT_GATEWAY } from '../payment/gateways/payment-gateway.interface';
import { PaymentModule } from '../payment/payment.module';

@Global()
@Module({
  imports: [forwardRef(() => PaymentModule)],
  providers: [
    {
      provide: 'ITenantRepository',
      useClass: TenantRepositoryImpl,
    },
    {
      provide: PAYMENT_GATEWAY,
      useClass: PaystackGateway,
    },
    TenantServiceImpl,
  ],
  exports: [TenantServiceImpl, 'ITenantRepository'],
  controllers: [TenantController],
})
export class TenantModule {}
