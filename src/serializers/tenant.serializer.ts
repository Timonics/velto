import { BaseSerializer, SerializerOptions } from './base.serializer';
import { Tenant } from 'generated/prisma/client';

export interface TenantResponse {
  id: string;
  businessName: string;
  slug: string;
  businessType: string;
  category: string;
  description: string | null;
  location: string | null;
  lga: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  contactPhone: string | null;
  fullAddress: string | null;
  storefrontUrl: string;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export class TenantSerializer extends BaseSerializer<Tenant, TenantResponse> {
  serialize(tenant: Tenant, options?: SerializerOptions): TenantResponse {
    const fullAddress =
      [tenant.location, tenant.lga].filter(Boolean).join(', ') || null;

    return {
      id: tenant.id,
      businessName: tenant.businessName,
      slug: tenant.slug,
      businessType: tenant.businessType,
      category: tenant.category,
      description: tenant.description,
      location: tenant.location,
      lga: tenant.lga,
      logoUrl: this.sanitizeUrl(tenant.logoUrl),
      bannerUrl: this.sanitizeUrl(tenant.bannerUrl),
      contactPhone: tenant.contactPhone,
      fullAddress,
      storefrontUrl: `https://${tenant.slug}.${process.env.APP_DOMAIN}`,
      isActive: tenant.isActive,
      createdAt: options?.includeTimestamps
        ? this.formatDate(tenant.createdAt)
        : null,
      updatedAt: options?.includeTimestamps
        ? this.formatDate(tenant.updatedAt)
        : null,
    };
  }
}
