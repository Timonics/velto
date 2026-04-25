import { Controller, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ICommentService } from './comment.service.interface';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { createSuccessResponse, ApiResponse } from '../../common/dto/api-response.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentSerializer, CommentResponse } from '../../serializers/comment.serializer';

@Controller('comments')
export class CommentController {
  private readonly serializer = new CommentSerializer();

  constructor(private readonly commentService: ICommentService) {}

  @Post()
  @UseGuards(AuthGuard)
  async create(
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ApiResponse<CommentResponse>> {
    const comment = await this.commentService.create(dto.postId, user.id, dto.content);
    return createSuccessResponse(this.serializer.serialize(comment));
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ApiResponse<CommentResponse>> {
    const comment = await this.commentService.update(id, user.id, dto.content);
    return createSuccessResponse(this.serializer.serialize(comment));
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ApiResponse<null>> {
    await this.commentService.delete(id, user.id);
    return createSuccessResponse(null, 'Comment deleted');
  }

  @Public()
  @Get('post/:postId')
  async getByPost(
    @Param('postId') postId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<ApiResponse<CommentResponse[]>> {
    const comments = await this.commentService.getCommentsByPost(
      postId,
      skip ? parseInt(skip, 10) : 0,
      take ? parseInt(take, 10) : 20,
    );
    return createSuccessResponse(this.serializer.serializeMany(comments));
  }
}