import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { BaseRepositoryImpl } from '../../common/repositories/base.repository.impl';
import { ICommentRepository } from './comment.repository.interface';
import { Comment, Prisma } from 'generated/prisma/client';

@Injectable()
export class CommentRepositoryImpl
  extends BaseRepositoryImpl<Prisma.CommentDelegate, Comment, Prisma.CommentCreateInput, Prisma.CommentUpdateInput>
  implements ICommentRepository
{
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, prisma.comment);
  }

  async findByPost(postId: string, skip = 0, take = 20): Promise<Comment[]> {
    return this.modelDelegate.findMany({
      where: { postId, parentId: null }, // top-level only; replies optional for MVP
      skip,
      take,
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, phone: true, email: true, role: true } },
      },
    });
  }

  async countByPost(postId: string): Promise<number> {
    return this.modelDelegate.count({ where: { postId } });
  }

  async deleteByPost(postId: string): Promise<void> {
    await this.modelDelegate.deleteMany({ where: { postId } });
  }
}