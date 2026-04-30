import { IBaseService } from '../../../common/services/base.service.interface';
import { Service } from 'generated/prisma/client';
import { CreateServiceDto, UpdateServiceDto } from '../dto';

export interface IServiceService extends IBaseService<
  Service,
  CreateServiceDto,
  UpdateServiceDto
> {
  getServicesByTenant(
    tenantId: string,
    skip?: number,
    take?: number,
  ): Promise<Service[]>;
}
