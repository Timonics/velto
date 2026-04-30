import { IBaseRepository } from '../../../common/repositories/base.repository.interface';
import { Service, Prisma } from 'generated/prisma/client';

export interface IServiceRepository extends IBaseRepository<
  Service,
  Prisma.ServiceCreateInput,
  Prisma.ServiceUpdateInput
> {
  findByTenantId(
    tenantId: string,
    skip?: number,
    take?: number,
  ): Promise<Service[]>;
}
