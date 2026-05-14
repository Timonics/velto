/**
 * Base Serializer – Explicit response formatting.
 *
 * Each module implements its own serializer extending this base.
 */

export interface SerializerOptions {
  includeTimestamps?: boolean;
  includeRelations?: boolean;
}

export abstract class BaseSerializer<TEntity, TResponse> {
  /**
   * Serialize a single entity.
   */
  abstract serialize(entity: TEntity, options?: SerializerOptions): TResponse;

  /**
   * Serialize a collection of entities.
   */
  serializeMany(entities: TEntity[], options?: SerializerOptions): TResponse[] {
    return entities.map((entity) => this.serialize(entity, options));
  }

  /**
   * Format dates consistently across all serializers.
   */
  protected formatDate(date: Date | null | undefined): string | null {
    if (!date) return null;
    return date.toISOString();
  }

  /**
   * Format price with currency symbol (₦ for NGN).
   */
  protected formatPrice(price: number): string {
    return `₦${price.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  }

  /**
   * Sanitize URLs (ensure Cloudinary URLs are HTTPS).
   */
  protected sanitizeUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }
    return url;
  }
}
