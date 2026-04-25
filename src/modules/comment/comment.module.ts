import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentRepositoryImpl } from './comment.repository.impl';
import { CommentServiceImpl } from './comment.service.impl';
import { PostModule } from '../post/post.module';

@Module({
  imports: [PostModule],
  controllers: [CommentController],
  providers: [CommentRepositoryImpl, CommentServiceImpl],
  exports: [CommentServiceImpl],
})
export class CommentModule {}
