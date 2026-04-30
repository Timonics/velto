import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentRepositoryImpl } from './repository/comment.repository.impl';
import { CommentServiceImpl } from './service/comment.service.impl';
import { PostModule } from '../post/post.module';
import { PostRepositoryImpl } from '../post/repository/post.repository.impl';
import { LoggerService } from 'src/common/logger/logger.service';
import { EventBus } from 'src/domain/events/event-bus.service';

@Module({
  imports: [PostModule],
  controllers: [CommentController],
  providers: [
    {
      provide: 'ICommentRepository',
      useClass: CommentRepositoryImpl,
    },
    {
      provide: CommentServiceImpl,
      useFactory: (
        repo: CommentRepositoryImpl,
        postRepo: PostRepositoryImpl,
        eventBus: EventBus,
        logger: LoggerService,
      ) => new CommentServiceImpl(repo, postRepo, eventBus, logger),
      inject: [
        'ICommentRepository',
        'IPostRepository',
        EventBus,
        LoggerService,
      ],
    },
  ],
  exports: ['ICommentRepository', CommentServiceImpl],
})
export class CommentModule {}
