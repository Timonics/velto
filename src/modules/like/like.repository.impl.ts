import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { BaseRepositoryImpl } from '../../common/repositories/base.repository.impl';
import { ILikeRepository } from './like.repository.interface';
import { Like, Prisma } from 'generated/prisma/client';

@Injectable()
export class LikeRepositoryImpl
  extends BaseRepositoryImpl<Prisma.LikeDelegate, Like, Prisma.LikeCreateInput, Prisma.LikeUpdateInput>
  implements ILikeRepository
{
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, prisma.like);
  }

  async findByPostAndUser(postId: string, userId: string): Promise<Like | null> {
    return this.modelDelegate.findUnique({
      where: { postId_userId: { postId, userId } },
    });
  }

  async countLikesByPost(postId: string): Promise<number> {
    return this.modelDelegate.count({ where: { postId } });
  }

  async deleteByPostAndUser(postId: string, userId: string): Promise<void> {
    await this.modelDelegate.delete({
      where: { postId_userId: { postId, userId } },
    });
  }
}