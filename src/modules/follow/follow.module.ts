import { Module } from '@nestjs/common';
import { FollowController } from './follow.controller';
import { FollowRepositoryImpl } from './follow.repository.impl';
import { FollowServiceImpl } from './follow.service.impl';

@Module({
  controllers: [FollowController],
  providers: [FollowRepositoryImpl, FollowServiceImpl],
  exports: [FollowServiceImpl, FollowRepositoryImpl],
})
export class FollowModule {}