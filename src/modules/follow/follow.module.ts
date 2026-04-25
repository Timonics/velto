import { Module } from '@nestjs/common';
import { IFollowRepository } from './follow.repository.interface';
import { FollowRepositoryImpl } from './follow.repository.impl';
import { IFollowService } from './follow.service.interface';
import { FollowServiceImpl } from './follow.service.impl';
import { FollowController } from './follow.controller';

@Module({
  controllers: [FollowController],
  providers: [
    { provide: IFollowRepository, useClass: FollowRepositoryImpl },
    { provide: IFollowService, useClass: FollowServiceImpl },
  ],
  exports: [IFollowService, IFollowRepository],
})
export class FollowModule {}
