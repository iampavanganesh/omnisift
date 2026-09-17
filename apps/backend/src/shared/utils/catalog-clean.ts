/**
 * Catalog cleaning helpers — used when persisting products from a provider.
 * Keyword-based categorization (correct approach for a small catalog),
 * brand extraction/normalization, and encoding repair.
 */

/** Fixed category list for Omnisift. 'Uncategorized' is the honest fallback. */
export const CATEGORIES = [
  'Mobiles',
  'Laptops',
  'Electronics',
  'Fashion',
  'Home',
  'Appliances',
  'Beauty',
  'Sports',
  'Toys and Games',
  'Automotive',
  'Books',
  'Grocery',
  'Audio',
  'Wearables',
  'Footwear',
  'Clothing',
  'Bottles',
  'Accessories',
  'Uncategorized',
] as const;
export type CategoryName = (typeof CATEGORIES)[number];

/**
 * Ordered keyword rules. FIRST match wins, so put specific/strong signals first.
 * Words are matched as whole words (\b) to avoid false hits ("shoe" not in "shoehorn").
 *
 * '5g'/'4g'/'mobile' are deliberately NOT in the main Mobiles block below — they're
 * connectivity/generic terms that also appear in laptop, tablet, and router listings
 * (e.g. "...Android 4G Laptop...", a real title that was landing in Mobiles before
 * "laptop" ever got a chance to match). They're demoted to a last-resort tier at the
 * bottom of this list, checked only after every category's real, specific keywords
 * — including the rest of Mobiles' own — have already had first refusal.
 */
const CATEGORY_RULES: { category: CategoryName; keywords: string[] }[] = [
  // Mobiles — strong phone signals first
  {
    category: 'Mobiles',
    keywords: [
      'iphone',
      'galaxy',
      'pixel',
      'redmi',
      'oneplus',
      'iqoo',
      'smartphone',
      'mobile phone',
      'android mobile',
      'keypad phone',
      'phone',
    ],
  },
  // Laptops
  {
    category: 'Laptops',
    keywords: ['laptop', 'notebook', 'macbook', 'chromebook', 'jiobook', 'ideapad', 'thinkpad'],
  },
  // Audio
  {
    category: 'Audio',
    keywords: [
      'earbuds',
      'airdopes',
      'headphone',
      'headset',
      'earphone',
      'speaker',
      'soundbar',
      'buds',
      'tws',
      'homepod',
      'nothing ear',
    ],
  },
  // Wearables
  {
    category: 'Wearables',
    keywords: ['smartwatch', 'smart watch', 'colorfit', 'watch', 'band', 'fitness tracker'],
  },
  // Footwear
  {
    category: 'Footwear',
    keywords: [
      'sneaker',
      'sneakers',
      'shoe',
      'shoes',
      'slider',
      'sliders',
      'sandal',
      'slipper',
      'slippers',
      'loafer',
      'boot',
      'boots',
      'footwear',
    ],
  },
  // Clothing
  {
    category: 'Clothing',
    keywords: [
      'shirt',
      't-shirt',
      'tshirt',
      'jeans',
      'trouser',
      'kurta',
      'saree',
      'dress',
      'jacket',
      'hoodie',
      'raincoat',
      'gloves',
      'shorts',
    ],
  },
  // Bottles
  { category: 'Bottles', keywords: ['water bottle', 'bottle', 'flask', 'sipper', 'tumbler'] },
  // Electronics — general electronics not already claimed by Mobiles/Laptops/Audio above.
  {
    category: 'Electronics',
    keywords: [
      'television',
      'smart tv',
      'led tv',
      'camera',
      'dslr',
      'printer',
      'monitor',
      'projector',
      'gaming console',
      'playstation',
      'xbox',
      'nintendo',
      'router',
      'webcam',
      'hard disk',
      'ssd',
      'pendrive',
    ],
  },
  // Fashion — non-clothing, non-footwear fashion items.
  {
    category: 'Fashion',
    keywords: [
      'sunglasses',
      'wallet',
      'handbag',
      'purse',
      'jewellery',
      'jewelry',
      'earrings',
      'necklace',
      'bracelet',
    ],
  },
  // Home — decor, furnishing, kitchenware.
  {
    category: 'Home',
    keywords: [
      'bedsheet',
      'bedsheets',
      'curtain',
      'dinner set',
      'cookware',
      'furniture',
      'mattress',
      'carpet',
      'home decor',
    ],
  },
  // Appliances — large/small home appliances.
  {
    category: 'Appliances',
    keywords: [
      'refrigerator',
      'washing machine',
      'microwave',
      'air conditioner',
      'geyser',
      'water heater',
      'mixer grinder',
      'vacuum cleaner',
      'air purifier',
      'air fryer',
      'ceiling fan',
      'chimney',
    ],
  },
  // Beauty — cosmetics and personal care.
  {
    category: 'Beauty',
    keywords: [
      'lipstick',
      'skincare',
      'perfume',
      'deodorant',
      'shampoo',
      'face wash',
      'moisturizer',
      'sunscreen',
      'foundation',
      'mascara',
      'nail polish',
    ],
  },
  // Sports — sports and fitness gear.
  {
    category: 'Sports',
    keywords: [
      'cricket bat',
      'football',
      'basketball',
      'badminton',
      'yoga mat',
      'dumbbell',
      'treadmill',
      'tennis racket',
      'skateboard',
    ],
  },
  // Toys and Games — checked before Sports-adjacent generic terms since it's more specific.
  {
    category: 'Toys and Games',
    keywords: [
      'toy',
      'lego',
      'board game',
      'puzzle',
      'action figure',
      'remote control car',
      'doll',
    ],
  },
  // Automotive — checked before Accessories so compound phrases like "car cover"/
  // "seat cover" don't get claimed by Accessories' generic 'cover' keyword below.
  {
    category: 'Automotive',
    keywords: [
      'car cover',
      'seat cover',
      'car accessories',
      'bike accessories',
      'helmet',
      'engine oil',
      'motor oil',
      'alloy wheel',
      'tyre',
      'tire',
    ],
  },
  // Books
  { category: 'Books', keywords: ['book', 'novel', 'textbook'] },
  // Grocery
  {
    category: 'Grocery',
    keywords: ['basmati rice', 'cooking oil', 'atta', 'grocery', 'snacks combo'],
  },
  // Accessories
  {
    category: 'Accessories',
    keywords: [
      'case',
      'cover',
      'charger',
      'cable',
      'adapter',
      'power bank',
      'umbrella',
      'backpack',
      'bag',
    ],
  },
  // Last resort: generic connectivity/device terms that are real phone signals only
  // once nothing more specific above has already claimed the title (see comment on
  // CATEGORY_RULES above).
  { category: 'Mobiles', keywords: ['5g', '4g', 'mobile'] },
];

