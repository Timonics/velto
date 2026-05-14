import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto, CheckoutDto, UpdateCartItemDto } from './dto';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';
import {
  createSuccessResponse,
  ApiResponse,
} from '../../common/dto/api-response.dto';
import {
  CartSerializer,
  CartResponse,
  CartSummaryResponse,
} from '../../serializers/cart.serializer';
import {
  OrderResponse,
  OrderSerializer,
} from 'src/serializers/order.serializer';

@Controller('cart')
export class CartController {
  private readonly serializer = new CartSerializer();
  private readonly orderSerializer = new OrderSerializer();

  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ApiResponse<CartResponse>> {
    const cart = await this.cartService.getCart(user.id);
    return createSuccessResponse(this.serializer.serialize(cart));
  }

  @Get('summary')
  async getCartSummary(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ApiResponse<CartSummaryResponse>> {
    const { totalItems, subtotal } = await this.cartService.getCartSummary(
      user.id,
    );
    return createSuccessResponse(
      this.serializer.serializeSummary(totalItems, subtotal),
    );
  }

  @Post('items')
  @HttpCode(HttpStatus.OK)
  async addToCart(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: AddToCartDto,
  ): Promise<ApiResponse<CartResponse>> {
    const cart = await this.cartService.addToCart(user.id, dto);
    return createSuccessResponse(this.serializer.serialize(cart));
  }

  @Patch('items/:productId')
  async updateCartItem(
    @CurrentUser() user: CurrentUserPayload,
    @Param('productId') productId: string,
    @Body() dto: UpdateCartItemDto,
  ): Promise<ApiResponse<CartResponse>> {
    const cart = await this.cartService.updateCartItem(user.id, productId, dto);
    return createSuccessResponse(this.serializer.serialize(cart));
  }

  @Delete('items/:productId')
  async removeCartItem(
    @CurrentUser() user: CurrentUserPayload,
    @Param('productId') productId: string,
  ): Promise<ApiResponse<CartResponse>> {
    const cart = await this.cartService.removeCartItem(user.id, productId);
    return createSuccessResponse(this.serializer.serialize(cart));
  }

  @Delete()
  async clearCart(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ApiResponse<null>> {
    await this.cartService.clearCart(user.id);
    return createSuccessResponse(null, 'Cart cleared successfully');
  }

  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  async checkout(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CheckoutDto,
  ): Promise<ApiResponse<OrderResponse>> {
    const order = await this.cartService.checkout(user.id, dto);
    return createSuccessResponse(this.orderSerializer.serialize(order));
  }
}
