import { Global, Module, OnModuleInit } from '@nestjs/common';
import { EmailService } from './email.service';
import { EnvironmentService } from '../../../config/env/env.service';
import { LoggerService } from '../../../common/logger/logger.service';

/**
 * EmailModule – Global module that provides EmailService.
 * 
 * It initialises SendGrid and loads templates when the module boots.
 * 
 * @Global() – Makes EmailService available everywhere without importing.
 */
@Global()
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule implements OnModuleInit {
  constructor(
    private readonly emailService: EmailService,
    private readonly env: EnvironmentService,
    private readonly logger: LoggerService,
  ) {}

  async onModuleInit() {
    const apiKey = this.env.get('SENDGRID_API_KEY');
    const fromEmail = this.env.get('SENDGRID_FROM_EMAIL');

    if (!apiKey) {
      this.logger.warn('⚠️ SENDGRID_API_KEY not set. Email sending will fail.');
    }
    if (!fromEmail) {
      this.logger.warn('⚠️ SENDGRID_FROM_EMAIL not set. Email sending will fail.');
    }

    // Initialise SendGrid and load templates
    await this.emailService.onModuleInit();
  }
}