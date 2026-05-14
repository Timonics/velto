/**
 * EmailQueueService – Adds email jobs to the 'email' Bull queue.
 *
 * Each job has:
 * - Retry attempts: 3
 * - Exponential backoff: 5s delay between retries
 * - Deduplication via jobId (prevents duplicate emails)
 */

import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { BaseEvent } from '../../domain/events/event-map.interface';
import { ORDER_EVENTS, USER_EVENTS } from '../../domain/events/event-types';
import {
  OrderCreatedPayload,
  UserRegisteredPayload,
} from '../../domain/events/event-payloads.interface';

@Injectable()
export class EmailQueueService {
  constructor(@InjectQueue('email') private readonly emailQueue: Queue) {}

  async addJob(eventName: string, event: BaseEvent): Promise<void> {
    const jobId = this.generateJobId(eventName, event);

    await this.emailQueue.add(eventName, event, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
      removeOnFail: false, 
      jobId,
    });
  }

  private generateJobId(eventName: string, event: BaseEvent): string {
    // For user.registered, use email to deduplicate
    if (
      eventName === USER_EVENTS.REGISTERED &&
      (event.payload as UserRegisteredPayload).email
    ) {
      return `verification:${(event.payload as UserRegisteredPayload).email}`;
    }
    // For order.created, use orderId
    if (
      eventName === ORDER_EVENTS.CREATED &&
      (event.payload as OrderCreatedPayload).orderId
    ) {
      return `order:${(event.payload as OrderCreatedPayload).orderId}`;
    }
    // Fallback
    return `${eventName}:${event.metadata?.correlationId}:${Date.now()}`;
  }
}
