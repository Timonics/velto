import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common'
import { EnvironmentModule } from './config/env/env.module';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { LoggerModule } from './common/logger/logger.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { EventBusModule } from './domain/events/event-bus.module';
import { NotificationModule } from './modules/notification/notification.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { TenantMiddleware } from './common/middleware/tenant.middleware';

@Module({
  imports: [
    EnvironmentModule,
    PrismaModule,
    LoggerModule,
    UserModule,
    QueueModule,
    EventBusModule,
    NotificationModule,
    AuthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware)
      .forRoutes('*')
      .apply(TenantMiddleware)
      .forRoutes('*');
  }
}
