import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingRepositoryImpl } from './booking.repository.impl';
import { BookingServiceImpl } from './booking.service.impl';
import { ServiceModule } from '../service/service.module'; // for IServiceRepository
import { IBookingRepository } from './booking.repository.interface';
import { IServiceRepository } from '../service/repository/service.repository.interface';
import { EventBus } from 'src/domain/events/event-bus.service';
import { LoggerService } from 'src/common/logger/logger.service';

@Module({
  imports: [ServiceModule],
  controllers: [BookingController],
  providers: [
    {
      provide: 'IBookingRepository',
      useClass: BookingRepositoryImpl,
    },
    {
      provide: BookingServiceImpl,
      useFactory: (
        repo: IBookingRepository,
        serviceRepo: IServiceRepository,
        eventBus: EventBus,
        logger: LoggerService,
      ) => new BookingServiceImpl(repo, serviceRepo, eventBus, logger),
      inject: [
        'IBookingRepository',
        'IServiceRepository',
        EventBus,
        LoggerService,
      ],
    },
  ],
  exports: ['IBookingRepository'],
})
export class BookingModule {}
