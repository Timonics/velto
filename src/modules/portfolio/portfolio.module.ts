import { Module } from '@nestjs/common';
import { PortfolioController } from './portfolio.controller';
import { PortfolioRepositoryImpl } from './portfolio.repository.impl';
import { PortfolioServiceImpl } from './portfolio.service.impl';
import { IPortfolioRepository } from './portfolio.repository.interface';
import { LoggerService } from 'src/common/logger/logger.service';

@Module({
  controllers: [PortfolioController],
  providers: [
    {
      provide: 'IPortfolioRepository',
      useClass: PortfolioRepositoryImpl,
    },
    {
      provide: PortfolioServiceImpl,
      useFactory: (repo: IPortfolioRepository, logger: LoggerService) =>
        new PortfolioServiceImpl(repo, logger),
      inject: ['IPortfolioRepository', LoggerService],
    },
  ],
  exports: ['IPortfolioRepository', PortfolioServiceImpl],
})
export class PortfolioModule {}
