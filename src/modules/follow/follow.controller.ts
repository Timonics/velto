import { Controller, Post, Delete, Param } from '@nestjs/common';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { createSuccessResponse, ApiResponse } from '../../common/dto/api-response.dto';
import { FollowServiceImpl } from './service/follow.service.impl';

@Controller('follow')
export class FollowController {
  constructor(private readonly followService: FollowServiceImpl) {}

  @Post(':tenantId')
  async follow(
    @CurrentUser() user: CurrentUserPayload,
    @Param('tenantId') tenantId: string,
  ): Promise<ApiResponse<null>> {
    await this.followService.follow(user.id, tenantId);
    return createSuccessResponse(null, 'Followed successfully');
  }

  @Delete(':tenantId')
  async unfollow(
    @CurrentUser() user: CurrentUserPayload,
    @Param('tenantId') tenantId: string,
  ): Promise<ApiResponse<null>> {
    await this.followService.unfollow(user.id, tenantId);
    return createSuccessResponse(null, 'Unfollowed successfully');
  }
}