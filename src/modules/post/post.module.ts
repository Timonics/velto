import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostRepositoryImpl } from './repository/post.repository.impl';
import { PostServiceImpl } from './service/post.service.impl';
import { FollowModule } from '../follow/follow.module';
import { LikeModule } from '../like/like.module';
import { FollowServiceImpl } from '../follow/service/follow.service.impl';
import { LikeRepositoryImpl } from '../like/repository/like.repository.impl';
import { EventBus } from '../../domain/events/event-bus.service';
import { LoggerService } from '../../common/logger/logger.service';
import { CommentModule } from '../comment/comment.module';

@Module({
  imports: [FollowModule, LikeModule],
  controllers: [PostController],
  providers: [
    {
      provide: 'IPostRepository',
      useClass: PostRepositoryImpl,
    },
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
        'IPostRepository',
        FollowServiceImpl,
        'ILikeRepository',
        EventBus,
        LoggerService,
      ],
    },
  ],
  exports: [PostServiceImpl, 'IPostRepository'],
})
export class PostModule {}
