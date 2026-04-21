/**
 * EmailQueueProcessor – Consumes jobs from the 'email' queue.
 * 
 * Each job type has its own @Process handler.
 * Handlers call the appropriate email service methods.
 */

import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { EmailService } from '../../../modules/notification/email/email.service';
import { LoggerService } from '../../../common/logger/logger.service';
import { USER_EVENTS, ORDER_EVENTS } from '../../../domain/events/event-types';
import { BaseEvent } from '../../../domain/events/event-map.interface';
import { ILogger } from 'src/common/logger/logger.interface';

@Processor('email')
export class EmailProcessor {
  private readonly logger: ILogger;

  constructor(
    private readonly emailService: EmailService,
    logger: LoggerService,
  ) {
    this.logger = logger.child('EmailProcessor');
  }

  @Process(USER_EVENTS.REGISTERED)
  async handleUserRegistered(job: Job<BaseEvent<typeof USER_EVENTS.REGISTERED>>) {
    const { payload , metadata } = job.data;
    this.logger.debug('Processing user.registered email job', {
      correlationId: metadata?.correlationId,
      email: payload.email,
    });

    await this.emailService.sendVerificationEmail(
      payload.email,
      payload.name || 'User',
      payload.verificationToken!,
      metadata?.correlationId,
    );

    this.logger.info('Verification email sent', { email: payload.email });
  }

  @Process(USER_EVENTS.PASSWORD_RESET_REQUESTED)
  async handlePasswordReset(job: Job<BaseEvent<typeof USER_EVENTS.PASSWORD_RESET_REQUESTED>>) {
    const { payload, metadata } = job.data;
    await this.emailService.sendPasswordResetEmail(
      payload.email,
      payload.name || 'User',
      payload.resetToken,
      metadata?.correlationId,
    );
  }

  @Process(ORDER_EVENTS.CREATED)
  async handleOrderCreated(job: Job<BaseEvent<typeof ORDER_EVENTS.CREATED>>) {
    const { payload, metadata } = job.data;
    await this.emailService.sendOrderConfirmationEmail(
      payload.customerEmail!,
      payload.customerName || 'Customer',
      payload.orderId,
      payload.items,
      payload.totalPrice,
      metadata?.correlationId,
    );
  }
}