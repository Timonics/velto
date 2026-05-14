import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsRepositoryImpl } from './repository/analytics.repository.impl';
import { PrismaModule } from '../../infrastructure/database/database.module';
import { LoggerModule } from '../../common/logger/logger.module';

@Module({
  imports: [PrismaModule, LoggerModule],
  controllers: [AnalyticsController],
  providers: [
    {
      provide: 'IAnalyticsRepository',
      useClass: AnalyticsRepositoryImpl,
    },
    AnalyticsService,
  ],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
