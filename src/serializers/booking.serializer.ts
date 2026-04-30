import { BaseSerializer } from './base.serializer';
import { Booking } from 'generated/prisma/client';

export interface BookingResponse {
  id: string;
  bookingNumber: string;
  scheduledDate: string;
  totalPrice: number;
  totalPriceFormatted: string;
  status: string;
  specialRequests: string | null;
  paymentMethod: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  service: {
    id: string;
    name: string;
    price: number;
  } | null;
  tenant: {
    id: string;
    businessName: string;
    slug: string;
  } | null;
}

export class BookingSerializer extends BaseSerializer<any, BookingResponse> {
  serialize(booking: any): BookingResponse {
    return {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      scheduledDate: booking.scheduledDate.toISOString(),
      totalPrice: booking.totalPrice,
      totalPriceFormatted: this.formatPrice(booking.totalPrice),
      status: booking.status,
      specialRequests: booking.specialRequests,
      paymentMethod: booking.paymentMethod,
      createdAt: this.formatDate(booking.createdAt),
      updatedAt: this.formatDate(booking.updatedAt),
      service: booking.service
        ? {
            id: booking.service.id,
            name: booking.service.name,
            price: booking.service.price,
          }
        : null,
      tenant: booking.tenant
        ? {
            id: booking.tenant.id,
            businessName: booking.tenant.businessName,
            slug: booking.tenant.slug,
          }
        : null,
    };
  }
}
