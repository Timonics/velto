/**
 * Event Types – Constants for all domain events.
 * 
 * WHY CONSTANTS?
 * - Avoid string typos (autocompletion + type safety)
 * - Single source of truth for event names
 * - Easy to refactor
 * 
 * Format: category.action (e.g., user.registered, order.placed)
 */

export const USER_EVENTS = {
  // Lifecycle
  REGISTERED: 'user.registered',
  VERIFIED: 'user.verified',
  LOGGED_IN: 'user.logged_in',
  LOGGED_OUT: 'user.logged_out',
  DELETED: 'user.deleted',

  // Profile
  PROFILE_UPDATED: 'user.profile_updated',
  ROLE_CHANGED: 'user.role_changed',

  // Password
  PASSWORD_RESET_REQUESTED: 'user.password_reset_requested',
  PASSWORD_CHANGED: 'user.password_changed',
} as const;

export const ORDER_EVENTS = {
  CREATED: 'order.created',
  PAID: 'order.paid',
  SHIPPED: 'order.shipped',
  DELIVERED: 'order.delivered',
  CANCELLED: 'order.cancelled',
  REFUNDED: 'order.refunded',
} as const;

export const BOOKING_EVENTS = {
  CREATED: 'booking.created',
  CONFIRMED: 'booking.confirmed',
  COMPLETED: 'booking.completed',
  CANCELLED: 'booking.cancelled',
  NO_SHOW: 'booking.no_show',
} as const;

export const NOTIFICATION_EVENTS = {
  EMAIL: 'notification.email',
  WHATSAPP: 'notification.whatsapp',
  IN_APP: 'notification.in_app',
} as const;

export const TENANT_EVENTS = {
  REGISTERED: 'tenant.registered',
  UPDATED: 'tenant.updated',
  DELETED: 'tenant.deleted',
} as const;