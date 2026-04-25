import { IBaseRepository } from '../../common/repositories/base.repository.interface';
import { Post, Prisma } from 'generated/prisma/client';

export interface IPostRepository extends IBaseRepository<
  Post,
  Prisma.PostCreateInput,
  Prisma.PostUpdateInput
> {
  findByTenantId(
    tenantId: string,
    skip?: number,
    take?: number,
  ): Promise<Post[]>;
  getFeedForUser(
    followedTenantIds: string[],
    skip?: number,
    take?: number,
  ): Promise<Post[]>;
  getTrendingPosts(limit?: number): Promise<Post[]>;
  incrementLikesCount(postId: string): Promise<void>;
  decrementLikesCount(postId: string): Promise<void>;
  incrementCommentsCount(postId: string): Promise<void>;
  decrementCommentsCount(postId: string): Promise<void>;
}
