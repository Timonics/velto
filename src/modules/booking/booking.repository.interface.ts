import { IBaseRepository } from '../../common/repositories/base.repository.interface';
import { Booking, Prisma } from 'generated/prisma/client';

export interface IBookingRepository extends IBaseRepository<
  Booking,
  Prisma.BookingCreateInput,
  Prisma.BookingUpdateInput
> {
  findByCustomerId(
    customerId: string,
    skip?: number,
    take?: number,
  ): Promise<Booking[]>;
  findByTenantId(
    tenantId: string,
    skip?: number,
    take?: number,
  ): Promise<Booking[]>;
}
