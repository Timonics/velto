import { Slug } from '../slug.vo';

describe('Slug', () => {
  it('should convert business name to URL-friendly slug', () => {
    const result = Slug.create('Taj Kulture Store');
    expect(result.isOk()).toBe(true);
    expect(result.getValue().getValue()).toBe('taj-kulture-store');
  });

  it('should remove special characters', () => {
    const result = Slug.create('Taj@Kulture!Store');
    expect(result.isOk()).toBe(true);
    expect(result.getValue().getValue()).toBe('taj-kulture-store');
  });

  it('should trim trailing/leading hyphens', () => {
    const result = Slug.create('-Taj Kulture-');
    expect(result.isOk()).toBe(true);
    expect(result.getValue().getValue()).toBe('taj-kulture');
  });

  it('should reject empty string', () => {
    const result = Slug.create('');
    expect(result.isErr()).toBe(true);
    expect(result.getError()).toBe('Slug cannot be empty');
  });

  it('should reject if longer than 100 chars', () => {
    const longName = 'a'.repeat(101);
    const result = Slug.create(longName);
    expect(result.isErr()).toBe(true);
    expect(result.getError()).toBe('Slug too long (max 100 chars)');
  });

  it('should replace multiple spaces/dashes with single hyphen', () => {
    const result = Slug.create('Taj   Kulture - Store');
    expect(result.isOk()).toBe(true);
    expect(result.getValue().getValue()).toBe('taj-kulture-store');
  });
});