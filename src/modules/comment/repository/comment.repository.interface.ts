import { IBaseRepository } from '../../../common/repositories/base.repository.interface';
import { Comment, Prisma } from 'generated/prisma/client';

export interface ICommentRepository extends IBaseRepository<Comment, Prisma.CommentCreateInput, Prisma.CommentUpdateInput> {
  findByPost(postId: string, skip?: number, take?: number): Promise<Comment[]>;
  countByPost(postId: string): Promise<number>;
  deleteByPost(postId: string): Promise<void>; // For cascade if needed
}