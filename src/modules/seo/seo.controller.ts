import { Controller, Get, Param, Query, Res, HttpStatus, Redirect } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { SeoService } from './seo.service';
import { createSuccessResponse, ApiResponse } from '../../common/dto/api-response.dto';

interface ShareLinkResponse {
  url: string;
  utm: Record<string, string>;
}

@Controller('seo')
@Public()
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  // HTML page for storefront OG tags (crawlers)
  @Get('storefront/:slug')
  async getStorefrontMeta(
    @Param('slug') slug: string,
    @Query() query: Record<string, string>,
    @Res() res: Response,
  ) {
    try {
      const meta = await this.seoService.getStorefrontMeta(slug, query);
      const html = this.buildMetaHtml(meta);
      res.setHeader('Content-Type', 'text/html');
      res.status(HttpStatus.OK).send(html);
    } catch (error) {
      res.status(HttpStatus.NOT_FOUND).send('Storefront not found');
    }
  }

  // HTML page for product OG tags (crawlers)
  @Get('product/:id')
  async getProductMeta(
    @Param('id') id: string,
    @Query() query: Record<string, string>,
    @Res() res: Response,
  ) {
    try {
      const meta = await this.seoService.getProductMeta(id, query);
      const html = this.buildMetaHtml(meta);
      res.setHeader('Content-Type', 'text/html');
      res.status(HttpStatus.OK).send(html);
    } catch (error) {
      res.status(HttpStatus.NOT_FOUND).send('Product not found');
    }
  }

  // Generate shareable link with UTM parameters (JSON response)
  @Get('share/storefront/:slug')
  async getStorefrontShareLink(
    @Param('slug') slug: string,
    @Query() utm: Record<string, string>,
  ): Promise<ApiResponse<ShareLinkResponse>> {
    const baseUrl = `https://${slug}.${process.env.APP_DOMAIN}`;
    const url = this.seoService.generateShareLink(baseUrl, utm);
    return createSuccessResponse({ url, utm });
  }

  @Get('share/product/:id')
  async getProductShareLink(
    @Param('id') id: string,
    @Query() utm: Record<string, string>,
  ): Promise<ApiResponse<ShareLinkResponse>> {
    // We need tenant slug to build product URL; we can fetch product and tenant
    const product = await this.seoService['productRepository'].findById(id, { tenant: true });
    if (!product) throw new Error('Product not found');
    const tenant = (product as any).tenant;
    if (!tenant) throw new Error('Tenant not found');
    const baseUrl = `https://${tenant.slug}.${process.env.APP_DOMAIN}/products/${id}`;
    const url = this.seoService.generateShareLink(baseUrl, utm);
    return createSuccessResponse({ url, utm });
  }

  // Pre-filled WhatsApp message redirect
  @Get('share/whatsapp')
  @Redirect()
  redirectWhatsApp(@Query('text') text?: string) {
    let message = text || 'Check this out on Velto!';
    message = encodeURIComponent(message);
    const url = `https://wa.me/?text=${message}`;
    return { url, statusCode: HttpStatus.MOVED_PERMANENTLY };
  }

  private buildMetaHtml(meta: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta property="og:title" content="${this.escapeHtml(meta.title)}" />
        <meta property="og:description" content="${this.escapeHtml(meta.description)}" />
        <meta property="og:image" content="${this.escapeHtml(meta.image)}" />
        <meta property="og:url" content="${this.escapeHtml(meta.url)}" />
        <meta property="og:type" content="${meta.type}" />
        <meta property="og:site_name" content="Velto" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${this.escapeHtml(meta.title)}" />
        <meta name="twitter:description" content="${this.escapeHtml(meta.description)}" />
        <meta name="twitter:image" content="${this.escapeHtml(meta.image)}" />
        <title>${this.escapeHtml(meta.title)}</title>
        <meta http-equiv="refresh" content="0;url=${this.escapeHtml(meta.url)}" />
      </head>
      <body>
        <script>window.location.href = "${this.escapeHtml(meta.url)}";</script>
      </body>
      </html>
    `;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}