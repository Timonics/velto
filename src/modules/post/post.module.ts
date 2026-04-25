import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { IPostRepository } from './post.repository.interface';
import { PostRepositoryImpl } from './post.repository.impl';
import { IPostService } from './post.service.interface';
import { PostServiceImpl } from './post.service.impl';
import { FollowModule } from '../follow/follow.module';
import { LikeModule } from '../like/like.module';

@Module({
  imports: [FollowModule, LikeModule],
  controllers: [PostController],
  providers: [
    { provide: IPostRepository, useClass: PostRepositoryImpl },
    {
      provide: IPostService,
      useFactory: (
        repo: IPostRepository,
        followService: any,
        likeRepo: any,
        eventBus: any,
        logger: any,
      ) => new PostServiceImpl(repo, followService, likeRepo, eventBus, logger),
      inject: [
        IPostRepository,
        'IFollowService',
        'ILikeRepository',
        'EventBus',
        'LoggerService',
      ],
    },
  ],
  exports: [IPostService, IPostRepository],
})
export class PostModule {}
