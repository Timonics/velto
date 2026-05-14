import { IBaseRepository } from '../../../common/repositories/base.repository.interface';
import { Review, Prisma } from 'generated/prisma/client';

export interface IReviewRepository extends IBaseRepository<
  Review,
  Prisma.ReviewCreateInput,
  Prisma.ReviewUpdateInput
> {
  findByProductId(
    productId: string,
    skip?: number,
    take?: number,
  ): Promise<Review[]>;

  findByUserId(userId: string, skip?: number, take?: number): Promise<Review[]>;

  findByOrderId(orderId: string): Promise<Review[]>;

  findUserReviewForProduct(
    userId: string,
    productId: string,
  ): Promise<Review | null>;

  updateRatingAndCount(productId: string, tx?: any): Promise<void>;

  updateReply(reviewId: string, reply: string): Promise<Review>;
}
