import { Injectable } from '@nestjs/common';
import { ILikeRepository } from './like.repository.interface';
import { ILikeService } from './like.service.interface';
import { NotFoundError, ConflictError } from '../../common/errors/app-error';
import { LoggerService } from '../../common/logger/logger.service';
import { EventBus } from '../../domain/events/event-bus.service';
import { LIKE_EVENTS } from '../../domain/events/event-types';

@Injectable()
export class LikeServiceImpl implements ILikeService {
  private readonly logger;

  constructor(
    private readonly likeRepository: ILikeRepository,
    private readonly eventBus: EventBus,
    logger: LoggerService,
  ) {
    this.logger = logger.child('LikeService');
  }

  async like(postId: string, userId: string): Promise<void> {
    const existing = await this.likeRepository.findByPostAndUser(
      postId,
      userId,
    );
    if (existing) throw new ConflictError('Already liked this post');

    await this.likeRepository.create({
      post: { connect: { id: postId } },
      user: { connect: { id: userId } },
    });

    await this.eventBus.emit({
      name: LIKE_EVENTS.CREATED,
      payload: { postId, userId },
    });
    this.logger.info(`User ${userId} liked post ${postId}`);
  }

  async unlike(postId: string, userId: string): Promise<void> {
    const existing = await this.likeRepository.findByPostAndUser(
      postId,
      userId,
    );
    if (!existing) throw new NotFoundError('Like');

    await this.likeRepository.deleteByPostAndUser(postId, userId);
    await this.eventBus.emit({
      name: LIKE_EVENTS.REMOVED,
      payload: { postId, userId },
    });
    this.logger.info(`User ${userId} unliked post ${postId}`);
  }

  async isLiked(postId: string, userId: string): Promise<boolean> {
    const like = await this.likeRepository.findByPostAndUser(postId, userId);
    return !!like;
  }

  async getLikeCount(postId: string): Promise<number> {
    return this.likeRepository.countLikesByPost(postId);
  }
}