/** Decide a category from a product title. Returns 'Uncategorized' if nothing matches. */
export function categorize(title: string): CategoryName {
  const t = (title || '').toLowerCase();
  for (const rule of CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      // Whole-word / phrase match. Escape regex-special chars in the keyword.
      const safe = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(^|[^a-z0-9])${safe}([^a-z0-9]|$)`, 'i');
      if (re.test(t)) return rule.category;
    }
  }
  return 'Uncategorized';
}

/**
 * Repair mojibake (UTF-8 bytes wrongly decoded as Latin-1), e.g. "à¤•à¥‡".
 * If a string still contains these artifacts, strip any non-printable/garbled
 * runs so the DB never stores corrupted text. Conservative: only touches
 * strings that actually show the tell-tale "Ã/Â/à¤" patterns.
 */
export function cleanText(input: string | null | undefined): string {
  if (!input) return '';
  let s = input.trim();
  const looksMojibake = /Ã.|Â.|à¤|à¥/.test(s);
  if (looksMojibake) {
    try {
      // Re-interpret the mis-decoded bytes as proper UTF-8.
      s = Buffer.from(s, 'latin1').toString('utf8');
    } catch {
      // ignore
    }
  }
  // Drop leftover control/replacement chars, collapse spaces.
  s = s
    // eslint-disable-next-line no-control-regex -- intentionally stripping control chars
    .replace(/[\u0000-\u001F\u007F\uFFFD]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return s;
}

/**
 * Resolve a clean, consistently-cased brand.
 * 1) Use the provider brand if present.
 * 2) Else fall back to the first meaningful word of the title.
 * 3) Normalize casing so "boAt"/"BOAT"/"boat" collapse to one brand.
 * Returns '' when nothing usable (caller then stores no brand).
 */
export function resolveBrand(
  providerBrand: string | null | undefined,
  title: string,
  guessFromTitle = true,
): string {
  let raw = cleanText(providerBrand);
  if (!raw && guessFromTitle) {
    // Fall back to the first word of the cleaned title (skip pure numbers).
    // Display-only use (search filter chips) — never for catalog writes,
    // since it has no real signal behind it and produces junk brand names.
    const firstWord = cleanText(title)
      .split(' ')
      .find((w) => w && !/^\d+$/.test(w));
    raw = firstWord ?? '';
  }
  if (!raw) return '';
  return normalizeBrandCase(raw);
}

/** Consistent brand casing: Title Case, with a few known-brand overrides. */
export function normalizeBrandCase(brand: string): string {
  const b = brand.trim();
  if (!b) return '';
  const lower = b.toLowerCase();
  const overrides: Record<string, string> = {
    boat: 'boAt',
    oneplus: 'OnePlus',
    oppo: 'OPPO',
    vivo: 'Vivo',
    hp: 'HP',
    jbl: 'JBL',
    boult: 'Boult',
    puma: 'Puma',
    'here&now': 'HERE&NOW',
  };
  if (overrides[lower]) return overrides[lower];
  // Default: Title Case each word.
  return lower.replace(/\b([a-z])/g, (m) => m.toUpperCase());
}
