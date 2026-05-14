import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { Public } from '../../../common/decorators/public.decorator';
import { OrderServiceImpl } from '../../order/service/order.service.impl';
import { LoggerService } from '../../../common/logger/logger.service';
import { ILogger } from '../../../common/logger/logger.interface';

@Controller('webhooks/whatsapp')
export class WhatsAppWebhookController {
  private readonly logger: ILogger;

  constructor(
    private readonly orderService: OrderServiceImpl,
    logger: LoggerService,
  ) {
    this.logger = logger.child('WhatsAppWebhook');
  }

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  async handleIncomingMessage(
    @Body() payload: any,
  ): Promise<{ status: string }> {
    // Twilio webhook format
    const message = payload.Body?.trim();
    const from = payload.From; // e.g., "whatsapp:+2348012345678"
    if (!message || !from) return { status: 'ignored' };

    // Extract 6-digit token
    const match = message.match(/^DONE\s+(\d{6})$/i);
    if (!match) return { status: 'ignored' };

    const token = match[1];
    // Extract phone number from "whatsapp:+234..."
    const phone = from.replace('whatsapp:', '');

    try {
      await this.orderService.confirmOrderByToken(token, phone);
      this.logger.info(
        `Order confirmed via WhatsApp token ${token} from ${phone}`,
      );
    } catch (error: any) {
      this.logger.warn(
        `Failed confirmation for token ${token}: ${error.message}`,
      );
    }
    return { status: 'ok' };
  }
}
