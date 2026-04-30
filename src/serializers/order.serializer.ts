import { BaseSerializer } from './base.serializer';
// import { Order } from 'generated/prisma/client';

export interface OrderResponse {
  id: string;
  orderNumber: string;
  totalPrice: number;
  totalPriceFormatted: string;
  status: string;
  deliveryAddress: string;
  paymentMethod: string | null;
  quantity: number;
  createdAt: string | null;
  updatedAt: string | null;
  product: {
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

export class OrderSerializer extends BaseSerializer<any, OrderResponse> {
  serialize(order: any): OrderResponse {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      totalPrice: order.totalPrice,
      totalPriceFormatted: this.formatPrice(order.totalPrice),
      status: order.status,
      deliveryAddress: order.deliveryAddress,
      paymentMethod: order.paymentMethod,
      quantity: order.quantity,
      createdAt: this.formatDate(order.createdAt),
      updatedAt: this.formatDate(order.updatedAt),
      product: order.product ? {
        id: order.product.id,
        name: order.product.name,
        price: order.product.price,
      } : null,
      tenant: order.tenant ? {
        id: order.tenant.id,
        businessName: order.tenant.businessName,
        slug: order.tenant.slug,
      } : null,
    };
  }
}