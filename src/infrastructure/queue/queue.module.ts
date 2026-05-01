import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EnvironmentService } from '../../config/env/env.service';
import { EmailQueueService } from './email.queue.service';
import { WhatsAppQueueService } from './whatsapp.queue.service';
import { AnalyticsQueueService } from './analytics.queue.service';
import { EmailProcessor } from './processors/email.processor';
import { WhatsAppProcessor } from './processors/whatsapp.processor';
import { NotificationModule } from '../../modules/notification/notification.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (env: EnvironmentService) => {
        const redisConfig = {
          host: env.get('REDIS_HOST'),
          port: env.get('REDIS_PORT'),
          password: env.get('REDIS_PASSWORD'),
          db: env.get('REDIS_DB') || 1,
        };

        return {
          redis: redisConfig,
          defaultJobOptions: {
            removeOnComplete: true,
            removeOnFail: false,
          },
        };
      },
      inject: [EnvironmentService],
    }),
    BullModule.registerQueue(
      { name: 'email' },
      { name: 'whatsapp' },
      { name: 'analytics' },
    ),
    NotificationModule,
  ],
  providers: [
    EmailQueueService,
    WhatsAppQueueService,
    AnalyticsQueueService,
    EmailProcessor,
    WhatsAppProcessor,
    // AnalyticsProcessor can be added later
  ],
  exports: [EmailQueueService, WhatsAppQueueService, AnalyticsQueueService],
})
export class QueueModule {}
