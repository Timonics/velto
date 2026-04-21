import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { BaseEvent } from '../../domain/events/event-map.interface';

@Injectable()
export class WhatsAppQueueService {
  constructor(@InjectQueue('whatsapp') private readonly whatsappQueue: Queue) {}

  async addJob(eventName: string, event: BaseEvent): Promise<void> {
    await this.whatsappQueue.add(eventName, event, {
      attempts: 2,
      backoff: { type: 'fixed', delay: 10000 },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }
}