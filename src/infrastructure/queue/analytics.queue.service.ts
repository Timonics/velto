import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { BaseEvent } from '../../domain/events/event-map.interface';

@Injectable()
export class AnalyticsQueueService {
  constructor(@InjectQueue('analytics') private readonly analyticsQueue: Queue) {}

  async addJob(eventName: string, event: BaseEvent): Promise<void> {
    // Low priority, no retries needed
    await this.analyticsQueue.add(eventName, event, {
      attempts: 1,
      removeOnComplete: true,
    });
  }
}