import { Controller, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { ILikeService } from './like.service.interface';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { createSuccessResponse, ApiResponse } from '../../common/dto/api-response.dto';

@Controller('likes')
@UseGuards(AuthGuard)
export class LikeController {
  constructor(private readonly likeService: ILikeService) {}

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