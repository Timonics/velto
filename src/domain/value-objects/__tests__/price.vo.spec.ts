import { Price } from '../price.vo';

describe('Price', () => {
  it('should create a price with positive amount', () => {
    const price = Price.create(2500);
    expect(price.getValue()).toBe(2500);
  });

  it('should accept zero', () => {
    const price = Price.create(0);
    expect(price.getValue()).toBe(0);
  });

  it('should round to 2 decimal places', () => {
    const price = Price.create(10.999);
    expect(price.getValue()).toBe(11.0);
  });

  it('should throw error for negative amount', () => {
    expect(() => Price.create(-5)).toThrow('Price must be a non-negative number');
  });

  it('should format price with Naira sign', () => {
    const price = Price.create(1250.5);
    expect(price.getFormatted()).toBe('₦1,250.50');
  });

  it('should compare equality correctly', () => {
    const price1 = Price.create(100);
    const price2 = Price.create(100);
    const price3 = Price.create(200);
    expect(price1.equals(price2)).toBe(true);
    expect(price1.equals(price3)).toBe(false);
  });

  it('should perform addition', () => {
    const price1 = Price.create(100);
    const price2 = Price.create(50);
    const sum = price1.add(price2);
    expect(sum.getValue()).toBe(150);
  });

  it('should perform multiplication', () => {
    const price = Price.create(100);
    const result = price.multiply(3);
    expect(result.getValue()).toBe(300);
  });
});