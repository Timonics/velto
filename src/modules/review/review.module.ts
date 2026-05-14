import { Module } from '@nestjs/common';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { ReviewRepositoryImpl } from './repository/review.repository.impl';
import { OrderModule } from '../order/order.module';
import { ProductModule } from '../product/product.module';
import { LoggerModule } from '../../common/logger/logger.module';
import { EventBusModule } from '../../domain/events/event-bus.module';
import { PrismaModule } from '../../infrastructure/database/database.module';

@Module({
  imports: [
    OrderModule,
    ProductModule,
    LoggerModule,
    EventBusModule,
    PrismaModule,
  ],
  controllers: [ReviewController],
  providers: [
    {
      provide: 'IReviewRepository',
      useClass: ReviewRepositoryImpl,
    },
    ReviewService,
  ],
  exports: [ReviewService],
})
export class ReviewModule {}
