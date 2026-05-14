import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';

import { EnvironmentModule } from './config/env/env.module';
import { EnvironmentService } from './config/env/env.service';
import { DatabaseModule } from './infrastructure/database/database.module';
import { LoggerModule } from './common/logger/logger.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { EventBusModule } from './domain/events/event-bus.module';
import { CacheModule } from './infrastructure/cache/cache.module';

import { AuthGuard } from './common/guards/auth.guard';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { TenantMiddleware } from './common/middleware/tenant.middleware';

import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { PostModule } from './modules/post/post.module';
import { CommentModule } from './modules/comment/comment.module';
import { ProductModule } from './modules/product/product.module';
import { ServiceModule } from './modules/service/service.module';
import { OrderModule } from './modules/order/order.module';
import { BookingModule } from './modules/booking/booking.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { CartModule } from './modules/cart/cart.module';
import { ScheduleModule } from '@nestjs/schedule';
import { UtmMiddleware } from './common/middleware/utm.middleware';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ReviewModule } from './modules/review/review.module';
import { AdminModule } from './modules/admin/admin.modules';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ScheduleModule.forRoot(), // for cron jobs

    // Core infrastructure
    EnvironmentModule, // provides validated env vars
    DatabaseModule, // database connection
    LoggerModule, // logging (global)
    QueueModule, // Bull queues
    EventBusModule, // domain events
    CacheModule, // Redis cache

    // JWT
    JwtModule.registerAsync({
      inject: [EnvironmentService],
      useFactory: (env: EnvironmentService) => ({
        secret: env.get('JWT_SECRET'),
        signOptions: { expiresIn: env.get('JWT_ACCESS_EXPIRES') as any },
      }),
    }),

    // Domain modules
    AdminModule,
    AnalyticsModule,
    UserModule,
    AuthModule,
    TenantModule,
    PostModule,
    CommentModule,
    ProductModule,
    ServiceModule,
    OrderModule,
    BookingModule,
    MarketplaceModule,
    PortfolioModule,
    CartModule,
    ReviewModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware, TenantMiddleware, UtmMiddleware)
      .forRoutes('*');
  }
}
