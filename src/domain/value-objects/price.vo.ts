/**
 * Price Value Object – Represents money in NGN (Naira).
 * 
 * Why a class instead of primitive number?
 * - Encapsulates currency, rounding, and comparison.
 * - Prevents accidental mixing of currencies.
 * - Immutable.
 */

export class Price {
  private constructor(private readonly amount: number) {}

  static create(amount: number): Price {
    if (isNaN(amount) || amount < 0) {
      throw new Error('Price must be a non-negative number');
    }
    // Round to 2 decimal places
    const rounded = Math.round(amount * 100) / 100;
    return new Price(rounded);
  }

  getValue(): number {
    return this.amount;
  }

  getFormatted(): string {
    return `₦${this.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  }

  equals(other: Price): boolean {
    return this.amount === other.amount;
  }

  isGreaterThan(other: Price): boolean {
    return this.amount > other.amount;
  }

  add(other: Price): Price {
    return Price.create(this.amount + other.amount);
  }

  multiply(factor: number): Price {
    return Price.create(this.amount * factor);
  }
}