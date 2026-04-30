import { Controller, Post, Delete, Param } from '@nestjs/common';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';
import {
  createSuccessResponse,
  ApiResponse,
} from '../../common/dto/api-response.dto';
import { LikeServiceImpl } from './service/like.service.impl';

@Controller('likes')
export class LikeController {
  constructor(private readonly likeService: LikeServiceImpl) {}

  @Post('posts/:postId')
  async like(
    @CurrentUser() user: CurrentUserPayload,
    @Param('postId') postId: string,
  ): Promise<ApiResponse<null>> {
    await this.likeService.like(postId, user.id);
    return createSuccessResponse(null, 'Liked');
  }

  @Delete('posts/:postId')
  async unlike(
    @CurrentUser() user: CurrentUserPayload,
    @Param('postId') postId: string,
  ): Promise<ApiResponse<null>> {
    await this.likeService.unlike(postId, user.id);
    return createSuccessResponse(null, 'Unliked');
  }
}
