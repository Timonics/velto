import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { BaseRepositoryImpl } from '../../../common/repositories/base.repository.impl';
import { IServiceRepository } from './service.repository.interface';
import { Service, Prisma } from 'generated/prisma/client';

@Injectable()
export class ServiceRepositoryImpl
  extends BaseRepositoryImpl<Prisma.ServiceDelegate, Service, Prisma.ServiceCreateInput, Prisma.ServiceUpdateInput>
  implements IServiceRepository
{
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, prisma.service);
  }

  async findByTenantId(tenantId: string, skip = 0, take = 20): Promise<Service[]> {
    return this.modelDelegate.findMany({
      where: { tenantId, isAvailable: true },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }
}