import { Inject, Injectable } from '@nestjs/common';
import { BaseServiceImpl } from '../../../common/services/base.service.impl';
import { IPostService } from './post.service.interface';
import { IPostRepository } from '../repository/post.repository.interface';
import { IFollowService } from '../../follow/service/follow.service.interface';
import { ILikeRepository } from '../../like/repository/like.repository.interface';
import { LoggerService } from '../../../common/logger/logger.service';
import { EventBus } from '../../../domain/events/event-bus.service';
import { POST_EVENTS } from '../../../domain/events/event-types';
import { Post, Prisma } from 'generated/prisma/client';
import { CreatePostDto, UpdatePostDto } from '../dto';
import { NotFoundError } from '../../../common/errors/app-error';
import { ILogger } from '../../../common/logger/logger.interface';

@Injectable()
export class PostServiceImpl
  extends BaseServiceImpl<
    Post,
    CreatePostDto,
    UpdatePostDto,
    Prisma.PostCreateInput,
    Prisma.PostUpdateInput
  >
  implements IPostService
{
  protected readonly logger: ILogger;
  protected readonly entityName = 'Post';

  constructor(
    protected readonly repository: IPostRepository,
    private readonly followService: IFollowService,
    private readonly likeRepository: ILikeRepository,
    private readonly eventBus: EventBus,
    logger: LoggerService,
  ) {
    super(repository);
    this.logger = logger.child('PostService');
  }

  // Override create to handle tenantId
  async create(data: CreatePostDto & { tenantId: string }): Promise<Post> {
    // Validate uniqueness if needed (none for posts)
    const input: Prisma.PostCreateInput = {
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType,
      caption: data.caption,
      isPublished: true,
      isDeleted: false,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      tenant: { connect: { id: data.tenantId } },
    };
    const post = await this.repository.create(input);
    await this.eventBus.emit({
      name: POST_EVENTS.CREATED,
      payload: {
        postId: post.id,
        tenantId: post.tenantId,
        mediaUrl: post.mediaUrl,
      },
    });
    return post;
  }

  async getPostsByTenant(
    tenantId: string,
    skip = 0,
    take = 20,
  ): Promise<Post[]> {
    return this.repository.findByTenantId(tenantId, skip, take);
  }

  async getUserFeed(userId: string, skip = 0, take = 20): Promise<Post[]> {
    const followedTenantIds =
      await this.followService.getFollowedTenantIds(userId);
    if (followedTenantIds.length === 0) return this.getTrendingPosts(take);
    const feed = await this.repository.getFeedForUser(
      followedTenantIds,
      skip,
      take,
    );
    if (feed.length < take) {
      const remaining = take - feed.length;
      const trending = await this.getTrendingPosts(remaining);
      return [...feed, ...trending];
    }
    return feed;
  }

  async getTrendingPosts(limit = 20): Promise<Post[]> {
    return this.repository.getTrendingPosts(limit);
  }

  async toggleLike(
    postId: string,
    userId: string,
  ): Promise<{ liked: boolean; likesCount: number }> {
    const post = await this.repository.findById(postId);
    if (!post) throw new NotFoundError('Post', postId);

    const existingLike = await this.likeRepository.findByPostAndUser(
      postId,
      userId,
    );
    if (existingLike) {
      await this.likeRepository.delete(existingLike.id);
      await this.repository.decrementLikesCount(postId);
      await this.eventBus.emit({
        name: POST_EVENTS.UNLIKED,
        payload: { postId, userId, tenantId: post.tenantId },
      });
      const updatedPost = await this.repository.findById(postId);
      return { liked: false, likesCount: updatedPost?.likesCount || 0 };
    } else {
      await this.likeRepository.create({
        post: { connect: { id: postId } },
        user: { connect: { id: userId } },
      });
      await this.repository.incrementLikesCount(postId);
      await this.eventBus.emit({
        name: POST_EVENTS.LIKED,
        payload: { postId, userId, tenantId: post.tenantId },
      });
      const updatedPost = await this.repository.findById(postId);
      return { liked: true, likesCount: updatedPost?.likesCount || 0 };
    }
  }

  // Override delete to soft delete (already handled by repository's update call)
  async delete(id: string): Promise<Post> {
    const post = await this.repository.update(id, { isDeleted: true });
    await this.eventBus.emit({
      name: POST_EVENTS.DELETED,
      payload: { postId: id, tenantId: post.tenantId },
    });
    return post;
  }
}
