import { Module } from '@nestjs/common';
import { EmailService } from './email/email.service';
import { WhatsAppService } from './whatsapp/whatsapp.service';

@Module({
  providers: [EmailService, WhatsAppService],
  exports: [EmailService, WhatsAppService],
})
export class NotificationModule {}