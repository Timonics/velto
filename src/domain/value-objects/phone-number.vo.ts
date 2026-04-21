/**
 * PhoneNumber Value Object – Validates and formats Nigerian phone numbers.
 * 
 * Why a value object?
 * - Encapsulates validation logic (e.g., must start with +234 or 0).
 * - Ensures phone numbers are always stored in a consistent format.
 * - Immutable.
 * 
 * Usage:
 *   const phone = PhoneNumber.create('+2348012345678');
 *   if (phone.isOk()) console.log(phone.getValue().value);
 */

import { Result, ok, err } from '../shared/result';

export class PhoneNumber {
  private constructor(private readonly number: string) {}

  static create(phone: string): Result<PhoneNumber, string> {
    // Normalize: remove spaces, dashes, and ensure +234 prefix
    let cleaned = phone.replace(/[\s-]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '+234' + cleaned.slice(1);
    }
    if (!cleaned.startsWith('+234')) {
      return err('Phone number must start with +234 or 0');
    }
    if (!/^\+234[0-9]{10}$/.test(cleaned)) {
      return err('Phone number must be 10 digits after +234');
    }
    return ok(new PhoneNumber(cleaned));
  }

  getValue(): string {
    return this.number;
  }

  equals(other: PhoneNumber): boolean {
    return this.number === other.number;
  }
}