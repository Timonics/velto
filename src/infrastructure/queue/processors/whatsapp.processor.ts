import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { WhatsAppService } from '../../../modules/notification/whatsapp/whatsapp.service';
import { LoggerService } from '../../../common/logger/logger.service';
import { BOOKING_EVENTS } from '../../../domain/events/event-types';
import { BaseEvent } from '../../../domain/events/event-map.interface';
import { ILogger } from 'src/common/logger/logger.interface';

@Processor('whatsapp')
export class WhatsAppProcessor {
  private readonly logger: ILogger;

  constructor(
    private readonly whatsappService: WhatsAppService,
    logger: LoggerService,
  ) {
    this.logger = logger.child('WhatsAppProcessor');
  }

  @Process(BOOKING_EVENTS.CREATED)
  async handleBookingCreated(job: Job<BaseEvent<typeof BOOKING_EVENTS.CREATED>>) {
    const { payload, metadata } = job.data;
    const message = `Your booking on ${payload.scheduledDate} is confirmed.`;
    await this.whatsappService.sendMessage(payload.customerPhone, message, metadata?.correlationId);
  }
}