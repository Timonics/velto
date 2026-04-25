import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { BaseRepositoryImpl } from '../../common/repositories/base.repository.impl';
import { IPostRepository } from './post.repository.interface';
import { Post, Prisma } from 'generated/prisma/client';

@Injectable()
export class PostRepositoryImpl
  extends BaseRepositoryImpl<Prisma.PostDelegate, Post, Prisma.PostCreateInput, Prisma.PostUpdateInput>
  implements IPostRepository
{
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, prisma.post);
  }

  async findByTenantId(tenantId: string, skip = 0, take = 20): Promise<Post[]> {
    return this.modelDelegate.findMany({
      where: { tenantId, isPublished: true, isDeleted: false },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { tenant: { select: { businessName: true, slug: true, logoUrl: true } } },
    });
  }

  async getFeedForUser(followedTenantIds: string[], skip = 0, take = 20): Promise<Post[]> {
    if (followedTenantIds.length === 0) return [];
    return this.modelDelegate.findMany({
      where: { tenantId: { in: followedTenantIds }, isPublished: true, isDeleted: false },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { tenant: { select: { businessName: true, slug: true, logoUrl: true } } },
    });
  }

  async getTrendingPosts(limit = 20): Promise<Post[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return this.modelDelegate.findMany({
      where: { createdAt: { gte: sevenDaysAgo }, isPublished: true, isDeleted: false },
      orderBy: [{ likesCount: 'desc' }, { commentsCount: 'desc' }],
      take: limit,
      include: { tenant: { select: { businessName: true, slug: true, logoUrl: true } } },
    });
  }

  async incrementLikesCount(postId: string): Promise<void> {
    await this.modelDelegate.update({ where: { id: postId }, data: { likesCount: { increment: 1 } } });
  }

  async decrementLikesCount(postId: string): Promise<void> {
    await this.modelDelegate.update({ where: { id: postId }, data: { likesCount: { decrement: 1 } } });
  }

  async incrementCommentsCount(postId: string): Promise<void> {
    await this.modelDelegate.update({ where: { id: postId }, data: { commentsCount: { increment: 1 } } });
  }

  async decrementCommentsCount(postId: string): Promise<void> {
    await this.modelDelegate.update({ where: { id: postId }, data: { commentsCount: { decrement: 1 } } });
  }
}