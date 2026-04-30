import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Inject } from '@nestjs/common';
import { IBookingService } from './booking.service.interface';
import { CreateBookingDto, UpdateBookingStatusDto } from './dto';
import { BookingSerializer, BookingResponse } from '../../serializers/booking.serializer';
import { AuthGuard } from '../../common/guards/auth.guard';
import { TenantOwnerGuard } from '../../common/guards/tenant-owner.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { createSuccessResponse, ApiResponse } from '../../common/dto/api-response.dto';
import { Tenant } from 'generated/prisma/client';
import { BookingServiceImpl } from './booking.service.impl';

@Controller('bookings')
export class BookingController {
  private readonly serializer = new BookingSerializer();

  constructor(private readonly bookingService: BookingServiceImpl) {}

  @Post()
  async create(
    @Body() dto: CreateBookingDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ApiResponse<BookingResponse>> {
    // Assumes DTO includes tenantId (from frontend). If not, resolve via serviceId's tenant.
    // For simplicity, we require tenantId in DTO.
    const booking = await this.bookingService.createBooking({
      ...dto,
      customerId: user.id,
      tenantId: dto['tenantId'],
    });
    return createSuccessResponse(this.serializer.serialize(booking));
  }

  @Get('my')
  async getMyBookings(
    @CurrentUser() user: CurrentUserPayload,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<ApiResponse<BookingResponse[]>> {
    const bookings = await this.bookingService.getCustomerBookings(
      user.id,
      skip ? parseInt(skip, 10) : 0,
      take ? parseInt(take, 10) : 20,
    );
    return createSuccessResponse(this.serializer.serializeMany(bookings));
  }

  @Get('tenant')
  @UseGuards(TenantOwnerGuard)
  async getTenantBookings(
    @CurrentTenant() tenant: Tenant,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<ApiResponse<BookingResponse[]>> {
    const bookings = await this.bookingService.getTenantBookings(
      tenant.id,
      skip ? parseInt(skip, 10) : 0,
      take ? parseInt(take, 10) : 20,
    );
    return createSuccessResponse(this.serializer.serializeMany(bookings));
  }

  @Patch(':id/status')
  @UseGuards(TenantOwnerGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
  ): Promise<ApiResponse<BookingResponse>> {
    const booking = await this.bookingService.updateBookingStatus(id, dto.status);
    return createSuccessResponse(this.serializer.serialize(booking));
  }
}