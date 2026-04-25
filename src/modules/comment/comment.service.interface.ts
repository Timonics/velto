import { Comment } from 'generated/prisma/client';

export interface ICommentService {
  create(postId: string, userId: string, content: string): Promise<Comment>;
  update(commentId: string, userId: string, content: string): Promise<Comment>;
  delete(commentId: string, userId: string): Promise<void>;
  getCommentsByPost(
    postId: string,
    skip?: number,
    take?: number,
  ): Promise<Comment[]>;
}
