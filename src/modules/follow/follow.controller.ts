import { Controller, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { IFollowService } from './follow.service.interface';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { createSuccessResponse, ApiResponse } from '../../common/dto/api-response.dto';

@Controller('follow')
@UseGuards(AuthGuard)
export class FollowController {
  constructor(private readonly followService: IFollowService) {}

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