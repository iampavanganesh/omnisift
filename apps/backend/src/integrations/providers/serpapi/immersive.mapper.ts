import {
  ProviderComparison,
  ProviderSeller,
  ProviderRatingBar,
  ProviderUserReview,
  ProviderVariantGroup,
  ProviderVariantItem,
  ProviderRelatedProduct,
  ProviderVideo,
} from '../../../shared/interfaces/product-provider.interface';
import { matchPlatform, parsePrice, isIndianStore, isSanePrice } from './platform-matcher';

/** Safe helpers */
function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}
function num(v: unknown): number | null {
  return typeof v === 'number' ? v : null;
}
function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

/** Maps SerpAPI google_immersive_product → normalized comparison (full capture). */
export function mapImmersiveProduct(data: Record<string, unknown>): ProviderComparison | null {
  const pr = (data.product_results as Record<string, unknown>) ?? {};
  if (Object.keys(pr).length === 0) return null;

  const about = (pr.about_the_product as Record<string, unknown>) ?? {};

  // Sellers can live under different keys depending on the product.
  let rawStores: unknown[] = [];
  if (Array.isArray(pr.stores)) rawStores = pr.stores as unknown[];
  else if (Array.isArray((data.sellers_results as any)?.online_sellers)) {
    rawStores = (data.sellers_results as any).online_sellers as unknown[];
  } else if (Array.isArray(data.stores)) rawStores = data.stores as unknown[];

  const sellers: ProviderSeller[] = [];
  console.log(
    '🏪 RAW STORES:',
    JSON.stringify(
      rawStores.map((r: any) => ({
        name: r?.name || r?.source || r?.merchant,
        price: r?.extracted_price || r?.price,
        link: r?.link,
      })),
      null,
      2,
    ),
  );
  for (const raw of rawStores) {
    const s = raw as Record<string, unknown>;
    const link = str(s.link) || str(s.direct_link) || '';
    // STRICT domain guard: only Indian stores. Drops amazon.ae even when Google
    // pre-labels its price "₹64", because the domain (.ae) is the honest signal.
    if (!isIndianStore(link)) continue;
    const rawName = str(s.name) || str(s.source) || str(s.merchant) || '';
    const platform = matchPlatform(rawName); // trusted stores only
    let price = 0;
    if (s.extracted_price) price = s.extracted_price as number;
    else if (s.price) price = parsePrice(s.price);
    if (!platform || price <= 0 || !isSanePrice(price)) continue;

    // MRP + discount% — SerpApi gives these per store when the listing is on sale.
    const mrpRaw = num(s.extracted_original_price);
    const mrp = mrpRaw && isSanePrice(mrpRaw) && mrpRaw > price ? Math.round(mrpRaw) : null;
    let discountPct: number | null = null;
    const discMatch = str(s.discount).match(/(\d+)\s*%/);
    if (discMatch) discountPct = parseInt(discMatch[1], 10);
    else if (mrp) discountPct = Math.round(((mrp - price) / mrp) * 100);

    sellers.push({
      platform,
      price: Math.round(price),
      currency: 'INR',
      link,
      logo: str(s.thumbnail) || str(s.logo) || '',
      mrp,
      discountPct,
      // richer per-seller fields:
      sellerTitle: str(s.title),
      tag: str(s.tag),
      shipping: str(s.shipping),
      detailsAndOffers: arr(s.details_and_offers)
        .map((x) => str(x))
        .filter(Boolean),
      rating: num(s.rating),
      reviewCount: num(s.reviews),
    });
  }
  // Keep only the cheapest listing per store (Google returns duplicate stores).
  const byPlatform = new Map<string, ProviderSeller>();
  for (const s of sellers) {
    const existing = byPlatform.get(s.platform);
    if (!existing || s.price < existing.price) byPlatform.set(s.platform, s);
  }
  const dedupedSellers = [...byPlatform.values()].sort((a, b) => a.price - b.price);

  // Specifications (strings like "Brand: Realme" or objects). Cap raised to 50.
  const rawSpecs =
    (about.specifications as unknown[]) ||
    (about.features as unknown[]) ||
    (pr.specifications as unknown[]) ||
    [];
  const specifications: { name: string; value: string }[] = [];
  for (const item of rawSpecs ?? []) {
    if (typeof item === 'string') {
      const parts = item.split(/:\s*/);
      if (parts.length >= 2)
        specifications.push({ name: parts[0].trim(), value: parts.slice(1).join(': ').trim() });
      else specifications.push({ name: item.trim(), value: '✓' });
    } else if (item && typeof item === 'object') {
      const s = item as Record<string, unknown>;
      const name = str(s.title) || str(s.name) || str(s.key) || '';
      const value = str(s.value) || str(s.description) || '';
      if (name) specifications.push({ name, value: value || '✓' });
    }
  }

  // Star breakdown: [{stars, amount}]
  const ratingBreakdown: ProviderRatingBar[] = arr(pr.ratings)
    .map((r) => {
      const o = r as Record<string, unknown>;
      return { stars: num(o.stars) ?? 0, amount: num(o.amount) ?? 0 };
    })
    .filter((r) => r.stars > 0);

  // Written user reviews
  const userReviews: ProviderUserReview[] = arr(pr.user_reviews)
    .map((r) => {
      const o = r as Record<string, unknown>;
      return {
        title: str(o.title),
        text: str(o.text),
        userName: str(o.user_name),
        source: str(o.source),
        rating: num(o.rating),
        date: str(o.date),
        icon: str(o.icon),
        images: arr(o.images)
          .map((x) => str(x))
          .filter(Boolean),
      };
    })
    .slice(0, 20);

  // Variants: groups (Capacity, Colour) each with items {name, available}
  const variants: ProviderVariantGroup[] = arr(pr.variants)
    .map((g) => {
      const grp = g as Record<string, unknown>;
      const items: ProviderVariantItem[] = arr(grp.items)
        .map((it) => {
          const o = it as Record<string, unknown>;
          return { name: str(o.name), available: o.available === true };
        })
        .filter((x) => x.name);
      return { title: str(grp.title), items };
    })
    .filter((g) => g.title && g.items.length > 0);

  // Related products (more_options)
  const relatedProducts: ProviderRelatedProduct[] = arr(pr.more_options)
    .map((m) => {
      const o = m as Record<string, unknown>;
      return {
        title: str(o.title),
        thumbnail: str(o.thumbnail),
        price: num(o.extracted_price),
        rating: num(o.rating),
        reviewCount: num(o.reviews),
      };
    })
    .filter((x) => x.title)
    .slice(0, 20);

  // Review images (customer photos)
  const reviewsImages: string[] = arr(pr.reviews_images)
    .map((x) => str(x))
    .filter(Boolean)
    .slice(0, 20);

  // Videos
  const videos: ProviderVideo[] = arr(pr.videos)
    .map((v) => {
      const o = v as Record<string, unknown>;
      return {
        title: str(o.title),
        link: str(o.link),
        source: str(o.source),
        channel: str(o.channel),
        duration: str(o.duration),
        thumbnail: str(o.thumbnail),
      };
    })
    .filter((x) => x.link)
    .slice(0, 20);

  return {
    title: str(pr.title),
    brand: str(pr.brand),
    description: str(about.description) || str(pr.description),
    rating: num(pr.rating),
    reviewCount: num(pr.reviews),
    priceRange: str(pr.price_range),
    images: ((pr.thumbnails as string[]) || []).slice(0, 12),
    specifications: specifications.slice(0, 50),
    sellers: dedupedSellers,
    // richer sections:
    aboutTitle: str(about.title),
    aboutLink: str(about.link),
    ratingBreakdown,
    userReviews,
    variants,
    relatedProducts,
    reviewsImages,
    videos,
  };
}
