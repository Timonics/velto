import { Controller, Get } from '@nestjs/common';
import { LoggerService } from './common/logger/logger.service';
import { ILogger } from './common/logger/logger.interface';
import { NotFoundError } from './common/errors/app-error';
import { EmailService } from './modules/notification/email/email.service';

@Controller('test')
export class TestController {
  private readonly logger: ILogger;

  constructor(
    private readonly emailService: EmailService,
    logger: LoggerService,
  ) {
    this.logger = logger.child('TestController');
  }

  @Get('log')
  log() {
    this.logger.warn('Test log message', { custom: 'data' });
    throw new NotFoundError('User');
    // throw new ConflictError('Email already registered');
  }

  @Get('verification')
  async testVerification() {
    await this.emailService.sendVerificationEmail(
      'test@example.com',
      'John Doe',
      'test-token-123',
      'test-correlation-id',
    );
    return { ok: true };
  }
}
