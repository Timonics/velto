import { Tenant } from 'generated/prisma/client';
import { BaseSerializer, SerializerOptions } from './base.serializer';

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
  // Branding fields
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  fontFamily: string | null;
  socialLinks: Record<string, string> | null;
  heroTitle: string | null;
  heroSubtitle: string | null;
  footerText: string | null;
  // Verification
  isVerified: boolean;
  verifiedAt: string | null;
}

// In serialize method, add all new fields:
export class TenantSerializer extends BaseSerializer<Tenant, TenantResponse> {
  private readonly appDomain: string;

  constructor(appDomain: string) {
    super();
    this.appDomain = appDomain;
  }
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
      storefrontUrl: `https://${tenant.slug}.${this.appDomain}`,
      isActive: tenant.isActive,
      createdAt: options?.includeTimestamps
        ? this.formatDate(tenant.createdAt)
        : null,
      updatedAt: options?.includeTimestamps
        ? this.formatDate(tenant.updatedAt)
        : null,
      // Branding
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      accentColor: tenant.accentColor,
      fontFamily: tenant.fontFamily,
      socialLinks: tenant.socialLinks as Record<string, string> | null,
      heroTitle: tenant.heroTitle,
      heroSubtitle: tenant.heroSubtitle,
      footerText: tenant.footerText,
      // Verification
      isVerified: tenant.isVerified,
      verifiedAt: this.formatDate(tenant.verifiedAt),
    };
  }
}
