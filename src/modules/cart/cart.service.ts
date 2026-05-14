import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { RedisService } from '../../infrastructure/cache/redis.service';
import { AddToCartDto, CheckoutDto, UpdateCartItemDto } from './dto';
import { IProductRepository } from '../product/repository/product.repository.interface';
import { LoggerService } from '../../common/logger/logger.service';
import { ILogger } from '../../common/logger/logger.interface';
import { Order } from 'generated/prisma/client';
import { IOrderRepository } from '../order/repository/order.repository.interface';
import { OrderServiceImpl } from '../order/service/order.service.impl';

export interface CartItem {
  productId: string;
  quantity: number;
  name?: string;
  price?: number;
  image?: string;
  stock?: number;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  updatedAt: string;
}

@Injectable()
export class CartService {
  private readonly logger: ILogger;
  private readonly CART_PREFIX = 'cart:';
  private readonly CART_TTL = 7 * 24 * 60 * 60; // 7 days

  constructor(
    private readonly redisService: RedisService,
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    private readonly orderService: OrderServiceImpl,
    private readonly loggerService: LoggerService,
  ) {
    this.logger = this.loggerService.child('CartService');
  }

  private getCartKey(userId: string): string {
    return `${this.CART_PREFIX}${userId}`;
  }

  async getCart(userId: string): Promise<Cart | null> {
    const key = this.getCartKey(userId);
    const cart = await this.redisService.getJSON<Cart>(key);
    if (!cart) return null;

    // Enrich with fresh product data
    if (cart.items.length > 0) {
      const productIds = cart.items.map((item) => item.productId);
      const products = await this.productRepository.findMany({
        where: { id: { in: productIds } },
      });
      cart.items = cart.items.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return item;
        return {
          ...item,
          name: product.name,
          price: product.price,
          image: product.mediaUrls?.[0] ?? undefined,
          stock: product.stock,
        };
      });
    }
    return cart;
  }

  async addToCart(userId: string, dto: AddToCartDto): Promise<Cart> {
    const key = this.getCartKey(userId);
    let cart = await this.getCart(userId);

    if (!cart) {
      cart = { userId, items: [], updatedAt: new Date().toISOString() };
    }

    const existingIndex = cart.items.findIndex(
      (item) => item.productId === dto.productId,
    );
    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += dto.quantity;
    } else {
      cart.items.push({ productId: dto.productId, quantity: dto.quantity });
    }

    cart.updatedAt = new Date().toISOString();
    await this.redisService.setJSON(key, cart, this.CART_TTL);

    this.logger.info(
      `Added to cart: user ${userId}, product ${dto.productId}, qty ${dto.quantity}`,
    );
    return cart;
  }

  async updateCartItem(
    userId: string,
    productId: string,
    dto: UpdateCartItemDto,
  ): Promise<Cart> {
    const cart = await this.getCart(userId);
    if (!cart) throw new NotFoundException('Cart not found');

    const itemIndex = cart.items.findIndex(
      (item) => item.productId === productId,
    );
    if (itemIndex === -1) throw new NotFoundException('Item not found in cart');

    if (dto.quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = dto.quantity;
    }

    cart.updatedAt = new Date().toISOString();
    await this.redisService.setJSON(
      this.getCartKey(userId),
      cart,
      this.CART_TTL,
    );

    return cart;
  }

  async removeCartItem(userId: string, productId: string): Promise<Cart> {
    const cart = await this.getCart(userId);
    if (!cart) throw new NotFoundException('Cart not found');

    const initialLength = cart.items.length;
    cart.items = cart.items.filter((item) => item.productId !== productId);
    if (cart.items.length === initialLength)
      throw new NotFoundException('Item not found');

    cart.updatedAt = new Date().toISOString();
    await this.redisService.setJSON(
      this.getCartKey(userId),
      cart,
      this.CART_TTL,
    );

    return cart;
  }

  async clearCart(userId: string): Promise<void> {
    const key = this.getCartKey(userId);
    await this.redisService.del(key);
    this.logger.info(`Cleared cart: user ${userId}`);
  }

  async getCartSummary(
    userId: string,
  ): Promise<{ totalItems: number; subtotal: number }> {
    const cart = await this.getCart(userId);
    if (!cart) return { totalItems: 0, subtotal: 0 };

    let totalItems = 0;
    let subtotal = 0;
    for (const item of cart.items) {
      totalItems += item.quantity;
      if (item.price) subtotal += item.price * item.quantity;
    }
    return { totalItems, subtotal };
  }

  async checkout(userId: string, dto: CheckoutDto): Promise<Order> {
    // 1. Fetch cart
    const cart = await this.getCart(userId);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // 2. Build order items from cart
    const orderItems = cart.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    // 3. Create order using OrderService
    const order = await this.orderService.createOrder({
      items: orderItems,
      deliveryAddress: dto.deliveryAddress,
      paymentMethod: dto.paymentMethod,
      deliveryFee: dto.deliveryFee,
      source: dto.source,
      customerId: userId,
    });

    // 4. Clear cart after successful order creation
    await this.clearCart(userId);

    this.logger.info(
      `Checkout completed for user ${userId}, order ${order.id}`,
    );
    return order;
  }
}
