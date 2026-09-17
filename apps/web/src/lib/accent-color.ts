/**
 * Deterministic hash-to-hue — no fabricated per-category/per-brand imagery
 * (no stock photos), just a stable color so the same category or brand always
 * renders the same hero identity. Used by both category and brand hero
 * banners (brand pages don't get a *different* mechanism — same rule for the
 * same visual concept). Mirrors the same principle already used for
 * brand/category banners in the Flutter client (brandAccentColor /
 * categoryAccentColor).
 *
 * Hashing into the FULL 360° wheel (the original approach) can land on blue
 * or violet/magenta for an arbitrary name — e.g. "Laptops" hashed to 273°
 * (purple), "Books" to 210° (blue) — which directly violates the site's
 * frozen design identity (no blue/purple primary theme, no generic SaaS
 * look). Hashing into this curated warm/earthy palette instead keeps every
 * possible output on-brand while staying just as deterministic and just as
 * free of fabricated imagery.
 */
const SAFE_HUES = [18, 35, 50, 92, 135, 355, 10, 70, 145, 342] as const;

export function accentHue(name: string): number {
  const hash = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) & 0x7fffffff, 0);
  return SAFE_HUES[hash % SAFE_HUES.length];
}
