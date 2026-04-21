/**
 * TenantMiddleware – Resolves subdomain to tenant and attaches to request.
 *
 * How it works:
 * 1. Reads Host header (e.g., "tajkulture.velto.app" or "velto.app")
 * 2. Extracts subdomain (everything before the first dot)
 * 3. Ignores "www" and main domain
 * 4. Looks up tenant by slug in database using repository
 * 5. Attaches tenant to request.tenant for controllers/guards
 *
 * This middleware must run BEFORE AuthGuard so that tenant is available for guards like TenantOwnerGuard.
 *
 * Why use repository directly instead of service?
 * - Avoids circular dependency (service may depend on guards that depend on middleware)
 * - Middleware is infrastructure layer, allowed to use repository
 */

import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ITenantRepository } from '../../modules/tenant/repository/tenant.repository.interface';
import { EnvironmentService } from '../../config/env/env.service';
import { LoggerService } from '../logger/logger.service';
import { ILogger } from '../logger/logger.interface';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger: ILogger;

  constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly env: EnvironmentService,
    logger: LoggerService,
  ) {
    this.logger = logger.child('TenantMiddleware');
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const host = req.headers.host;
    if (!host) {
      return next();
    }

    const subdomain = this.extractSubdomain(host);

    // Skip tenant resolution for main domain or www
    if (!subdomain) {
      return next();
    }

    // Lookup tenant by slug
    const tenant = await this.tenantRepository.findBySlug(subdomain);

    if (!tenant) {
      this.logger.warn(`Tenant not found for subdomain: ${subdomain}`, { host });
      throw new NotFoundException(`No tenant found at ${host}`);
    }

    // Attach tenant to request for downstream use
    req.tenant = tenant;
    this.logger.debug(`Tenant resolved`, { slug: tenant.slug, businessName: tenant.businessName });

    next();
  }

  /**
   * Extract subdomain from host header.
   * Examples:
   * - "tajkulture.velto.app" → "tajkulture"
   * - "www.velto.app" → null
   * - "velto.app" → null
   * - "localhost:3000" → null (no subdomain in local dev)
   */
  private extractSubdomain(host: string): string | null {
    const mainDomain = this.env.get('APP_DOMAIN');
    // Remove port if present (e.g., localhost:3000)
    const hostWithoutPort = host.split(':')[0];

    // Check if host matches main domain exactly
    if (hostWithoutPort === mainDomain) {
      return null;
    }

    // Check for www subdomain
    if (hostWithoutPort === `www.${mainDomain}`) {
      return null;
    }

    // Extract subdomain (everything before the first dot)
    const parts = hostWithoutPort.split('.');
    if (parts.length > 1) {
      // Verify it's a subdomain of mainDomain
      if (hostWithoutPort.endsWith(`.${mainDomain}`)) {
        return parts[0];
      }
    }

    // For local development with lvh.me (e.g., tajkulture.lvh.me:3000)
    if (mainDomain === 'lvh.me' && hostWithoutPort.endsWith('.lvh.me')) {
      return parts[0];
    }

    return null;
  }
}