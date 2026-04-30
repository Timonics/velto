import { Module } from '@nestjs/common';
import { LikeController } from './like.controller';
import { LikeRepositoryImpl } from './repository/like.repository.impl';
import { LikeServiceImpl } from './service/like.service.impl';
import { EventBus } from 'src/domain/events/event-bus.service';
import { LoggerService } from 'src/common/logger/logger.service';

@Module({
  controllers: [LikeController],
  providers: [
    {
      provide: 'ILikeRepository',
      useClass: LikeRepositoryImpl,
    },
    {
      provide: LikeServiceImpl,
      useFactory: (
        repo: LikeRepositoryImpl,
        eventBus: EventBus,
        logger: LoggerService,
      ) => new LikeServiceImpl(repo, eventBus, logger),
      inject: ['ILikeRepository', EventBus, LoggerService],
    },
  ],
  exports: ['ILikeRepository', LikeServiceImpl],
})
export class LikeModule {}
