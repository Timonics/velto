import { Module } from '@nestjs/common';
import { TenantController } from './tenant.controller';
import { ITenantRepository } from './repository/tenant.repository.interface';
import { TenantRepositoryImpl } from './repository/tenant.repository.impl';
import { ITenantService } from './services/tenant.service.interface';
import { TenantServiceImpl } from './services/tenant.service.impl';
import { LoggerService } from '../../common/logger/logger.service';
import { EventBus } from '../../domain/events/event-bus.service';

@Module({
  controllers: [TenantController],
  providers: [
    {
      provide: ITenantRepository,
      useClass: TenantRepositoryImpl,
    },
    {
      provide: ITenantService,
      useFactory: (
        repo: ITenantRepository,
        eventBus: EventBus,
        logger: LoggerService,
      ) => {
        return new TenantServiceImpl(repo, eventBus, logger);
      },
      inject: [ITenantRepository, EventBus, LoggerService],
    },
  ],
  exports: [ITenantService, ITenantRepository],
})
export class TenantModule {}
