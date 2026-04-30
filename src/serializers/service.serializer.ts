import { BaseSerializer } from './base.serializer';
import { Service } from 'generated/prisma/client';

export interface ServiceResponse {
  id: string;
  name: string;
  description: string | null;
  price: number;
  priceFormatted: string;
  negotiable: boolean;
  duration: string | null;
  mediaUrls: string[];
  isAvailable: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export class ServiceSerializer extends BaseSerializer<Service, ServiceResponse> {
  serialize(service: Service): ServiceResponse {
    return {
      id: service.id,
      name: service.name,
      description: service.description,
      price: service.price,
      priceFormatted: this.formatPrice(service.price),
      negotiable: service.negotiable,
      duration: service.duration,
      mediaUrls: service.mediaUrls.map(url => this.sanitizeUrl(url) as string),
      isAvailable: service.isAvailable,
      createdAt: this.formatDate(service.createdAt),
      updatedAt: this.formatDate(service.updatedAt),
    };
  }
}