import { BaseSerializer } from './base.serializer';
import { Cart } from '../modules/cart/cart.service';

export interface CartItemResponse {
  productId: string;
  quantity: number;
  name?: string;
  price?: number;
  priceFormatted?: string;
  image?: string;
  stock?: number;
  totalPrice: number;
  totalPriceFormatted: string;
}

export interface CartResponse {
  userId: string;
  items: CartItemResponse[];
  totalItems: number;
  subtotal: number;
  subtotalFormatted: string;
  updatedAt: string;
}

export interface CartSummaryResponse {
  totalItems: number;
  subtotal: number;
  subtotalFormatted: string;
}

export class CartSerializer extends BaseSerializer<Cart | null, CartResponse> {
  serialize(cart: Cart | null): CartResponse {
    let totalItems = 0;
    let subtotal = 0;

    const items: CartItemResponse[] = (cart?.items || []).map((item) => {
      const itemTotal = (item.price || 0) * item.quantity;
      totalItems += item.quantity;
      subtotal += itemTotal;

      return {
        productId: item.productId,
        quantity: item.quantity,
        name: item.name,
        price: item.price,
        priceFormatted: item.price ? this.formatPrice(item.price) : undefined,
        image: item.image,
        stock: item.stock,
        totalPrice: itemTotal,
        totalPriceFormatted: this.formatPrice(itemTotal),
      };
    });

    return {
      userId: cart?.userId || '',
      items,
      totalItems,
      subtotal,
      subtotalFormatted: this.formatPrice(subtotal),
      updatedAt: cart?.updatedAt || new Date().toISOString(),
    };
  }

  serializeSummary(totalItems: number, subtotal: number): CartSummaryResponse {
    return {
      totalItems,
      subtotal,
      subtotalFormatted: this.formatPrice(subtotal),
    };
  }
}
