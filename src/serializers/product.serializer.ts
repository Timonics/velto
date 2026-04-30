import { BaseSerializer } from './base.serializer';
import { Product } from 'generated/prisma/client';

export interface ProductResponse {
  id: string;
  name: string;
  description: string | null;
  price: number;
  priceFormatted: string;
  stock: number;
  mediaUrls: string[];
  category: string;
  isAvailable: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export class ProductSerializer extends BaseSerializer<
  Product,
  ProductResponse
> {
  serialize(product: Product): ProductResponse {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      priceFormatted: this.formatPrice(product.price),
      stock: product.stock,
      mediaUrls: product.mediaUrls.map(
        (url) => this.sanitizeUrl(url) as string,
      ),
      category: product.category,
      isAvailable: product.isAvailable,
      createdAt: this.formatDate(product.createdAt),
      updatedAt: this.formatDate(product.updatedAt),
    };
  }
}
