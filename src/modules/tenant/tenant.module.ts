import { Module } from '@nestjs/common';
import { TenantController } from './tenant.controller';
import { TenantRepositoryImpl } from './repository/tenant.repository.impl';
import { TenantServiceImpl } from './services/tenant.service.impl';
import { LoggerService } from '../../common/logger/logger.service';
import { EventBus } from '../../domain/events/event-bus.service';

@Module({
  providers: [
    {
      provide: 'ITenantRepository',
      useClass: TenantRepositoryImpl,
    },
    {
      provide: TenantServiceImpl,
      useFactory: (
        repo: TenantRepositoryImpl,
        eventBus: EventBus,
        logger: LoggerService,
      ) => {
        return new TenantServiceImpl(repo, eventBus, logger);
      },
      inject: ['ITenantRepository', EventBus, LoggerService],
    },
  ],
  exports: [TenantServiceImpl, 'ITenantRepository'],
  controllers: [TenantController],
})
export class TenantModule {}
