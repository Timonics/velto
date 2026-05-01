import { Injectable, Inject } from '@nestjs/common';
import { ITenantRepository } from '../tenant/repository/tenant.repository.interface';
import { IProductRepository } from '../product/repository/product.repository.interface';
import { IServiceRepository } from '../service/repository/service.repository.interface';
import { SearchQueryDto } from './dto/search-query.dto';
import {
  IMarketplaceService,
  SearchResult,
} from './marketplace.service.interface';

@Injectable()
export class MarketplaceServiceImpl implements IMarketplaceService {
  constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly productRepository: IProductRepository,
    private readonly serviceRepository: IServiceRepository,
  ) {}

  async searchTenants(query: SearchQueryDto): Promise<SearchResult<any>> {
    const where: any = { isActive: true };
    if (query.category) where.category = query.category;
    if (query.businessType) where.businessType = query.businessType;
    if (query.location) {
      where.OR = [
        { location: { contains: query.location, mode: 'insensitive' } },
        { lga: { contains: query.location, mode: 'insensitive' } },
      ];
    }
    if (query.q) {
      where.OR = where.OR || [];
      where.OR.push(
        { businessName: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      );
    }
    const [items, total] = await Promise.all([
      this.tenantRepository.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.tenantRepository.count(where),
    ]);
    return { items, total, skip: query.skip, take: query.take };
  }

  async searchProducts(query: SearchQueryDto): Promise<SearchResult<any>> {
    const where: any = { isAvailable: true };
    if (query.category) where.category = query.category;
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await Promise.all([
      this.productRepository.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { createdAt: 'desc' },
        include: { tenant: true },
      }),
      this.productRepository.count(where),
    ]);
    return { items, total, skip: query.skip, take: query.take };
  }

  async searchServices(query: SearchQueryDto): Promise<SearchResult<any>> {
    const where: any = { isAvailable: true };
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await Promise.all([
      this.serviceRepository.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { createdAt: 'desc' },
        include: { tenant: true },
      }),
      this.serviceRepository.count(where),
    ]);
    return { items, total, skip: query.skip, take: query.take };
  }
}
