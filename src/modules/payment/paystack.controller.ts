import {
  Controller,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Header,
  Req,
  RawBodyRequest,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { InitializePaymentDto } from './dto';
import { Public } from '../../common/decorators/public.decorator';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';
import {
  createSuccessResponse,
  ApiResponse,
} from '../../common/dto/api-response.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initialize')
  async initialize(
    @Body() dto: InitializePaymentDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ApiResponse<PaymentResponseDto>> {
    // Customer email from user (must be present)
    if (!user.email) throw new Error('User email required for payment');
    const result = await this.paymentService.initializePayment(
      dto.orderId,
      user.email,
      dto.callbackUrl,
    );
    return createSuccessResponse(result);
  }

  @Public()
  @Post('webhook/paystack')
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'application/json')
  async handlePaystackWebhook(@Req() req: RawBodyRequest<any>) {
    // Parse Paystack webhook signature and verify (omitted for brevity)
    const payload = req.body;
    const reference = payload.data?.reference;
    const event = payload.event;

    if (event === 'charge.success' && reference) {
      await this.paymentService.handleSuccessfulPayment(reference);
    }
    return { status: 'ok' };
  }
}
