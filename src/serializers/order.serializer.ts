import { BaseSerializer, SerializerOptions } from './base.serializer';
import { Order, OrderItem } from 'generated/prisma/client';

// Extended type that includes orderItems relation
type OrderWithItems = Order & { orderItems?: OrderItem[] };

export interface OrderItemResponse {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  productPriceFormatted: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
  unitPriceFormatted: string;
  totalPrice: number;
  totalPriceFormatted: string;
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  totalAmount: number;
  totalAmountFormatted: string;
  deliveryFee: number;
  deliveryFeeFormatted: string;
  grandTotal: number;
  grandTotalFormatted: string;
  paymentStatus: string;
  paymentHoldStatus: string;
  source: string | null;
  deliveryAddress: string;
  status: string;
  paymentMethod: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  items: OrderItemResponse[];
  tenant?: {
    id: string;
    businessName: string;
    slug: string;
  } | null;
  customer?: {
    id: string;
    phone: string;
    email: string | null;
  } | null;
}

export class OrderSerializer extends BaseSerializer<OrderWithItems, OrderResponse> {
  serialize(order: OrderWithItems, options?: SerializerOptions): OrderResponse {
    // Calculate grand total (totalAmount includes deliveryFee already, but we can show separately)
    const totalAmount = order.totalAmount;
    const deliveryFee = order.deliveryFee;
    const grandTotal = totalAmount; // totalAmount already includes deliveryFee

    // Map order items
    const items: OrderItemResponse[] = (order.orderItems || []).map(item => {
      const itemTotal = item.unitPrice * item.quantity;
      return {
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productPrice: item.productPrice,
        productPriceFormatted: this.formatPrice(item.productPrice),
        productImage: this.sanitizeUrl(item.productImage),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitPriceFormatted: this.formatPrice(item.unitPrice),
        totalPrice: itemTotal,
        totalPriceFormatted: this.formatPrice(itemTotal),
      };
    });

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      totalAmount,
      totalAmountFormatted: this.formatPrice(totalAmount),
      deliveryFee,
      deliveryFeeFormatted: this.formatPrice(deliveryFee),
      grandTotal,
      grandTotalFormatted: this.formatPrice(grandTotal),
      paymentStatus: order.paymentStatus,
      paymentHoldStatus: order.paymentHoldStatus,
      source: order.source,
      deliveryAddress: order.deliveryAddress,
      status: order.status,
      paymentMethod: order.paymentMethod,
      createdAt: this.formatDate(order.createdAt),
      updatedAt: this.formatDate(order.updatedAt),
      items,
      // Optionally include tenant and customer if available (based on include in repository)
      tenant: (order as any).tenant ? {
        id: (order as any).tenant.id,
        businessName: (order as any).tenant.businessName,
        slug: (order as any).tenant.slug,
      } : null,
      customer: (order as any).customer ? {
        id: (order as any).customer.id,
        phone: (order as any).customer.phone,
        email: (order as any).customer.email,
      } : null,
    };
  }
}