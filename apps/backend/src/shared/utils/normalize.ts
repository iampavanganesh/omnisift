/** Query/title normalization — increases cache hits and dedup accuracy. */
export function normalizeQuery(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const SLUG_MAX_LENGTH = 60;

/**
 * Slugify + truncate to a URL-reasonable length, cutting at the last whole
 * word rather than mid-word. Product titles are long marketing strings
 * ("PERY-PAO Men's Stylish Sliders For Everyday Comfort..."), so a raw
 * slugify() would produce unusably long URLs.
 */
function slugifyTruncated(input: string): string {
  const full = slugify(input);
  if (full.length <= SLUG_MAX_LENGTH) return full;
  const cut = full.slice(0, SLUG_MAX_LENGTH);
  const lastDash = cut.lastIndexOf('-');
  return (lastDash > 0 ? cut.slice(0, lastDash) : cut).replace(/-$/, '');
}

/**
 * Generates a slug from `title`, appending `-2`, `-3`, ... until `exists`
 * reports no collision. `exists` is injected so this works both inside a
 * Prisma transaction (checking against `tx`) and in a standalone script
 * (checking against a plain `PrismaClient`) without duplicating the logic.
 */
export async function uniqueSlug(
  title: string,
  exists: (candidate: string) => Promise<boolean>,
): Promise<string> {
  const root = slugifyTruncated(title) || 'item';
  let candidate = root;
  let suffix = 2;
  while (await exists(candidate)) {
    candidate = `${root}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

/**
 * Stronger key for PRODUCT DEDUP. Titles from different sellers vary in
 * punctuation, extra spaces, and trailing marketing junk, which let the same
 * product slip in twice (e.g. "PERY-PAO Men's Stylish Sliders" x2). This makes
 * a tighter key: lowercase, strip punctuation to single spaces, drop very common
 * filler words, and keep only the first ~8 meaningful words so long marketing
 * titles still collapse onto the same product.
 */
export function dedupKey(input: string): string {
  const filler = new Set([
    'the',
    'a',
    'an',
    'for',
    'with',
    'and',
    'men',
    'mens',
    "men's",
    'women',
    'womens',
    "women's",
    'new',
    'latest',
    'original',
    'genuine',
    'stylish',
  ]);
  const words = (input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter((w) => w && !filler.has(w));
  return words.slice(0, 8).join(' ');
}
