import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { ICommentRepository } from './comment.repository.interface';
import { CommentRepositoryImpl } from './comment.repository.impl';
import { ICommentService } from './comment.service.interface';
import { CommentServiceImpl } from './comment.service.impl';
import { PostModule } from '../post/post.module'; // for IPostRepository

@Module({
  imports: [PostModule],
  controllers: [CommentController],
  providers: [
    { provide: ICommentRepository, useClass: CommentRepositoryImpl },
    { provide: ICommentService, useClass: CommentServiceImpl },
  ],
  exports: [ICommentService],
})
export class CommentModule {}