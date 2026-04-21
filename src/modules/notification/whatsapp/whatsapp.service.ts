import { Injectable, OnModuleInit } from '@nestjs/common';
import { Twilio } from 'twilio';
import { EnvironmentService } from 'src/config/env/env.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { ILogger } from 'src/common/logger/logger.interface';

@Injectable()
export class WhatsAppService implements OnModuleInit {
  private client: Twilio | null = null;
  private readonly logger: ILogger;
  private isConfigured = false;

  constructor(
    private readonly env: EnvironmentService,
    logger: LoggerService,
  ) {
    this.logger = logger.child('WhatsAppService');
  }

  async onModuleInit() {
    const accountSid = this.env.get('TWILIO_ACCOUNT_SID');
    const authToken = this.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = this.env.get('TWILIO_WHATSAPP_FROM');

    // Validate that credentials are present and look valid (accountSid must start with "AC")
    const isValid = !!(
      accountSid &&
      authToken &&
      fromNumber &&
      accountSid.startsWith('AC')
    );

    if (!isValid) {
      this.logger.warn(
        'Twilio credentials not configured or invalid. WhatsApp messages will be disabled.',
        {
          hasSid: !!accountSid,
          sidPrefix: accountSid?.substring(0, 2),
          hasToken: !!authToken,
          hasFrom: !!fromNumber,
        },
      );
      return;
    }

    try {
      this.client = new Twilio(accountSid, authToken);
      this.isConfigured = true;
      this.logger.info('Twilio client initialised successfully');
    } catch (error: any) {
      this.logger.error('Failed to initialise Twilio client', error.stack);
    }
  }

  async sendMessage(to: string, message: string, correlationId?: string): Promise<void> {
    if (!this.isConfigured || !this.client) {
      this.logger.warn('WhatsApp not configured – message not sent', { to, correlationId });
      return;
    }

    try {
      const fromNumber = this.env.get('TWILIO_WHATSAPP_FROM');
      await this.client.messages.create({
        body: message,
        from: fromNumber,
        to: `whatsapp:${to}`,
      });
      this.logger.info('WhatsApp message sent', { to, correlationId });
    } catch (error: any) {
      this.logger.error('WhatsApp send failed', error.stack, { to, correlationId });
      // Do not throw – failures should not crash the queue worker
    }
  }
}