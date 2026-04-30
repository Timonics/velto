import { Injectable, Inject } from '@nestjs/common';
import { BaseServiceImpl } from '../../../common/services/base.service.impl';
import { IServiceService } from './service.service.interface';
import { IServiceRepository } from '../repository/service.repository.interface';
import { Service, Prisma } from 'generated/prisma/client';
import { CreateServiceDto, UpdateServiceDto } from '../dto';
import { LoggerService } from '../../../common/logger/logger.service';
import { ILogger } from '../../../common/logger/logger.interface';

@Injectable()
export class ServiceServiceImpl
  extends BaseServiceImpl<
    Service,
    CreateServiceDto,
    UpdateServiceDto,
    Prisma.ServiceCreateInput,
    Prisma.ServiceUpdateInput
  >
  implements IServiceService
{
  protected readonly logger: ILogger;
  protected readonly entityName = 'Service';

  constructor(
    protected readonly repository: IServiceRepository,
    logger: LoggerService,
  ) {
    super(repository);
    this.logger = logger.child('ServiceService');
  }

  protected mapToCreateInput(
    dto: CreateServiceDto & { tenantId: string },
  ): Prisma.ServiceCreateInput {
    return {
      name: dto.name,
      description: dto.description,
      price: dto.price,
      negotiable: dto.negotiable ?? false,
      duration: dto.duration,
      mediaUrls: dto.mediaUrls || [],
      isAvailable: true,
      tenant: { connect: { id: dto.tenantId } },
    };
  }

  async getServicesByTenant(
    tenantId: string,
    skip = 0,
    take = 20,
  ): Promise<Service[]> {
    return this.repository.findByTenantId(tenantId, skip, take);
  }

  async create(
    data: CreateServiceDto & { tenantId: string },
  ): Promise<Service> {
    const input = this.mapToCreateInput(data);
    return this.repository.create(input);
  }
}
