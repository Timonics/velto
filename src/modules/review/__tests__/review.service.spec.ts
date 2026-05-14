import { ReviewService } from '../review.service';
import { IReviewRepository } from '../repository/review.repository.interface';
import { IOrderRepository } from '../../order/repository/order.repository.interface';
import { IProductRepository } from '../../product/repository/product.repository.interface';
import { EventBus } from '../../../domain/events/event-bus.service';
import { ITransactionManager } from '../../../common/transactions/transaction-manager.interface';
import { LoggerService } from '../../../common/logger/logger.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from 'generated/prisma/client';

describe('ReviewService', () => {
  let service: ReviewService;
  let reviewRepository: jest.Mocked<IReviewRepository>;
  let orderRepository: jest.Mocked<IOrderRepository>;
  let productRepository: jest.Mocked<IProductRepository>;
  let eventBus: jest.Mocked<EventBus>;
  let transactionManager: jest.Mocked<ITransactionManager>;

  const mockUserId = 'user-123';
  const mockProductId = 'product-456';
  const mockTenantId = 'tenant-789';
  const mockOrderId = 'order-001';
  const mockReviewId = 'review-001';

  const mockProduct = {
    id: mockProductId,
    name: 'Test Product',
    tenantId: mockTenantId,
    averageRating: 0,
    reviewsCount: 0,
  };

  const mockReview = {
    id: mockReviewId,
    rating: 5,
    comment: 'Great product!',
    isVerified: true,
    productId: mockProductId,
    userId: mockUserId,
    orderId: mockOrderId,
    reply: null,
    repliedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrder = {
    id: mockOrderId,
    customerId: mockUserId,
    tenantId: mockTenantId,
    status: OrderStatus.COMPLETED,
    paymentStatus: PaymentStatus.PAID,
    orderItems: [{ productId: mockProductId }],
  };

  beforeEach(() => {
    reviewRepository = {
      findById: jest.fn(),
      findByProductId: jest.fn(),
      findByUserId: jest.fn(),
      findByOrderId: jest.fn(),
      findUserReviewForProduct: jest.fn(),
      updateRatingAndCount: jest.fn(),
      updateReply: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    } as any;

    orderRepository = {
      findOne: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByCustomerId: jest.fn(),
      findByTenantId: jest.fn(),
      count: jest.fn(),
    } as any;

    productRepository = {
      findById: jest.fn(),
      findMany: jest.fn(),
      updateStock: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByTenantId: jest.fn(),
      findByCategory: jest.fn(),
      count: jest.fn(),
    } as any;

    eventBus = { emit: jest.fn() } as any;
    transactionManager = {
      runInTransaction: jest.fn((callback) => callback({ client: {} })),
    } as any;

    const loggerMock = {
      child: jest.fn().mockReturnValue({
        info: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        error: jest.fn(),
      }),
    };

    service = new ReviewService(
      reviewRepository,
      orderRepository,
      productRepository,
      transactionManager,
      eventBus,
      loggerMock as any,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = { productId: mockProductId, rating: 5, comment: 'Great!' };

    it('should create a verified review if user has completed order', async () => {
      productRepository.findById.mockResolvedValue(mockProduct as any);
      reviewRepository.findUserReviewForProduct.mockResolvedValue(null);
      orderRepository.findOne.mockResolvedValue(mockOrder as any);
      reviewRepository.create.mockResolvedValue(mockReview as any);
      reviewRepository.updateRatingAndCount.mockResolvedValue(undefined);

      const result = await service.create(mockUserId, createDto);

      expect(result).toEqual(mockReview);
      expect(reviewRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          rating: 5,
          comment: 'Great!',
          isVerified: true,
          product: { connect: { id: mockProductId } },
          user: { connect: { id: mockUserId } },
          order: { connect: { id: mockOrderId } },
        }),
        {}, // transaction client
      );
      expect(reviewRepository.updateRatingAndCount).toHaveBeenCalledWith(mockProductId);
      expect(eventBus.emit).toHaveBeenCalled();
    });

    it('should create an unverified review if user has no completed order', async () => {
      productRepository.findById.mockResolvedValue(mockProduct as any);
      reviewRepository.findUserReviewForProduct.mockResolvedValue(null);
      orderRepository.findOne.mockResolvedValue(null);
      reviewRepository.create.mockResolvedValue({ ...mockReview, isVerified: false } as any);
      reviewRepository.updateRatingAndCount.mockResolvedValue(undefined);

      const result = await service.create(mockUserId, createDto);
      expect(result.isVerified).toBe(false);
    });

    it('should throw NotFoundException if product not found', async () => {
      productRepository.findById.mockResolvedValue(null);
      await expect(service.create(mockUserId, createDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user already reviewed the product', async () => {
      productRepository.findById.mockResolvedValue(mockProduct as any);
      reviewRepository.findUserReviewForProduct.mockResolvedValue(mockReview as any);
      await expect(service.create(mockUserId, createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    const updateDto = { rating: 4, comment: 'Updated comment' };

    it('should update review and recalc product rating if rating changed', async () => {
      reviewRepository.findById.mockResolvedValue(mockReview as any);
      reviewRepository.update.mockResolvedValue({ ...mockReview, ...updateDto } as any);
      reviewRepository.updateRatingAndCount.mockResolvedValue(undefined);

      const result = await service.update(mockUserId, mockReviewId, updateDto);
      expect(result.rating).toBe(4);
      expect(reviewRepository.update).toHaveBeenCalledWith(
        mockReviewId,
        { rating: 4, comment: 'Updated comment' },
        {},
      );
      expect(reviewRepository.updateRatingAndCount).toHaveBeenCalledWith(mockProductId);
    });

    it('should throw NotFoundException if review not found', async () => {
      reviewRepository.findById.mockResolvedValue(null);
      await expect(service.update(mockUserId, mockReviewId, updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      reviewRepository.findById.mockResolvedValue({ ...mockReview, userId: 'other-user' } as any);
      await expect(service.update(mockUserId, mockReviewId, updateDto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should delete review and recalc product rating', async () => {
      reviewRepository.findById.mockResolvedValue(mockReview as any);
      reviewRepository.delete.mockResolvedValue(mockReview as any);
      reviewRepository.updateRatingAndCount.mockResolvedValue(undefined);

      await service.delete(mockUserId, mockReviewId);
      expect(reviewRepository.delete).toHaveBeenCalledWith(mockReviewId, {});
      expect(reviewRepository.updateRatingAndCount).toHaveBeenCalledWith(mockProductId, {});
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      reviewRepository.findById.mockResolvedValue({ ...mockReview, userId: 'other-user' } as any);
      await expect(service.delete(mockUserId, mockReviewId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getProductReviews', () => {
    it('should return reviews for a product', async () => {
      reviewRepository.findByProductId.mockResolvedValue([mockReview] as any);
      productRepository.findById.mockResolvedValue(mockProduct as any);
      const result = await service.getProductReviews(mockProductId);
      expect(result).toHaveLength(1);
      expect(reviewRepository.findByProductId).toHaveBeenCalledWith(mockProductId, 0, 20);
    });

    it('should throw NotFoundException if product not found', async () => {
      productRepository.findById.mockResolvedValue(null);
      await expect(service.getProductReviews(mockProductId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserReviews', () => {
    it('should return reviews by user', async () => {
      reviewRepository.findByUserId.mockResolvedValue([mockReview] as any);
      const result = await service.getUserReviews(mockUserId);
      expect(result).toHaveLength(1);
      expect(reviewRepository.findByUserId).toHaveBeenCalledWith(mockUserId, 0, 20);
    });
  });

  describe('replyToReview', () => {
    const replyDto = { reply: 'Thank you for your feedback!' };

    it('should allow tenant to reply to review for their product', async () => {
      reviewRepository.findById.mockResolvedValue({ ...mockReview, product: { tenantId: mockTenantId } } as any);
      reviewRepository.updateReply.mockResolvedValue({ ...mockReview, reply: replyDto.reply, repliedAt: new Date() } as any);

      const result = await service.replyToReview(mockTenantId, mockReviewId, replyDto);
      expect(result.reply).toBe(replyDto.reply);
      expect(reviewRepository.updateReply).toHaveBeenCalledWith(mockReviewId, replyDto.reply);
    });

    it('should throw ForbiddenException if tenant does not own the product', async () => {
      reviewRepository.findById.mockResolvedValue({ ...mockReview, product: { tenantId: 'other-tenant' } } as any);
      await expect(service.replyToReview(mockTenantId, mockReviewId, replyDto)).rejects.toThrow(ForbiddenException);
    });
  });
});