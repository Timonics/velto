import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { BaseServiceImpl } from '../../common/services/base.service.impl';
import { IBookingService } from './booking.service.interface';
import { IBookingRepository } from './booking.repository.interface';
import { IServiceRepository } from '../service/repository/service.repository.interface';
import { Booking, Prisma } from 'generated/prisma/client';
import { CreateBookingDto, UpdateBookingStatusDto } from './dto';
import { EventBus } from '../../domain/events/event-bus.service';
import { BOOKING_EVENTS } from '../../domain/events/event-types';
import { LoggerService } from '../../common/logger/logger.service';
import { ILogger } from '../../common/logger/logger.interface';

@Injectable()
export class BookingServiceImpl
  extends BaseServiceImpl<
    Booking,
    CreateBookingDto,
    UpdateBookingStatusDto,
    Prisma.BookingCreateInput,
    Prisma.BookingUpdateInput
  >
  implements IBookingService
{
  protected readonly logger: ILogger;
  protected readonly entityName = 'Booking';

  constructor(
    protected readonly repository: IBookingRepository,
    private readonly serviceRepository: IServiceRepository,
    private readonly eventBus: EventBus,
    logger: LoggerService,
  ) {
    super(repository);
    this.logger = logger.child('BookingService');
  }

  protected mapToCreateInput(
    dto: CreateBookingDto & { customerId: string; tenantId: string },
  ): Prisma.BookingCreateInput {
    return {
      bookingNumber: this.generateBookingNumber(),
      scheduledDate: new Date(dto.scheduledDate),
      specialRequests: dto.specialRequests,
      status: 'PENDING',
      totalPrice: 0, // will be set after fetching service price
      paymentMethod: dto.paymentMethod,
      service: { connect: { id: dto.serviceId } },
      customer: { connect: { id: dto.customerId } },
      tenant: { connect: { id: dto.tenantId } },
    };
  }

  protected mapToUpdateInput(
    dto: UpdateBookingStatusDto,
  ): Prisma.BookingUpdateInput {
    return { status: dto.status };
  }

  private generateBookingNumber(): string {
    return `BKG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  async createBooking(
    data: CreateBookingDto & { customerId: string; tenantId: string },
  ): Promise<Booking> {
    const service = await this.serviceRepository.findById(data.serviceId);
    if (!service) throw new NotFoundException('Service not found');

    const totalPrice = service.price;
    const input: Prisma.BookingCreateInput = {
      bookingNumber: this.generateBookingNumber(),
      scheduledDate: new Date(data.scheduledDate),
      specialRequests: data.specialRequests,
      status: 'PENDING',
      totalPrice,
      paymentMethod: data.paymentMethod,
      service: { connect: { id: data.serviceId } },
      customer: { connect: { id: data.customerId } },
      tenant: { connect: { id: data.tenantId } },
    };
    const booking = await this.repository.create(input);

    await this.eventBus.emit({
      name: BOOKING_EVENTS.CREATED,
      payload: {
        bookingId: booking.id,
        // bookingNumber: booking.bookingNumber,
        tenantId: booking.tenantId,
        serviceId: booking.serviceId,
        customerId: booking.customerId,
        scheduledDate: booking.scheduledDate,
        // totalPrice: booking.totalPrice,
        customerPhone: "",
      },
    });

    this.logger.info(`Booking created: ${booking.bookingNumber}`);
    return booking;
  }

  async updateBookingStatus(
    bookingId: string,
    status: string,
  ): Promise<Booking> {
    const booking = await this.update(bookingId, {
      status,
    } as UpdateBookingStatusDto);
    // await this.eventBus.emit({
    //   name: BOOKING_EVENTS.UPDATED,
    //   payload: {
    //     bookingId: booking.id,
    //     bookingNumber: booking.bookingNumber,
    //     status,
    //   },
    // });
    return booking;
  }

  async getCustomerBookings(
    customerId: string,
    skip = 0,
    take = 20,
  ): Promise<Booking[]> {
    return this.repository.findByCustomerId(customerId, skip, take);
  }

  async getTenantBookings(
    tenantId: string,
    skip = 0,
    take = 20,
  ): Promise<Booking[]> {
    return this.repository.findByTenantId(tenantId, skip, take);
  }
}
