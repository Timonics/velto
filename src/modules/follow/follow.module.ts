import { Module } from '@nestjs/common';
import { FollowController } from './follow.controller';
import { FollowRepositoryImpl } from './repository/follow.repository.impl';
import { FollowServiceImpl } from './service/follow.service.impl';
import { LoggerService } from 'src/common/logger/logger.service';
import { EventBus } from 'src/domain/events/event-bus.service';

@Module({
  providers: [
    {
      provide: 'IFollowRepository',
      useClass: FollowRepositoryImpl,
    },
   {
         provide: FollowServiceImpl,
         useFactory: (
           repo: FollowRepositoryImpl,
           eventBus: EventBus,
           logger: LoggerService,
         ) => new FollowServiceImpl(repo, eventBus, logger),
         inject: ['IFollowRepository', EventBus, LoggerService],
       },
  ],
  exports: ['IFollowRepository', FollowServiceImpl],
  controllers: [FollowController],
})
export class FollowModule {}
