import { Global, Module } from '@nestjs/common';
import { EventBus } from './event-bus.service';
import { QueueModule } from '../../infrastructure/queue/queue.module';

@Global()
@Module({
  imports: [QueueModule],
  providers: [EventBus],
  exports: [EventBus],
})
export class EventBusModule {}