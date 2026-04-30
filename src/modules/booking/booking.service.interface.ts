import { IBaseService } from '../../common/services/base.service.interface';
import { Booking } from 'generated/prisma/client';
import { CreateBookingDto, UpdateBookingStatusDto } from './dto';

export interface IBookingService extends IBaseService<
  Booking,
  CreateBookingDto,
  UpdateBookingStatusDto
> {
  createBooking(
    data: CreateBookingDto & { customerId: string; tenantId: string },
  ): Promise<Booking>;
  updateBookingStatus(bookingId: string, status: string): Promise<Booking>;
  getCustomerBookings(
    customerId: string,
    skip?: number,
    take?: number,
  ): Promise<Booking[]>;
  getTenantBookings(
    tenantId: string,
    skip?: number,
    take?: number,
  ): Promise<Booking[]>;
}
