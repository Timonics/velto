import { IBaseRepository } from '../../../common/repositories/base.repository.interface';
import { Like, Prisma } from 'generated/prisma/client';

export interface ILikeRepository extends IBaseRepository<Like, Prisma.LikeCreateInput, Prisma.LikeUpdateInput> {
  findByPostAndUser(postId: string, userId: string): Promise<Like | null>;
  countLikesByPost(postId: string): Promise<number>;
  deleteByPostAndUser(postId: string, userId: string): Promise<void>;
}