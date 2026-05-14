import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { BaseRepositoryImpl } from '../../../common/repositories/base.repository.impl';
import { IReviewRepository } from './review.repository.interface';
import { Review, Prisma } from 'generated/prisma/client';

@Injectable()
export class ReviewRepositoryImpl
  extends BaseRepositoryImpl<
    Prisma.ReviewDelegate,
    Review,
    Prisma.ReviewCreateInput,
    Prisma.ReviewUpdateInput
  >
  implements IReviewRepository
{
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, prisma.review, 'Review');
  }

  async findByProductId(
    productId: string,
    skip = 0,
    take = 20,
  ): Promise<Review[]> {
    return this.modelDelegate.findMany({
      where: { productId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, phone: true, email: true } },
      },
    });
  }

  async findByUserId(userId: string, skip = 0, take = 20): Promise<Review[]> {
    return this.modelDelegate.findMany({
      where: { userId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { product: true },
    });
  }

  async findByOrderId(orderId: string): Promise<Review[]> {
    return this.modelDelegate.findMany({
      where: { orderId },
    });
  }

  async findUserReviewForProduct(
    userId: string,
    productId: string,
  ): Promise<Review | null> {
    return this.modelDelegate.findUnique({
      where: { productId_userId: { productId, userId } },
    });
  }

  async updateRatingAndCount(productId: string, tx?: any): Promise<void> {
    const delegate = this.getDelegate(tx);
    const aggregate = await delegate.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await (tx || this.prisma).product.update({
      where: { id: productId },
      data: {
        averageRating: aggregate._avg.rating || 0,
        reviewsCount: aggregate._count.rating || 0,
      },
    });
  }

  async updateReply(reviewId: string, reply: string): Promise<Review> {
    return this.modelDelegate.update({
      where: { id: reviewId },
      data: {
        reply,
        repliedAt: new Date(),
      },
    });
  }
}
