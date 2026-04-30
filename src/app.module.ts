import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';

import { EnvironmentModule } from './config/env/env.module';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { LoggerModule } from './common/logger/logger.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { EventBusModule } from './domain/events/event-bus.module';
import { NotificationModule } from './modules/notification/notification.module';

import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { PostModule } from './modules/post/post.module';
import { FollowModule } from './modules/follow/follow.module';
import { LikeModule } from './modules/like/like.module';
import { CommentModule } from './modules/comment/comment.module';

import { AuthGuard } from './common/guards/auth.guard';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { TenantMiddleware } from './common/middleware/tenant.middleware';

import { EnvironmentService } from './config/env/env.service';
import { ProductModule } from './modules/product/product.module';
import { ServiceModule } from './modules/service/service.module';
import { OrderModule } from './modules/order/order.module';
import { BookingModule } from './modules/booking/booking.module';

@Module({
  imports: [
    // Core infrastructure
    EnvironmentModule, // provides validated env vars
    PrismaModule, // database connection
    LoggerModule, // logging (global)
    QueueModule, // Bull queues
    EventBusModule, // domain events
    NotificationModule, // email, whatsapp, in-app

    // JWT
    JwtModule.registerAsync({
      inject: [EnvironmentService],
      useFactory: (env: EnvironmentService) => ({
        secret: env.get('JWT_SECRET'),
        signOptions: { expiresIn: env.get('JWT_ACCESS_EXPIRES') as any },
      }),
    }),

    // Domain modules
    UserModule, 
    AuthModule, 
    TenantModule, 
    PostModule,
    CommentModule,
    ProductModule,
    ServiceModule,
    OrderModule,
    BookingModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard, 
    },
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
