import { Module } from '@nestjs/common';
import { ServiceController } from './service.controller';
import { ServiceRepositoryImpl } from './repository/service.repository.impl';
import { ServiceServiceImpl } from './service/service.service.impl';
import { LoggerService } from 'src/common/logger/logger.service';

@Module({
  controllers: [ServiceController],
  providers: [
    {
      provide: 'IServiceRepository',
      useClass: ServiceRepositoryImpl,
    },
    {
      provide: ServiceServiceImpl,
      useFactory: (repo: ServiceRepositoryImpl, logger: LoggerService) =>
        new ServiceServiceImpl(repo, logger),
      inject: ['IServiceRepository', LoggerService],
    },
  ],
  exports: ['IServiceRepository'],
})
export class ServiceModule {}
