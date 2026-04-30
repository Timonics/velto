import { IsEnum, IsNotEmpty } from 'class-validator';
import { BookingStatus } from 'generated/prisma/client';

export class UpdateBookingStatusDto {
  @IsEnum(BookingStatus)
  @IsNotEmpty()
  status!: BookingStatus;
}