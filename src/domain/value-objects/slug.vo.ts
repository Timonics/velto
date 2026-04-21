/**
 * Slug Value Object – URL-friendly identifier from business name.
 * 
 * Example: "Taj Kulture" → "taj-kulture"
 * 
 * Used for tenant subdomains (e.g., taj-kulture.velto.app).
 */

import { Result, ok, err } from '../shared/result';

export class Slug {
  private constructor(private readonly value: string) {}

  static create(input: string): Result<Slug, string> {
    let slug = input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    if (slug.length === 0) {
      return err('Slug cannot be empty');
    }
    if (slug.length > 100) {
      return err('Slug too long (max 100 chars)');
    }
    return ok(new Slug(slug));
  }

  getValue(): string {
    return this.value;
  }
}