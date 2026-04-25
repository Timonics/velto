import { BaseSerializer, SerializerOptions } from './base.serializer';
import { Comment } from '@prisma/client';

export interface CommentResponse {
  id: string;
  content: string;
  createdAt: string | null;
  updatedAt: string | null;
  user: {
    id: string;
    phone: string;
    email: string | null;
  };
}

export class CommentSerializer extends BaseSerializer<any, CommentResponse> {
  serialize(comment: any, options?: SerializerOptions): CommentResponse {
    return {
      id: comment.id,
      content: comment.content,
      createdAt: this.formatDate(comment.createdAt),
      updatedAt: this.formatDate(comment.updatedAt),
      user: comment.user
        ? {
            id: comment.user.id,
            phone: comment.user.phone,
            email: comment.user.email,
          }
        : null,
    };
  }
}