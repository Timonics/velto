import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { BaseRepositoryImpl } from '../../common/repositories/base.repository.impl';
import { IBookingRepository } from './booking.repository.interface';
import { Booking, Prisma } from 'generated/prisma/client';

@Injectable()
export class BookingRepositoryImpl
  extends BaseRepositoryImpl<
    Prisma.BookingDelegate,
    Booking,
    Prisma.BookingCreateInput,
    Prisma.BookingUpdateInput
  >
  implements IBookingRepository
{
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, prisma.booking);
  }

  async findByCustomerId(
    customerId: string,
    skip = 0,
    take = 20,
  ): Promise<Booking[]> {
    return this.modelDelegate.findMany({
      where: { customerId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { service: true, tenant: true },
    });
  }

  async findByTenantId(
    tenantId: string,
    skip = 0,
    take = 20,
  ): Promise<Booking[]> {
    return this.modelDelegate.findMany({
      where: { tenantId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { service: true },
    });
  }
}
