import { Module } from '@nestjs/common';
import { TenantController } from './tenant.controller';
import { TenantRepositoryImpl } from './repository/tenant.repository.impl';
import { TenantServiceImpl } from './services/tenant.service.impl';
import { LoggerService } from '../../common/logger/logger.service';
import { EventBus } from '../../domain/events/event-bus.service';

@Module({
  controllers: [TenantController],
  providers: [
    TenantRepositoryImpl,
    {
      provide: TenantServiceImpl,
      useFactory: (
        repo: TenantRepositoryImpl,
        eventBus: EventBus,
        logger: LoggerService,
      ) => {
        return new TenantServiceImpl(repo, eventBus, logger);
      },
      inject: [TenantRepositoryImpl, EventBus, LoggerService],
    },
  ],
  exports: [TenantServiceImpl, TenantRepositoryImpl],
})
export class TenantModule {}
