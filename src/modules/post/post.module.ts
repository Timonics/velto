import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostRepositoryImpl } from './post.repository.impl';
import { PostServiceImpl } from './post.service.impl';
import { FollowModule } from '../follow/follow.module';
import { LikeModule } from '../like/like.module';
import { FollowServiceImpl } from '../follow/follow.service.impl';
import { LikeRepositoryImpl } from '../like/like.repository.impl';
import { EventBus } from '../../domain/events/event-bus.service';
import { LoggerService } from '../../common/logger/logger.service';

@Module({
  imports: [FollowModule, LikeModule],
  controllers: [PostController],
  providers: [
    PostRepositoryImpl,
    {
      provide: PostServiceImpl,
      useFactory: (
        repo: PostRepositoryImpl,
        followService: FollowServiceImpl,
        likeRepo: LikeRepositoryImpl,
        eventBus: EventBus,
        logger: LoggerService,
      ) => new PostServiceImpl(repo, followService, likeRepo, eventBus, logger),
      inject: [
        PostRepositoryImpl,
        FollowServiceImpl,
        LikeRepositoryImpl,
        EventBus,
        LoggerService,
      ],
    },
  ],
  exports: [PostServiceImpl, PostRepositoryImpl],
})
export class PostModule {}
