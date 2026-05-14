import { BaseSerializer } from './base.serializer';
import { Review } from 'generated/prisma/client';

export interface ReviewResponse {
  id: string;
  rating: number;
  comment: string | null;
  isVerified: boolean;
  reply: string | null;
  repliedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  user: {
    id: string;
    phone: string;
    email: string | null;
  } | null;
  product: {
    id: string;
    name: string;
  } | null;
}

export class ReviewSerializer extends BaseSerializer<any, ReviewResponse> {
  serialize(review: any): ReviewResponse {
    return {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      isVerified: review.isVerified,
      reply: review.reply,
      repliedAt: this.formatDate(review.repliedAt),
      createdAt: this.formatDate(review.createdAt),
      updatedAt: this.formatDate(review.updatedAt),
      user: review.user
        ? {
            id: review.user.id,
            phone: review.user.phone,
            email: review.user.email,
          }
        : null,
      product: review.product
        ? {
            id: review.product.id,
            name: review.product.name,
          }
        : null,
    };
  }
}
