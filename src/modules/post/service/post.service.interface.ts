import { IBaseService } from '../../../common/services/base.service.interface';
import { Post } from 'generated/prisma/client';
import { CreatePostDto, UpdatePostDto } from '../dto';

export interface IPostService extends IBaseService<
  Post,
  CreatePostDto,
  UpdatePostDto
> {
  create(data: CreatePostDto & { tenantId: string }): Promise<Post>;
  getPostsByTenant(
    tenantId: string,
    skip?: number,
    take?: number,
  ): Promise<Post[]>;
  getUserFeed(userId: string, skip?: number, take?: number): Promise<Post[]>;
  getTrendingPosts(limit?: number): Promise<Post[]>;
  toggleLike(
    postId: string,
    userId: string,
  ): Promise<{ liked: boolean; likesCount: number }>;
}
