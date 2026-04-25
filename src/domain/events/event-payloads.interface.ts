/**
 * Event Payload Interfaces – Type definitions for data attached to each event.
 *
 * WHY SEPARATE INTERFACES?
 * - Each event carries exactly the data its handlers need
 * - No extra fields, no guessing
 * - TypeScript validates payload shape when emitting
 */

// ========== User Events ==========
export interface UserRegisteredPayload {
  userId: string;
  email: string;
  phone: string;
  name?: string;
  verificationToken: string;
}

export interface UserVerifiedPayload {
  userId: string;
  verifiedAt: Date;
}

export interface UserLoggedInPayload {
  userId: string;
  loginMethod: 'email' | 'phone';
  ipAddress?: string;
}

export interface PasswordResetRequestedPayload {
  userId: string;
  email: string;
  name?: string;
  resetToken: string;
}

// ========== Order Events ==========
export interface OrderCreatedPayload {
  orderId: string;
  tenantId: string;
  customerId: string;
  totalPrice: number;
  customerName?: string;
  customerPhone: string;
  customerEmail?: string;
  items: Array<{ productId: string; quantity: number; price: number }>;
}

export interface OrderPaidPayload {
  orderId: string;
  paymentMethod: string;
  transactionId: string;
}

// ========== Booking Events ==========
export interface BookingCreatedPayload {
  bookingId: string;
  tenantId: string;
  customerId: string;
  serviceId: string;
  scheduledDate: Date;
  customerPhone: string;
  customerEmail?: string;
}

// ========== Notification Events ==========
export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface WhatsAppPayload {
  to: string;
  message: string;
}

export interface InAppNotificationPayload {
  userId: string;
  title: string;
  message: string;
  data?: any;
}

// ========== Tenant Events ==========
export interface TenantRegisteredPayload {
  tenantId: string;
  businessName: string;
  slug: string;
  userId: string;
}

// ========== Post Events ==========
export interface PostCreatedPayload {
  postId: string;
  tenantId: string;
  mediaUrl: string;
}

export interface PostLikedPayload {
  postId: string;
  userId: string;
  tenantId: string;
}

// ========== Follow Events ==========
export interface FollowPayload {
  followerId: string;
  tenantId: string;
}

// ========== Comment Events ==========
export interface CommentCreatedPayload {
  commentId: string;
  postId: string;
  userId: string;
  tenantId: string;
}

// ========== Like Events ==========
export interface LikePayload {
  postId: string;
  userId: string;
}