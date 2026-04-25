import { Module, Global } from '@nestjs/common';
import { ILikeRepository } from './like.repository.interface';
import { LikeRepositoryImpl } from './like.repository.impl';
import { ILikeService } from './like.service.interface';
import { LikeServiceImpl } from './like.service.impl';
import { LikeController } from './like.controller';

@Global()
@Module({
  controllers: [LikeController],
  providers: [
    { provide: ILikeRepository, useClass: LikeRepositoryImpl },
    { provide: ILikeService, useClass: LikeServiceImpl },
  ],
  exports: [ILikeService, ILikeRepository],
})
export class LikeModule {}