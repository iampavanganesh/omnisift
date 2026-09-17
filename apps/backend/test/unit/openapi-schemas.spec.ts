import { describe, expect, it } from 'vitest';
import { zodObjectProperties, zodToOpenApi } from '../../src/shared/openapi/zod-schema';
import { searchSchema } from '../../src/modules/search/presentation/validators/search.schemas';
import { similarProductSchema } from '../../src/modules/products/presentation/validators/similar-product.schemas';
import { catalogDetailSchema } from '../../src/modules/products/presentation/validators/catalog-detail.schemas';
import { comparisonSchema } from '../../src/modules/compare/presentation/validators/compare.schemas';
import { saveWishlistSchema } from '../../src/modules/wishlist/presentation/validators/wishlist.schemas';
import { createAlertSchema } from '../../src/modules/alerts/presentation/validators/price-alert.schemas';
import { recordClickSchema } from '../../src/modules/affiliate/presentation/validators/affiliate.schemas';
import { PAGINATION } from '../../src/shared/constants';

/**
 * The OpenAPI request contract is DERIVED from the Zod schemas that actually
 * validate requests, so it can't drift from validation. These tests pin the
 * derivation itself for the APIs the contract brief calls critical — and pin
 * the two properties that matter most for honesty:
 *
 *  - pagination is documented as FINITE (a real ceiling, not infinite scroll)
 *  - the affiliate click body has NO destination-URL field of any kind
 *
 * They assert real constraints that exist in the Zod source; they are not
 * coverage padding.
 */
describe('Zod → OpenAPI request schemas', () => {
  describe('search (finite pagination)', () => {
    const schema = zodToOpenApi(searchSchema);

    it('documents the real hard page ceiling rather than implying infinite paging', () => {
      const page = schema.properties!.page as Record<string, unknown>;
      expect(page.type).toBe('integer');
      expect(page.minimum).toBe(0);
      // The ceiling is real and Zod-enforced — requesting beyond it is a 400.
      expect(page.maximum).toBe(PAGINATION.MAX_PAGES - 1);
      expect(page.default).toBe(0);
    });

    it('marks only q as required, with its real length bounds', () => {
      expect(schema.required).toEqual(['q']);
      expect(schema.properties!.q).toMatchObject({ type: 'string', minLength: 1, maxLength: 120 });
    });
  });

  describe('affiliate (security)', () => {
    const schema = zodToOpenApi(recordClickSchema);

    it('exposes no destination-URL input of any kind', () => {
      expect(Object.keys(schema.properties!).sort()).toEqual(['platform', 'productId']);
      // Guard the whole serialized schema, not just top-level keys.
      expect(JSON.stringify(schema).toLowerCase()).not.toContain('targeturl');
      expect(JSON.stringify(schema).toLowerCase()).not.toContain('url');
    });

    it('requires both identifiers the server resolves the real listing from', () => {
      expect(schema.required).toEqual(['productId', 'platform']);
    });
  });

  describe('alerts', () => {
    const schema = zodToOpenApi(createAlertSchema);

    it('documents the product id as a uuid and the real alert-type enum', () => {
      expect(schema.properties!.productId).toMatchObject({ type: 'string', format: 'uuid' });
      expect(schema.properties!.type).toMatchObject({
        enum: ['ANY_DROP', 'BELOW_TARGET'],
        default: 'ANY_DROP',
      });
    });

    it('keeps targetPrice nullable and does not fabricate the cross-field refine rule', () => {
      expect(schema.properties!.targetPrice).toMatchObject({ type: 'number', nullable: true });
      // `.refine()` (targetPrice required for BELOW_TARGET) is inexpressible in
      // JSON Schema — it must be described in prose, never invented as a
      // schema construct such as oneOf/if-then.
      expect(schema.required).toEqual(['productId']);
      expect(JSON.stringify(schema)).not.toContain('if');
      expect(JSON.stringify(schema)).not.toContain('oneOf');
    });
  });

  describe('compare', () => {
    it('requires the provider token and keeps productId optional', () => {
      const schema = zodToOpenApi(comparisonSchema);
      expect(schema.required).toEqual(['token']);
      expect(schema.properties!.productId).toMatchObject({ type: 'string' });
    });
  });

  describe('wishlist', () => {
    const schema = zodToOpenApi(saveWishlistSchema);

    it('requires exactly the fields Zod has no default for', () => {
      expect(schema.required!.sort()).toEqual(['price', 'productId', 'title']);
    });

    it('documents the defaults Zod actually applies', () => {
      expect(schema.properties!.token).toMatchObject({ default: '' });
      expect(schema.properties!.price).toMatchObject({ type: 'number', minimum: 0 });
    });
  });

  describe('catalog detail (shared by categories and brands)', () => {
    const schema = zodToOpenApi(catalogDetailSchema);

    it('documents transformed params by their WIRE type, not their parsed type', () => {
      // `brands` and `specs` are `.transform()`ed into an array / record, but a
      // caller sends encoded strings — the contract must describe the wire.
      expect(schema.properties!.brands).toMatchObject({ type: 'string' });
      expect(schema.properties!.specs).toMatchObject({ type: 'string' });
    });

    it('documents the real sort enum and page bounds', () => {
      expect(schema.properties!.sort).toMatchObject({
        enum: ['price_asc', 'price_desc', 'discount_desc', 'newest'],
        default: 'newest',
      });
      expect(schema.properties!.pageSize).toMatchObject({ minimum: 1, maximum: 50, default: 20 });
    });

    it('has no required parameters — every filter is optional', () => {
      expect(schema.required).toBeUndefined();
    });
  });

  describe('conversion rules', () => {
    it('never claims unknown properties are rejected (Zod strips them, it does not fail)', () => {
      for (const schema of [searchSchema, saveWishlistSchema, recordClickSchema]) {
        expect(JSON.stringify(zodToOpenApi(schema))).not.toContain('additionalProperties');
      }
    });

    it('emits no $ref or $schema, which an inline OpenAPI schema object cannot carry', () => {
      const serialized = JSON.stringify(zodToOpenApi(catalogDetailSchema));
      expect(serialized).not.toContain('$ref');
      expect(serialized).not.toContain('$schema');
    });

    it('memoises per schema object so conversion never repeats at request time', () => {
      expect(zodToOpenApi(searchSchema)).toBe(zodToOpenApi(searchSchema));
    });

    it('explodes an object schema into per-parameter entries carrying requiredness', () => {
      const params = zodObjectProperties(similarProductSchema);
      expect(params).toHaveLength(1);
      expect(params[0]).toMatchObject({ name: 'limit', required: false });
      expect(params[0].schema).toMatchObject({ minimum: 1, maximum: 20, default: 8 });
    });
  });
});
