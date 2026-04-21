import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { BaseRepositoryImpl } from '../../../common/repositories/base.repository.impl';
import { ITenantRepository } from './tenant.repository.interface';
import { Tenant, Prisma, BusinessType, Category } from 'generated/prisma/client';

@Injectable()
export class TenantRepositoryImpl
  extends BaseRepositoryImpl<
    Prisma.TenantDelegate,
    Tenant,
    Prisma.TenantCreateInput,
    Prisma.TenantUpdateInput
  >
  implements ITenantRepository
{
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, prisma.tenant);
  }

  async findBySlug(
    slug: string,
    includeInactive = false,
  ): Promise<Tenant | null> {
    return this.modelDelegate.findFirst({
      where: {
        slug,
        ...(includeInactive ? {} : { isActive: true }),
      },
    });
  }

  async findByBusinessType(
    businessType: BusinessType,
    skip = 0,
    take = 20,
  ): Promise<Tenant[]> {
    return this.modelDelegate.findMany({
      where: { businessType, isActive: true },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async searchTenants(
    searchTerm: string,
    skip = 0,
    take = 20,
  ): Promise<Tenant[]> {
    return this.modelDelegate.findMany({
      where: {
        isActive: true,
        OR: [
          { businessName: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { location: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      skip,
      take,
    });
  }

  async getStorefront(slug: string): Promise<Tenant | null> {
    return this.modelDelegate.findFirst({
      where: { slug, isActive: true },
      include: {
        products: {
          where: { isAvailable: true },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        services: {
          where: { isAvailable: true },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        portfolio: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
  }

  async findByCategory(
    category: Category,
    skip = 0,
    take = 20,
  ): Promise<Tenant[]> {
    return this.modelDelegate.findMany({
      where: { category, isActive: true },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }
}
