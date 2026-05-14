import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ITenantRepository } from '../tenant/repository/tenant.repository.interface';
import { IProductRepository } from '../product/repository/product.repository.interface';
import { LoggerService } from '../../common/logger/logger.service';
import { ILogger } from '../../common/logger/logger.interface';
import { EnvironmentService } from '../../config/env/env.service';

export interface MetaTags {
  title: string;
  description: string;
  image: string;
  url: string;
  type: 'website' | 'product';
}

@Injectable()
export class SeoService {
  private readonly logger: ILogger;
  private readonly appDomain: string;

  constructor(
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    private readonly env: EnvironmentService,
    logger: LoggerService,
  ) {
    this.logger = logger.child('SeoService');
    this.appDomain = this.env.get('APP_DOMAIN');
  }

  async getStorefrontMeta(
    slug: string,
    utmParams?: Record<string, string>,
  ): Promise<MetaTags> {
    const tenant = await this.tenantRepository.findBySlug(slug);
    if (!tenant) throw new NotFoundException(`Storefront ${slug} not found`);

    let url = `https://${slug}.${this.appDomain}`;
    if (utmParams && Object.keys(utmParams).length) {
      const searchParams = new URLSearchParams(utmParams).toString();
      url = `${url}?${searchParams}`;
    }

    return {
      title: `${tenant.businessName} – Velto Store`,
      description:
        tenant.description ||
        `Shop ${tenant.businessName} on Velto. Unique products and services.`,
      image: tenant.logoUrl || 'https://velto.app/default-og-image.jpg',
      url,
      type: 'website',
    };
  }

  async getProductMeta(
    productId: string,
    utmParams?: Record<string, string>,
  ): Promise<MetaTags> {
    const product = await this.productRepository.findById(productId, {
      tenant: true,
    });
    if (!product) throw new NotFoundException(`Product ${productId} not found`);

    const tenant = (product as any).tenant;
    if (!tenant) throw new NotFoundException('Tenant not found for product');

    let url = `https://${tenant.slug}.${this.appDomain}/products/${product.id}`;
    if (utmParams && Object.keys(utmParams).length) {
      const searchParams = new URLSearchParams(utmParams).toString();
      url = `${url}?${searchParams}`;
    }

    return {
      title: `${product.name} – ${tenant.businessName}`,
      description:
        product.description ||
        `Buy ${product.name} from ${tenant.businessName} on Velto.`,
      image:
        product.mediaUrls?.[0] ||
        tenant.logoUrl ||
        'https://velto.app/default-og-image.jpg',
      url,
      type: 'product',
    };
  }

  generateShareLink(
    baseUrl: string,
    utmParams: Record<string, string>,
  ): string {
    const searchParams = new URLSearchParams(utmParams).toString();
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}${searchParams}`;
  }
}
