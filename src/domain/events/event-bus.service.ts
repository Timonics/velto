/**
 * EventBus – Central dispatcher that routes domain events to dedicated queues.
 *
 * HOW IT WORKS:
 * 1. Domain service emits an event (e.g., USER_EVENTS.REGISTERED)
 * 2. EventBus looks up which queue handles that event (routingMap)
 * 3. EventBus adds a job to that queue with the enriched event data
 * 4. Queue processor picks up the job and executes side effects (email, WhatsApp, etc.)
 *
 * USAGE IN SERVICE:
 *   this.eventBus.emit({
 *     name: USER_EVENTS.REGISTERED,
 *     payload: { userId, email, phone, name, verificationToken }
 *   });
 */

import { Injectable } from '@nestjs/common';
import { BaseEvent, EventMap } from './event-map.interface';
import { USER_EVENTS, ORDER_EVENTS, BOOKING_EVENTS, POST_EVENTS } from './event-types';
import { EmailQueueService } from '../../infrastructure/queue/email.queue.service';
import { WhatsAppQueueService } from '../../infrastructure/queue/whatsapp.queue.service';
import { AnalyticsQueueService } from '../../infrastructure/queue/analytics.queue.service';
import { RequestContext } from '../../core/context/request-context';
import { LoggerService } from '../../common/logger/logger.service';
import { ILogger } from 'src/common/logger/logger.interface';

type QueueService =
  | EmailQueueService
  | WhatsAppQueueService
  | AnalyticsQueueService;

@Injectable()
export class EventBus {
  private readonly routingMap: Map<string, QueueService> = new Map();
  private readonly logger: ILogger;

  constructor(
    private readonly emailQueue: EmailQueueService,
    private readonly whatsappQueue: WhatsAppQueueService,
    // private readonly analyticsQueue: AnalyticsQueueService,
    logger: LoggerService,
  ) {
    this.logger = logger.child('EventBus');
    this.initializeRouting();
  }

  private initializeRouting(): void {
    // User events → email queue (welcome, verification, password reset)
    this.routingMap.set(USER_EVENTS.REGISTERED, this.emailQueue);
    this.routingMap.set(USER_EVENTS.PASSWORD_RESET_REQUESTED, this.emailQueue);
    this.routingMap.set(USER_EVENTS.VERIFIED, this.emailQueue);

    // Order events → email queue (order confirmation)
    this.routingMap.set(ORDER_EVENTS.CREATED, this.emailQueue);

    // Booking events → WhatsApp queue (appointment reminders)
    this.routingMap.set(BOOKING_EVENTS.CREATED, this.whatsappQueue);
    this.routingMap.set(BOOKING_EVENTS.CONFIRMED, this.whatsappQueue);

    //Posting events → 
    this.routingMap.set(POST_EVENTS.LIKED, this.emailQueue)
    this.routingMap.set(POST_EVENTS.DELETED, this.emailQueue)

    //Comment events → email queue (new comment notifications)
    // this.routingMap.set(COMMENT_EVENTS.CREATED, this.emailQueue);

    // Analytics events → analytics queue (page views, conversions)
    // this.routingMap.set(ANALYTICS_EVENTS.PAGE_VIEW, this.analyticsQueue);
  }

  /**
   * Emit an event asynchronously (fire and forget).
   * The event is added to the appropriate queue and processed later.
   */
  async emit<T extends keyof EventMap>(event: BaseEvent<T>): Promise<void> {
    const enriched = this.enrichEvent(event);
    const queue = this.routingMap.get(event.name);

    if (!queue) {
      this.logger.warn(`No queue configured for event: ${event.name}`);
      return;
    }

    this.logger.debug(`Routing event ${event.name} to queue`, {
      correlationId: enriched.metadata?.correlationId,
    });

    await queue.addJob(event.name, enriched);
  }

  /**
   * Enrich event with metadata for tracing and debugging.
   */
  private enrichEvent<T extends keyof EventMap>(
    event: BaseEvent<T>,
  ): BaseEvent<T> {
    return {
      ...event,
      metadata: {
        timestamp: new Date(),
        correlationId: RequestContext.getCorrelationId(),
        userId: RequestContext.getUserId(),
        ipAddress: RequestContext.getIpAddress(),
        version: 1,
        ...event.metadata,
      },
    };
  }
}
