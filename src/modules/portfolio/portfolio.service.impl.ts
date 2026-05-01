import { Injectable, Inject } from '@nestjs/common';
import { BaseServiceImpl } from '../../common/services/base.service.impl';
import { IPortfolioService } from './portfolio.service.interface';
import { IPortfolioRepository } from './portfolio.repository.interface';
import { PortfolioItem, Prisma } from 'generated/prisma/client';
import { CreatePortfolioItemDto, UpdatePortfolioItemDto } from './dto';
import { LoggerService } from '../../common/logger/logger.service';
import { ILogger } from '../../common/logger/logger.interface';

@Injectable()
export class PortfolioServiceImpl
  extends BaseServiceImpl<PortfolioItem, CreatePortfolioItemDto, UpdatePortfolioItemDto, Prisma.PortfolioItemCreateInput, Prisma.PortfolioItemUpdateInput>
  implements IPortfolioService
{
  protected readonly logger: ILogger;
  protected readonly entityName = 'PortfolioItem';

  constructor(
    protected readonly repository: IPortfolioRepository,
    logger: LoggerService,
  ) {
    super(repository);
    this.logger = logger.child('PortfolioService');
  }

  protected mapToCreateInput(dto: CreatePortfolioItemDto & { tenantId: string }): Prisma.PortfolioItemCreateInput {
    return {
      mediaUrl: dto.mediaUrl,
      caption: dto.caption,
      tenant: { connect: { id: dto.tenantId } },
    };
  }

  async getPortfolioByTenant(tenantId: string, skip = 0, take = 20): Promise<PortfolioItem[]> {
    return this.repository.findByTenantId(tenantId, skip, take);
  }

  async create(data: CreatePortfolioItemDto & { tenantId: string }): Promise<PortfolioItem> {
    const input = this.mapToCreateInput(data);
    return this.repository.create(input);
  }
}