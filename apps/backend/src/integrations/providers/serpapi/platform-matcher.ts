/** Maps a raw SerpAPI "source" to a canonical Omnisift platform. Returns null
 *  for stores that are NOT on our trusted list — those get filtered out. */
export function matchPlatform(source: string | undefined): string | null {
  const s = (source ?? '').toLowerCase();
  if (s.includes('flipkart') || s.includes('flip kart')) return 'Flipkart';
  if (s.includes('shopsy')) return 'Shopsy';
  if (s.includes('amazon')) return 'Amazon';
  if (s.includes('myntra')) return 'Myntra';
  if (s.includes('meesho')) return 'Meesho';
  if (s.includes('croma')) return 'Croma';
  if (s.includes('reliancedigital') || s.includes('reliance digital')) return 'Reliance Digital';
  if (s.includes('jiomart')) return 'JioMart';
  if (s.includes('vijaysales') || s.includes('vijay sales')) return 'Vijay Sales';
  if (s.includes('tatacliq') || s.includes('tata cliq')) return 'Tata CLiQ';
  if (s.includes('nykaa')) return 'Nykaa';
  if (s.includes('ajio')) return 'AJIO';
  if (s.includes('snapdeal')) return 'Snapdeal';
  if (s.includes('poorvika')) return 'Poorvika';
  if (s.includes('sangeetha')) return 'Sangeetha Mobiles';
  if (s.includes('zepto')) return 'Zepto';
  if (s.includes('bigbasket') || s.includes('big basket')) return 'BigBasket';
  if (s.includes('blinkit')) return 'Blinkit';
  if (s.includes('snapmint')) return 'Snapmint';
  if (s.includes('samsung')) return 'Samsung';
  if (s.includes('apple')) return 'Apple';
  if (s.includes('mi.com') || s.includes('xiaomi')) return 'Mi';
  if (s.includes('tata neu') || s.includes('tataneu')) return 'Tata Neu';
  if (s.includes('cashify')) return 'Cashify';
  if (s.includes('sathya')) return 'Sathya';
  return null;
}

/** Indian .com stores that are NOT on a .in domain but ARE Indian sellers. */
const INDIAN_COM_STORES = [
  'flipkart.com',
  'shopsy.in',
  'myntra.com',
  'ajio.com',
  'tatacliq.com',
  'croma.com',
  'jiomart.com',
  'nykaa.com',
  'snapdeal.com',
  'zepto.com',
  'bigbasket.com',
  'blinkit.com',
  'snapmint.com',
  'meesho.com',
  'vijaysales.com',
  'poorvika.com',
];

/** STRICT domain guard. Returns true only if the store link is an Indian store:
 *  any *.in domain (amazon.in, reliancedigital.in) OR an explicit Indian .com
 *  store (flipkart.com, zepto.com, …). A foreign domain like amazon.ae — even
 *  when Google labels its price "₹64" — returns false and is dropped. */
export function isIndianStore(link: unknown): boolean {
  const url = String(link ?? '').toLowerCase();
  if (!url) return false;
  let host = '';
  try {
    host = new URL(url).hostname; // e.g. "www.amazon.ae"
  } catch {
    return false; // no parseable URL → can't trust it → drop
  }
  // Any Indian TLD (.in, .co.in) is trusted.
  if (host.endsWith('.in')) return true;
  // Otherwise must be one of the known Indian .com stores.
  return INDIAN_COM_STORES.some((d) => host === d || host.endsWith('.' + d));
}

/** Sanity guard for absurd/garbage listings (e.g. a ₹500 speaker priced
 *  ₹49,950). Rejects prices outside a believable range. */
export function isSanePrice(price: number): boolean {
  return price >= 1 && price <= 2000000; // ₹1 – ₹20,00,000
}

export function isInrPrice(priceStr: unknown): boolean {
  const s = String(priceStr ?? '').toLowerCase();
  if (!s) return false;
  return s.includes('₹') || s.includes('inr') || /rs\.?\s*\d/.test(s);
}

export function parsePrice(priceStr: unknown): number {
  if (!priceStr) return 0;
  return parseFloat(String(priceStr).replace(/[^\d.]/g, '')) || 0;
}

export function parseOldPrice(oldPriceStr: unknown): number | null {
  if (!oldPriceStr) return null;
  const m = String(oldPriceStr).match(/₹\s?([\d,]+)/);
  if (!m) return null;
  return parseInt(m[1].replace(/,/g, ''), 10) || null;
}

/** Accessory words — when the user isn't searching for one, filter these out. */
export const ACCESSORY_WORDS = [
  'case',
  'cover',
  'tempered',
  'guard',
  'protector',
  'protection',
  'skin',
  'charger',
  'cable',
  'adapter',
  'holder',
  'stand',
  'mount',
  'strap',
  'band',
  'pouch',
  'sleeve',
  'bumper',
  'flip',
  'screenguard',
];
