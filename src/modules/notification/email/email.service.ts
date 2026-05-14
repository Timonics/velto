/**
 * EmailService – Production‑ready email sending using SendGrid.
 * 
 * FEATURES:
 * - SendGrid dynamic templates (priority 1)
 * - Handlebars filesystem templates (priority 2)
 * - Inline HTML fallback (priority 3)
 * - Automatic template loading at startup
 * - Graceful failure (logs error, doesn't throw)
 * - Correlation ID passed through for tracing
 * 
 * WHY SENDGRID?
 * - High deliverability, analytics, and dynamic template editor
 * - Reliable API with retries built-in
 * 
 * USAGE:
 *   await emailService.sendVerificationEmail(email, name, token, correlationId);
 */

import { Injectable, OnModuleInit } from '@nestjs/common';
import sgMail from '@sendgrid/mail';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { EnvironmentService } from '../../../config/env/env.service';
import { LoggerService } from '../../../common/logger/logger.service';
import { ILogger } from '../../../common/logger/logger.interface';

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger: ILogger;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();
  private isInitialized = false;

  constructor(
    private readonly env: EnvironmentService,
    logger: LoggerService,
  ) {
    this.logger = logger.child('EmailService');
    this.fromEmail = this.env.get('SENDGRID_FROM_EMAIL')!;
    this.fromName = this.env.get('SENDGRID_FROM_NAME')!;
  }

  async onModuleInit() {
    if (this.isInitialized) return;

    const apiKey = this.env.get('SENDGRID_API_KEY');
    if (!apiKey) {
      this.logger.warn('SendGrid API key not configured. Email sending will fail.');
      return;
    }

    try {
      sgMail.setApiKey(apiKey);
      await this.loadTemplates();
      this.isInitialized = true;
      this.logger.info('SendGrid initialized successfully');
    } catch (error: any) {
      this.logger.error('Failed to initialize SendGrid', error.stack);
    }
  }

  private async loadTemplates(): Promise<void> {
    const templateFiles: Record<string, string> = {
      verification: 'verification.hbs',
      'password-reset': 'password-reset.hbs',
      welcome: 'welcome.hbs',
      'order-confirmation': 'order-confirmation.hbs',
      'shipping-update': 'shipping-update.hbs',
      'order-cancellation': 'order-cancellation.hbs',
      'vendor-approval': 'vendor-approval.hbs',
      'vendor-rejection': 'vendor-rejection.hbs',
    };

    const templatesDir = path.join(process.cwd(), 'src', 'modules', 'notification', 'email', 'templates');

    for (const [name, filename] of Object.entries(templateFiles)) {
      try {
        const templatePath = path.join(templatesDir, filename);
        const content = await fs.readFile(templatePath, 'utf-8');
        this.templates.set(name, Handlebars.compile(content));
        this.logger.debug(`Loaded email template: ${filename}`);
      } catch (error) {
        // Templates are optional – log debug only
        this.logger.debug(`Email template not found: ${filename}`);
      }
    }
  }

  private async sendEmail(options: EmailOptions, correlationId?: string): Promise<void> {
    if (!this.isInitialized) {
      this.logger.warn(`Email not sent – service not initialized. To: ${options.to}`, { correlationId });
      return;
    }

    try {
      const msg: any = {
        to: options.to,
        from: { email: this.fromEmail, name: this.fromName },
        subject: options.subject,
      };

      if (options.templateId) {
        msg.templateId = options.templateId;
        msg.dynamicTemplateData = options.dynamicTemplateData;
      } else if (options.html) {
        msg.html = options.html;
        if (options.text) msg.text = options.text;
      }

      await sgMail.send(msg);
      this.logger.info(`Email sent to ${options.to} – Subject: ${options.subject}`, { correlationId });
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${options.to}: ${error.message}`, error.stack, { correlationId });
      if (error.response?.body) {
        this.logger.debug(`SendGrid error details: ${JSON.stringify(error.response.body)}`, { correlationId });
      }
      // Do not rethrow – email failures should not crash the queue worker
    }
  }

  // ========== SPECIFIC EMAIL METHODS ==========

  async sendVerificationEmail(email: string, name: string, token: string, correlationId?: string): Promise<void> {
    const frontendUrl = this.env.get('FRONTEND_URL');
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;
    const templateId = this.env.get('SENDGRID_VERIFICATION_TEMPLATE_ID');

    if (templateId) {
      await this.sendEmail({
        to: email,
        subject: 'Verify Your Email',
        templateId,
        dynamicTemplateData: {
          name,
          verificationUrl,
          year: new Date().getFullYear(),
        },
      }, correlationId);
      return;
    }

    const template = this.templates.get('verification');
    if (template) {
      const html = template({ name, verificationUrl, year: new Date().getFullYear() });
      await this.sendEmail({ to: email, subject: 'Verify Your Email', html }, correlationId);
      return;
    }

    // Ultimate fallback
    const fallbackHtml = this.getVerificationFallbackHtml(name, verificationUrl);
    await this.sendEmail({ to: email, subject: 'Verify Your Email', html: fallbackHtml }, correlationId);
  }

  async sendPasswordResetEmail(email: string, name: string, token: string, correlationId?: string): Promise<void> {
    const frontendUrl = this.env.get('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    const templateId = this.env.get('SENDGRID_PASSWORD_RESET_TEMPLATE_ID');

    if (templateId) {
      await this.sendEmail({
        to: email,
        subject: 'Reset Your Password',
        templateId,
        dynamicTemplateData: { name, resetUrl, year: new Date().getFullYear() },
      }, correlationId);
      return;
    }

    const template = this.templates.get('password-reset');
    if (template) {
      const html = template({ name, resetUrl, year: new Date().getFullYear() });
      await this.sendEmail({ to: email, subject: 'Reset Your Password', html }, correlationId);
      return;
    }

    const fallbackHtml = this.getPasswordResetFallbackHtml(name, resetUrl);
    await this.sendEmail({ to: email, subject: 'Reset Your Password', html: fallbackHtml }, correlationId);
  }

  async sendWelcomeEmail(email: string, name: string, correlationId?: string): Promise<void> {
    const frontendUrl = this.env.get('FRONTEND_URL');
    const loginUrl = `${frontendUrl}/login`;
    const templateId = this.env.get('SENDGRID_WELCOME_TEMPLATE_ID');

    if (templateId) {
      await this.sendEmail({
        to: email,
        subject: 'Welcome to Velto!',
        templateId,
        dynamicTemplateData: { name, loginUrl, year: new Date().getFullYear() },
      }, correlationId);
      return;
    }

    const template = this.templates.get('welcome');
    if (template) {
      const html = template({ name, loginUrl, year: new Date().getFullYear() });
      await this.sendEmail({ to: email, subject: 'Welcome to Velto!', html }, correlationId);
      return;
    }

    const fallbackHtml = this.getWelcomeFallbackHtml(name, loginUrl);
    await this.sendEmail({ to: email, subject: 'Welcome to Velto!', html: fallbackHtml }, correlationId);
  }

  async sendOrderConfirmationEmail(
    email: string,
    name: string,
    orderNumber: string,
    items: Array<{ productId: string; quantity: number; price: number }>,
    total: number,
    correlationId?: string,
  ): Promise<void> {
    const frontendUrl = this.env.get('FRONTEND_URL');
    const orderUrl = `${frontendUrl}/orders/${orderNumber}`;
    const templateId = this.env.get('SENDGRID_ORDER_CONFIRMATION_TEMPLATE_ID');

    if (templateId) {
      await this.sendEmail({
        to: email,
        subject: `Order Confirmed #${orderNumber}`,
        templateId,
        dynamicTemplateData: {
          name,
          orderNumber,
          items,
          total: total.toFixed(2),
          orderUrl,
          year: new Date().getFullYear(),
        },
      }, correlationId);
      return;
    }

    const template = this.templates.get('order-confirmation');
    if (template) {
      const html = template({
        name,
        orderNumber,
        items,
        total: total.toFixed(2),
        orderUrl,
        year: new Date().getFullYear(),
      });
      await this.sendEmail({ to: email, subject: `Order Confirmed #${orderNumber}`, html }, correlationId);
      return;
    }

    // Fallback HTML
    const itemsHtml = items.map(item => `
      <tr>
        <td>${item.productId}</td>
        <td>${item.quantity}</td>
        <td>₦${item.price.toFixed(2)}</td>
        <td>₦${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');
    const html = `
      <html><body>
      <h1>Order Confirmed!</h1>
      <p>Thank you, ${name}!</p>
      <p>Order #: ${orderNumber}</p>
      <table border="1"><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>${itemsHtml}<tr><td colspan="3"><strong>Total</strong></td><td><strong>₦${total.toFixed(2)}</strong></td></tr></table>
      <p><a href="${orderUrl}">View order</a></p>
      </body></html>`;
    await this.sendEmail({ to: email, subject: `Order Confirmed #${orderNumber}`, html }, correlationId);
  }

  async sendShippingUpdateEmail(
    email: string,
    name: string,
    orderNumber: string,
    trackingNumber: string,
    carrier: string,
    estimatedDelivery?: Date,
    correlationId?: string,
  ): Promise<void> {
    const frontendUrl = this.env.get('FRONTEND_URL');
    const trackingUrl = `${frontendUrl}/orders/${orderNumber}/track`;
    const templateId = this.env.get('SENDGRID_SHIPPING_UPDATE_TEMPLATE_ID');
    const estimated = estimatedDelivery ? estimatedDelivery.toDateString() : 'soon';

    if (templateId) {
      await this.sendEmail({
        to: email,
        subject: `Your Order #${orderNumber} Has Shipped`,
        templateId,
        dynamicTemplateData: {
          name,
          orderNumber,
          trackingNumber,
          carrier,
          estimatedDelivery: estimated,
          trackingUrl,
          year: new Date().getFullYear(),
        },
      }, correlationId);
      return;
    }

    const template = this.templates.get('shipping-update');
    if (template) {
      const html = template({
        name,
        orderNumber,
        trackingNumber,
        carrier,
        estimatedDelivery: estimated,
        trackingUrl,
        year: new Date().getFullYear(),
      });
      await this.sendEmail({ to: email, subject: `Your Order #${orderNumber} Has Shipped`, html }, correlationId);
      return;
    }

    const html = `
      <html><body>
      <h1>Order Shipped!</h1>
      <p>Hello ${name},</p>
      <p>Your order #${orderNumber} is on the way via ${carrier}.</p>
      <p>Tracking number: ${trackingNumber}</p>
      <p>Estimated delivery: ${estimated}</p>
      <p><a href="${trackingUrl}">Track your package</a></p>
      </body></html>`;
    await this.sendEmail({ to: email, subject: `Your Order #${orderNumber} Has Shipped`, html }, correlationId);
  }

  async sendOrderCancellationEmail(email: string, orderNumber: string, reason?: string, correlationId?: string): Promise<void> {
    const templateId = this.env.get('SENDGRID_ORDER_CANCELLATION_TEMPLATE_ID');

    if (templateId) {
      await this.sendEmail({
        to: email,
        subject: `Your Order #${orderNumber} Has Been Cancelled`,
        templateId,
        dynamicTemplateData: { orderNumber, reason, year: new Date().getFullYear() },
      }, correlationId);
      return;
    }

    const template = this.templates.get('order-cancellation');
    if (template) {
      const html = template({ orderNumber, reason, year: new Date().getFullYear() });
      await this.sendEmail({ to: email, subject: `Order Cancelled #${orderNumber}`, html }, correlationId);
      return;
    }

    const html = `<html><body><h1>Order Cancelled</h1><p>Your order #${orderNumber} has been cancelled.${reason ? ` Reason: ${reason}` : ''}</p></body></html>`;
    await this.sendEmail({ to: email, subject: `Order Cancelled #${orderNumber}`, html }, correlationId);
  }

  async sendVendorApprovalEmail(email: string, storeName: string, correlationId?: string): Promise<void> {
    const dashboardUrl = `${this.env.get('FRONTEND_URL')}/vendor/dashboard`;
    const templateId = this.env.get('SENDGRID_VENDOR_APPROVAL_TEMPLATE_ID');

    if (templateId) {
      await this.sendEmail({
        to: email,
        subject: 'Your Vendor Application is Approved!',
        templateId,
        dynamicTemplateData: { storeName, dashboardUrl, year: new Date().getFullYear() },
      }, correlationId);
      return;
    }

    const template = this.templates.get('vendor-approval');
    if (template) {
      const html = template({ storeName, dashboardUrl, year: new Date().getFullYear() });
      await this.sendEmail({ to: email, subject: 'Vendor Application Approved', html }, correlationId);
      return;
    }

    const html = `<html><body><h1>Congratulations ${storeName}!</h1><p>Your vendor application has been approved. <a href="${dashboardUrl}">Go to dashboard</a></p></body></html>`;
    await this.sendEmail({ to: email, subject: 'Vendor Application Approved', html }, correlationId);
  }

  async sendVendorRejectionEmail(email: string, storeName: string, reason?: string, correlationId?: string): Promise<void> {
    const templateId = this.env.get('SENDGRID_VENDOR_REJECTION_TEMPLATE_ID');

    if (templateId) {
      await this.sendEmail({
        to: email,
        subject: 'Update on Your Vendor Application',
        templateId,
        dynamicTemplateData: { storeName, reason, year: new Date().getFullYear() },
      }, correlationId);
      return;
    }

    const template = this.templates.get('vendor-rejection');
    if (template) {
      const html = template({ storeName, reason, year: new Date().getFullYear() });
      await this.sendEmail({ to: email, subject: 'Vendor Application Update', html }, correlationId);
      return;
    }

    const html = `<html><body><h1>Application Status</h1><p>Dear ${storeName}, your vendor application has not been approved at this time.${reason ? ` Reason: ${reason}` : ''}</p></body></html>`;
    await this.sendEmail({ to: email, subject: 'Vendor Application Update', html }, correlationId);
  }

  // ========== FALLBACK HTML METHODS ==========

  private getVerificationFallbackHtml(name: string, verificationUrl: string): string {
    return `<!DOCTYPE html><html><head><style>body{font-family:Arial}</style></head><body><h1>Welcome to Velto!</h1><p>Hello ${name},</p><p>Please verify your email: <a href="${verificationUrl}">Verify Email</a></p><p>Or copy: ${verificationUrl}</p></body></html>`;
  }

  private getPasswordResetFallbackHtml(name: string, resetUrl: string): string {
    return `<!DOCTYPE html><html><body><h1>Password Reset</h1><p>Hello ${name},</p><p><a href="${resetUrl}">Reset Password</a></p><p>Link expires in 1 hour.</p></body></html>`;
  }

  private getWelcomeFallbackHtml(name: string, loginUrl: string): string {
    return `<!DOCTYPE html><html><body><h1>Welcome ${name}!</h1><p>Thanks for joining Velto. <a href="${loginUrl}">Start exploring</a></p></body></html>`;
  }
}