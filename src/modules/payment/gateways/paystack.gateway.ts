import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { EnvironmentService } from '../../../config/env/env.service';
import { LoggerService } from '../../../common/logger/logger.service';
import { ILogger } from '../../../common/logger/logger.interface';
import {
  IPaymentGateway,
  InitializePaymentParams,
  PaymentVerificationResult,
} from './payment-gateway.interface';

@Injectable()
export class PaystackGateway implements IPaymentGateway {
  private readonly client: AxiosInstance;
  private readonly logger: ILogger;
  private readonly secretKey: string;

  constructor(
    private readonly env: EnvironmentService,
    logger: LoggerService,
  ) {
    this.logger = logger.child('PaystackGateway');
    this.secretKey = this.env.get('PAYSTACK_SECRET_KEY');
    this.client = axios.create({
      baseURL: 'https://api.paystack.co',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  getGatewayName(): string {
    return 'paystack';
  }

  // ========== IPaymentGateway implementation ==========
  async initializePayment(
    params: InitializePaymentParams,
  ): Promise<{ authorizationUrl: string; reference: string }> {
    try {
      const payload: any = {
        email: params.email,
        amount: Math.round(params.amount * 100),
        reference: params.reference,
        callback_url:
          params.callbackUrl || this.env.get('PAYSTACK_CALLBACK_URL'),
        metadata: params.metadata,
      };

      if (params.splitConfig) {
        payload.subaccount = params.splitConfig.subaccount;
        payload.split = params.splitConfig.split;
      }

      const response = await this.client.post(
        '/transaction/initialize',
        payload,
      );
      if (!response.data.status)
        throw new Error(response.data.message || 'Initialization failed');

      return {
        authorizationUrl: response.data.data.authorization_url,
        reference: response.data.data.reference,
      };
    } catch (error: any) {
      this.logger.error('Paystack init failed', error.stack, {
        reference: params.reference,
      });
      throw new Error('Payment initialization failed');
    }
  }

  async verifyPayment(reference: string): Promise<PaymentVerificationResult> {
    try {
      const response = await this.client.get(
        `/transaction/verify/${reference}`,
      );
      const data = response.data.data;

      let status: PaymentVerificationResult['status'] = 'failed';
      if (data.status === 'success') status = 'success';
      else if (data.status === 'pending') status = 'pending';

      return {
        status,
        transactionId: data.reference,
        amount: data.amount / 100,
        currency: data.currency,
        channel: data.channel,
        rawData: data,
      };
    } catch (error: any) {
      this.logger.error('Paystack verify failed', error.stack, { reference });
      throw new Error('Payment verification failed');
    }
  }

  // ========== Subaccount management (Paystack-specific) ==========
  async createSubaccount(params: {
    businessName: string;
    bankCode: string;
    accountNumber: string;
    percentageCharge?: number;
    description?: string;
  }) {
    try {
      const response = await this.client.post('/subaccount', {
        business_name: params.businessName,
        bank_code: params.bankCode,
        account_number: params.accountNumber,
        percentage_charge: params.percentageCharge || 0,
        description: params.description || '',
        primary_contact_email: this.env.get('ADMIN_EMAIL') || 'admin@velto.app',
      });
      return response.data.data;
    } catch (error: any) {
      this.logger.error('Subaccount creation failed', error.stack, {
        businessName: params.businessName,
      });
      throw new Error('Failed to create seller subaccount');
    }
  }

  async fetchSubaccount(subaccountCode: string) {
    try {
      const response = await this.client.get(`/subaccount/${subaccountCode}`);
      return response.data.data;
    } catch {
      return null;
    }
  }

  async updateSubaccount(subaccountCode: string, params: any) {
    try {
      const response = await this.client.put(
        `/subaccount/${subaccountCode}`,
        params,
      );
      return response.data.data;
    } catch (error: any) {
      this.logger.error('Subaccount update failed', error.stack, {
        subaccountCode,
      });
      throw new Error('Failed to update subaccount');
    }
  }

  async createTransferRecipient(params: {
    bankCode: string;
    accountNumber: string;
    accountName: string;
  }) {
    try {
      const response = await this.client.post('/transferrecipient', {
        type: 'nuban',
        name: params.accountName,
        account_number: params.accountNumber,
        bank_code: params.bankCode,
        currency: 'NGN',
      });
      return { recipientCode: response.data.data.recipient_code };
    } catch (error: any) {
      this.logger.error('Recipient creation failed', error.stack, {
        accountNumber: params.accountNumber,
      });
      throw new Error('Failed to create transfer recipient');
    }
  }
}
