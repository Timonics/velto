import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { IReviewRepository } from './repository/review.repository.interface';
import { IOrderRepository } from '../order/repository/order.repository.interface';
import { IProductRepository } from '../product/repository/product.repository.interface';
import { CreateReviewDto, UpdateReviewDto, ReplyReviewDto } from './dto';
import { Review, OrderStatus, PaymentStatus } from 'generated/prisma/client';
import { LoggerService } from '../../common/logger/logger.service';
import { ILogger } from '../../common/logger/logger.interface';
import { EventBus } from '../../domain/events/event-bus.service';
import { REVIEW_EVENTS } from '../../domain/events/event-types';
import { ITransactionManager } from 'src/common/transactions/transaction-manager.interface';

@Injectable()
export class ReviewService {
  private readonly logger: ILogger;

  constructor(
    @Inject('IReviewRepository')
    private readonly reviewRepository: IReviewRepository,
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    @Inject('ITransactionManager')
    private readonly transactionManager: ITransactionManager,
    private readonly eventBus: EventBus,
    private readonly loggerService: LoggerService,
  ) {
    this.logger = this.loggerService.child('ReviewService');
  }

  async create(userId: string, dto: CreateReviewDto): Promise<Review> {
    // Check if product exists
    const product = await this.productRepository.findById(dto.productId);
    if (!product) throw new NotFoundException('Product not found');

    // Check if user already reviewed this product
    const existing = await this.reviewRepository.findUserReviewForProduct(
      userId,
      dto.productId,
    );
    if (existing)
      throw new BadRequestException('You have already reviewed this product');

    // Find a completed order for this product to verify purchase
    const order = await this.orderRepository.findOne({
      where: {
        customerId: userId,
        tenantId: product.tenantId,
        status: OrderStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        orderItems: { some: { productId: dto.productId } },
      },
    });

    const isVerified = !!order;

    // Create review
    return this.transactionManager.runInTransaction(async (txContext) => {
      const review = await this.reviewRepository.create(
        {
          rating: dto.rating,
          comment: dto.comment,
          isVerified,
          product: { connect: { id: dto.productId } },
          user: { connect: { id: userId } },
          order: order ? { connect: { id: order.id } } : undefined,
        } as any,
        txContext.client,
      );

      // Update product average rating and count
      await this.reviewRepository.updateRatingAndCount(dto.productId);

      await this.eventBus.emit({
        name: REVIEW_EVENTS.CREATED,
        payload: {
          reviewId: review.id,
          productId: dto.productId,
          userId,
          rating: dto.rating,
          isVerified,
        },
      });

      this.logger.info(
        `Review created for product ${dto.productId} by user ${userId}`,
      );
      return review;
    });
  }

  async update(
    userId: string,
    reviewId: string,
    dto: UpdateReviewDto,
  ): Promise<Review> {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== userId)
      throw new ForbiddenException('You can only update your own reviews');

    return this.transactionManager.runInTransaction(async (tsContext) => {
      const updated = await this.reviewRepository.update(
        reviewId,
        {
          rating: dto.rating,
          comment: dto.comment,
        } as any,
        tsContext.client,
      );

      if (dto.rating) {
        await this.reviewRepository.updateRatingAndCount(review.productId);
      }

      this.logger.info(`Review ${reviewId} updated`);
      return updated;
    });
  }

  async delete(userId: string, reviewId: string): Promise<void> {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== userId)
      throw new ForbiddenException('You can only delete your own reviews');
    return this.transactionManager.runInTransaction(async (txContext) => {
      await this.reviewRepository.delete(reviewId, txContext.client);
      await this.reviewRepository.updateRatingAndCount(review.productId, txContext.client);

      this.logger.info(`Review ${reviewId} deleted`);
    });
  }

  async getProductReviews(
    productId: string,
    skip = 0,
    take = 20,
  ): Promise<Review[]> {
    const product = await this.productRepository.findById(productId);
    if (!product) throw new NotFoundException('Product not found');
    return this.reviewRepository.findByProductId(productId, skip, take);
  }

  async getUserReviews(userId: string, skip = 0, take = 20): Promise<Review[]> {
    return this.reviewRepository.findByUserId(userId, skip, take);
  }

  async replyToReview(
    tenantId: string,
    reviewId: string,
    dto: ReplyReviewDto,
  ): Promise<Review> {
    const review = await this.reviewRepository.findById(reviewId, {
      product: true,
    });
    if (!review) throw new NotFoundException('Review not found');
    const product = (review as any).product;
    if (product.tenantId !== tenantId)
      throw new ForbiddenException(
        'You can only reply to reviews for your products',
      );

    const updated = await this.reviewRepository.updateReply(
      reviewId,
      dto.reply,
    );
    this.logger.info(`Reply added to review ${reviewId}`);
    return updated;
  }
}
