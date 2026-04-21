/**
 * Error Codes – Unique identifiers for every error type in the system.
 * 
 * Format: XXX_YYY
 * - First 3 letters: module (AUTH, TEN, ORD, BKG, etc.)
 * - Next 3 digits: specific error number
 */

export enum ErrorCode {
  // ========== Generic errors (000-099) ==========
  INTERNAL_SERVER_ERROR = 'GEN_000',
  VALIDATION_FAILED = 'GEN_001',
  RESOURCE_NOT_FOUND = 'GEN_002',
  BAD_REQUEST = 'GEN_003',
  UNAUTHORIZED = 'GEN_004',
  FORBIDDEN = 'GEN_005',
  CONFLICT = 'GEN_006',
  TOO_MANY_REQUESTS = 'GEN_007',

  // ========== Authentication errors (100-199) ==========
  AUTH_INVALID_CREDENTIALS = 'AUTH_100',
  AUTH_TOKEN_EXPIRED = 'AUTH_101',
  AUTH_TOKEN_INVALID = 'AUTH_102',
  AUTH_REFRESH_TOKEN_INVALID = 'AUTH_103',
  AUTH_USER_NOT_FOUND = 'AUTH_104',
  AUTH_PHONE_ALREADY_EXISTS = 'AUTH_105',
  AUTH_EMAIL_ALREADY_EXISTS = 'AUTH_106',

  // ========== Tenant errors (200-299) ==========
  TENANT_NOT_FOUND = 'TEN_200',
  TENANT_SLUG_ALREADY_EXISTS = 'TEN_201',
  TENANT_INACTIVE = 'TEN_202',
  TENANT_ACCESS_DENIED = 'TEN_203',

  // ========== Product errors (300-399) ==========
  PRODUCT_NOT_FOUND = 'PRD_300',
  PRODUCT_OUT_OF_STOCK = 'PRD_301',
  PRODUCT_INSUFFICIENT_STOCK = 'PRD_302',

  // ========== Order errors (400-499) ==========
  ORDER_NOT_FOUND = 'ORD_400',
  ORDER_INVALID_STATUS = 'ORD_401',
  ORDER_CANNOT_CANCEL = 'ORD_402',

  // ========== Booking errors (500-599) ==========
  BOOKING_NOT_FOUND = 'BKG_500',
  BOOKING_INVALID_DATE = 'BKG_501',
  BOOKING_CONFLICT = 'BKG_502',

  // ========== Payment errors (600-699) ==========
  PAYMENT_FAILED = 'PAY_600',
  PAYMENT_METHOD_INVALID = 'PAY_601',

  // ========== Notification errors (700-799) ==========
  NOTIFICATION_FAILED = 'NOT_700',
  WHATSAPP_SEND_FAILED = 'NOT_701',

  // ========== Database errors (900-999) ==========
  DB_UNIQUE_CONSTRAINT = 'DB_900',
  DB_FOREIGN_KEY_FAILED = 'DB_901',
  DB_QUERY_FAILED = 'DB_902',
}