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
import { CreatePostDto, UpdatePostDto } from './dto';
import {
  PostSerializer,
  PostResponse,
} from '../../serializers/post.serializer';
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
import { Tenant } from 'generated/prisma/client';
import { PostServiceImpl } from './service/post.service.impl';

@Controller('posts')
export class PostController {
  private readonly serializer = new PostSerializer();

  constructor(private readonly postService: PostServiceImpl) {}

  @Get('feed')
  async getUserFeed(
    @CurrentUser() user: CurrentUserPayload,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<ApiResponse<PostResponse[]>> {
    const posts = await this.postService.getUserFeed(
      user.id,
      skip ? parseInt(skip, 10) : 0,
      take ? parseInt(take, 10) : 20,
    );
    return createSuccessResponse(this.serializer.serializeMany(posts));
  }

  @Public()
  @Get('trending')
  async getTrending(
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<PostResponse[]>> {
    const posts = await this.postService.getTrendingPosts(
      limit ? parseInt(limit, 10) : 20,
    );
    return createSuccessResponse(this.serializer.serializeMany(posts));
  }

  @Public()
  @Get('tenant/:tenantId')
  async getTenantPosts(
    @Param('tenantId') tenantId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<ApiResponse<PostResponse[]>> {
    const posts = await this.postService.getPostsByTenant(
      tenantId,
      skip ? parseInt(skip, 10) : 0,
      take ? parseInt(take, 10) : 20,
    );
    return createSuccessResponse(this.serializer.serializeMany(posts));
  }

  @Post()
  @UseGuards(TenantOwnerGuard)
  async create(
    @Body() data: CreatePostDto,
    @CurrentTenant() tenant: Tenant,
  ): Promise<ApiResponse<PostResponse>> {
    const post = await this.postService.create({
      ...data,
      tenantId: tenant.id,
    });
    return createSuccessResponse(this.serializer.serialize(post));
  }

  @Patch(':id')
  @UseGuards(TenantOwnerGuard)
  async update(
    @Param('id') id: string,
    @Body() data: UpdatePostDto,
  ): Promise<ApiResponse<PostResponse>> {
    const post = await this.postService.update(id, data);
    return createSuccessResponse(this.serializer.serialize(post));
  }

  @Delete(':id')
  @UseGuards(TenantOwnerGuard)
  async delete(@Param('id') id: string): Promise<ApiResponse<null>> {
    await this.postService.delete(id);
    return createSuccessResponse(null, 'Post deleted successfully');
  }

  @Post(':id/like')
  async toggleLike(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ApiResponse<{ liked: boolean; likesCount: number }>> {
    const result = await this.postService.toggleLike(id, user.id);
    return createSuccessResponse(result);
  }
}
