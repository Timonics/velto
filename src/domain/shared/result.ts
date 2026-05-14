/**
 * Result type – Functional error handling without throwing exceptions.
 *
 * Why use Result instead of throwing?
 * - Makes error handling explicit in the type signature.
 * - Prevents uncaught exceptions.
 * - Useful for validation where multiple errors may need to be collected.
 *
 * @example
 * Usage:
 *   function validatePhone(phone: string): Result<string, string> {
 *     if (!phone) return err('Phone is required');
 *     return ok(phone);
 *   }
 *
 *   const result = validatePhone(phone);
 *   if (result.isOk()) {
 *     console.log(result.getValue());
 *   } else {
 *     console.error(result.getError());
 *   }
 */

export type Result<T, E = string> = Ok<T, E> | Err<T, E>;

export class Ok<T, E> {
  constructor(private readonly value: T) {}

  isOk(): this is Ok<T, E> {
    return true;
  }

  isErr(): this is Err<T, E> {
    return false;
  }

  getValue(): T {
    return this.value;
  }

  getError(): E {
    throw new Error('Cannot get error from Ok result');
  }
}

export class Err<T, E> {
  constructor(private readonly error: E) {}

  isOk(): this is Ok<T, E> {
    return false;
  }

  isErr(): this is Err<T, E> {
    return true;
  }

  getValue(): T {
    throw new Error('Cannot get value from Err result');
  }

  getError(): E {
    return this.error;
  }
}

/**
 * Create a successful result.
 */
export function ok<T, E>(value: T): Result<T, E> {
  return new Ok(value);
}

/**
 * Create a failed result.
 */
export function err<T, E>(error: E): Result<T, E> {
  return new Err(error);
}
