import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { BaseRepositoryImpl } from '../../common/repositories/base.repository.impl';
import { IPortfolioRepository } from './portfolio.repository.interface';
import { PortfolioItem, Prisma } from 'generated/prisma/client';

@Injectable()
export class PortfolioRepositoryImpl
  extends BaseRepositoryImpl<Prisma.PortfolioItemDelegate, PortfolioItem, Prisma.PortfolioItemCreateInput, Prisma.PortfolioItemUpdateInput>
  implements IPortfolioRepository
{
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, prisma.portfolioItem);
  }

  async findByTenantId(tenantId: string, skip = 0, take = 20): Promise<PortfolioItem[]> {
    return this.modelDelegate.findMany({
      where: { tenantId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }
}