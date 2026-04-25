import { Injectable } from '@nestjs/common';
import { ICommentRepository } from './comment.repository.interface';
import { IPostRepository } from '../post/post.repository.interface';
import { ICommentService } from './comment.service.interface';
import { NotFoundError, ForbiddenError } from '../../common/errors/app-error';
import { EventBus } from '../../domain/events/event-bus.service';
import { COMMENT_EVENTS } from '../../domain/events/event-types';
import { LoggerService } from '../../common/logger/logger.service';

@Injectable()
export class CommentServiceImpl implements ICommentService {
  private readonly logger;

  constructor(
    private readonly commentRepository: ICommentRepository,
    private readonly postRepository: IPostRepository,
    private readonly eventBus: EventBus,
    logger: LoggerService,
  ) {
    this.logger = logger.child('CommentService');
  }

  async create(postId: string, userId: string, content: string): Promise<Comment> {
    // Verify post exists
    const post = await this.postRepository.findById(postId);
    if (!post) throw new NotFoundError('Post', postId);

    const comment = await this.commentRepository.create({
      content,
      post: { connect: { id: postId } },
      user: { connect: { id: userId } },
    });

    // Increment comment count on post (denormalized)
    await this.postRepository.incrementCommentsCount(postId);

    await this.eventBus.emit({
      name: COMMENT_EVENTS.CREATED,
      payload: { commentId: comment.id, postId, userId, tenantId: post.tenantId },
    });

    this.logger.info(`Comment ${comment.id} created on post ${postId} by user ${userId}`);
    return comment;
  }

  async update(commentId: string, userId: string, content: string): Promise<Comment> {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) throw new NotFoundError('Comment', commentId);
    if (comment.userId !== userId) throw new ForbiddenError('You can only edit your own comments');

    const updated = await this.commentRepository.update(commentId, { content });
    await this.eventBus.emit({
      name: COMMENT_EVENTS.UPDATED,
      payload: { commentId, postId: comment.postId, userId },
    });
    this.logger.info(`Comment ${commentId} updated`);
    return updated;
  }

  async delete(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) throw new NotFoundError('Comment', commentId);
    if (comment.userId !== userId) throw new ForbiddenError('You can only delete your own comments');

    await this.commentRepository.delete(commentId);
    await this.postRepository.decrementCommentsCount(comment.postId);
    await this.eventBus.emit({
      name: COMMENT_EVENTS.DELETED,
      payload: { commentId, postId: comment.postId, userId },
    });
    this.logger.info(`Comment ${commentId} deleted`);
  }

  async getCommentsByPost(postId: string, skip = 0, take = 20): Promise<Comment[]> {
    // Verify post exists (optional but good for UX)
    const post = await this.postRepository.findById(postId);
    if (!post) throw new NotFoundError('Post', postId);
    return this.commentRepository.findByPost(postId, skip, take);
  }
}