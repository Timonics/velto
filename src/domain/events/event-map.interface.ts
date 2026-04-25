/**
 * EventMap – Links event name constants to their payload types.
 *
 * @example
 * eventBus.emit({
 *   name: USER_EVENTS.REGISTERED,
 *   payload: { userId: '123', email: 'user@example.com', phone: '+234...' }
 * });
 */

import {
  USER_EVENTS,
  ORDER_EVENTS,
  BOOKING_EVENTS,
  NOTIFICATION_EVENTS,
  TENANT_EVENTS,
  POST_EVENTS,
  FOLLOW_EVENTS,
  LIKE_EVENTS,
} from './event-types';

import type {
  UserRegisteredPayload,
  UserVerifiedPayload,
  UserLoggedInPayload,
  OrderCreatedPayload,
  OrderPaidPayload,
  BookingCreatedPayload,
  EmailPayload,
  WhatsAppPayload,
  InAppNotificationPayload,
  PasswordResetRequestedPayload,
  TenantRegisteredPayload,
  PostCreatedPayload,
  PostLikedPayload,
  FollowPayload,
  LikePayload,
} from './event-payloads.interface';

export interface EventMap {
  // User events
  [USER_EVENTS.REGISTERED]: UserRegisteredPayload;
  [USER_EVENTS.VERIFIED]: UserVerifiedPayload;
  [USER_EVENTS.LOGGED_IN]: UserLoggedInPayload;
  [USER_EVENTS.PASSWORD_RESET_REQUESTED]: PasswordResetRequestedPayload;

  // Order events
  [ORDER_EVENTS.CREATED]: OrderCreatedPayload;
  [ORDER_EVENTS.PAID]: OrderPaidPayload;

  // Booking events
  [BOOKING_EVENTS.CREATED]: BookingCreatedPayload;

  // Notification events
  [NOTIFICATION_EVENTS.EMAIL]: EmailPayload;
  [NOTIFICATION_EVENTS.WHATSAPP]: WhatsAppPayload;
  [NOTIFICATION_EVENTS.IN_APP]: InAppNotificationPayload;

  //Tenant events
  [TENANT_EVENTS.REGISTERED]: TenantRegisteredPayload;

  //Post events
  [POST_EVENTS.CREATED]: PostCreatedPayload;
  [POST_EVENTS.LIKED]: PostLikedPayload;
  [POST_EVENTS.UNLIKED]: PostLikedPayload;

  //Follow events
  [FOLLOW_EVENTS.FOLLOWED]: FollowPayload;
  [FOLLOW_EVENTS.UNFOLLOWED]: FollowPayload;

  //Like events
  [LIKE_EVENTS.CREATED]: LikePayload;
  [LIKE_EVENTS.REMOVED]: LikePayload;
}

/**
 * BaseEvent – Structure of every event emitted by EventBus.
 *
 * Contains:
 * - name: The event type (from EventMap keys)
 * - payload: The event data (type-safe via EventMap)
 * - metadata: Auto‑enriched fields (timestamp, correlationId, userId, etc.)
 */
export interface BaseEvent<T extends keyof EventMap = keyof EventMap> {
  name: T;
  payload: EventMap[T];
  metadata?: {
    timestamp: Date;
    correlationId?: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    version?: number; // For future event versioning
  };
}
