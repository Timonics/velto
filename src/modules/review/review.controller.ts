import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto, UpdateReviewDto, ReplyReviewDto } from './dto';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { TenantOwnerGuard } from '../../common/guards/tenant-owner.guard';
import { Public } from '../../common/decorators/public.decorator';
import {
  createSuccessResponse,
  ApiResponse,
} from '../../common/dto/api-response.dto';
import {
  ReviewSerializer,
  ReviewResponse,
} from '../../serializers/review.serializer';
import { Tenant } from 'generated/prisma/client';

@Controller('reviews')
export class ReviewController {
  private readonly serializer = new ReviewSerializer();

  constructor(private readonly reviewService: ReviewService) {}

  // Create a review (authenticated user)
  @Post()
  async create(
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ApiResponse<ReviewResponse>> {
    const review = await this.reviewService.create(user.id, dto);
    return createSuccessResponse(this.serializer.serialize(review));
  }

  // Update own review
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ApiResponse<ReviewResponse>> {
    const review = await this.reviewService.update(user.id, id, dto);
    return createSuccessResponse(this.serializer.serialize(review));
  }

  // Delete own review
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ApiResponse<null>> {
    await this.reviewService.delete(user.id, id);
    return createSuccessResponse(null, 'Review deleted successfully');
  }

  // Get reviews for a product (public)
  @Public()
  @Get('product/:productId')
  async getProductReviews(
    @Param('productId') productId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<ApiResponse<ReviewResponse[]>> {
    const reviews = await this.reviewService.getProductReviews(
      productId,
      skip ? parseInt(skip, 10) : 0,
      take ? parseInt(take, 10) : 20,
    );
    return createSuccessResponse(this.serializer.serializeMany(reviews));
  }

  // Get current user's reviews
  @Get('my')
  async getMyReviews(
    @CurrentUser() user: CurrentUserPayload,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<ApiResponse<ReviewResponse[]>> {
    const reviews = await this.reviewService.getUserReviews(
      user.id,
      skip ? parseInt(skip, 10) : 0,
      take ? parseInt(take, 10) : 20,
    );
    return createSuccessResponse(this.serializer.serializeMany(reviews));
  }

  // Tenant replies to a review (requires tenant ownership)
  @Post(':id/reply')
  @UseGuards(TenantOwnerGuard)
  async replyToReview(
    @Param('id') id: string,
    @Body() dto: ReplyReviewDto,
    @CurrentTenant() tenant: Tenant,
  ): Promise<ApiResponse<ReviewResponse>> {
    const review = await this.reviewService.replyToReview(tenant.id, id, dto);
    return createSuccessResponse(this.serializer.serialize(review));
  }
}
