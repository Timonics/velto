import { Module, Global } from '@nestjs/common';
import { LikeRepositoryImpl } from './like.repository.impl';
import { LikeServiceImpl } from './like.service.impl';
import { LikeController } from './like.controller';

@Global()
@Module({
  controllers: [LikeController],
  providers: [LikeRepositoryImpl, LikeServiceImpl],
  exports: [LikeRepositoryImpl, LikeServiceImpl],
})
export class LikeModule {}
