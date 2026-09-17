import { ProviderProduct } from '../../../shared/interfaces/product-provider.interface';
import {
  ACCESSORY_WORDS,
  matchPlatform,
  parseOldPrice,
  parsePrice,
  isSanePrice,
} from './platform-matcher';

/** Maps SerpAPI shopping_results → normalized products. */
export function mapShoppingResults(results: unknown[], query: string): ProviderProduct[] {
  const q = (query || '').toLowerCase();
  const excludes = new Set(ACCESSORY_WORDS.filter((w) => !q.includes(w)));

  const out: ProviderProduct[] = [];
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();

  let total = 0;
  const droppedStores: string[] = [];
  let droppedNoPrice = 0;
  let droppedAccessory = 0;
  let droppedDupe = 0;

  for (const raw of results) {
    const item = raw as Record<string, unknown>;
    total++;

    const platform = matchPlatform(item.source as string);
    if (!platform) {
      droppedStores.push((item.source as string) || '(no source)');
      continue;
    }

    const price = (item.extracted_price as number) || parsePrice(item.price);
    if (price <= 0 || !isSanePrice(price)) {
      droppedNoPrice++;
      continue;
    }

    const title = (item.title as string) || '';
    const tokens = title.toLowerCase().split(/[^a-z0-9]+/);
    if (tokens.some((t) => excludes.has(t))) {
      droppedAccessory++;
      continue;
    }

    const productId = (item.product_id as string) || '';
    if (productId && seenIds.has(productId)) {
      droppedDupe++;
      continue;
    }

    const normTitle = title.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!productId && normTitle && seenTitles.has(normTitle)) {
      droppedDupe++;
      continue;
    }

    if (productId) seenIds.add(productId);
    if (normTitle) seenTitles.add(normTitle);

    out.push({
      token: (item.immersive_product_page_token as string) || '',
      productId,
      title: title || 'Unknown Product',
      platform,
      price,
      oldPrice: parseOldPrice(item.old_price),
      currency: 'INR',
      imageUrl: (item.thumbnail as string) || '',
      productUrl: (item.product_link as string) || (item.link as string) || '',
      rating: (item.rating as number) ?? null,
      reviewCount: (item.reviews as number) ?? null,
      delivery: (item.delivery as string) || '',
      position: (item.position as number) ?? null,
      source: (item.source as string) || '',
      sourceIcon: (item.source_icon as string) || '',
      extractedPrice: (item.extracted_price as number) ?? null,
      extractedOldPrice: (item.extracted_old_price as number) ?? null,
      secondHandCondition: (item.second_hand_condition as string) || '',
      tag: (item.tag as string) || '',
      extensions: (item.extensions as string[]) || [],
      serpapiProductApi: (item.serpapi_immersive_product_api as string) || '',
    });
  }

  console.log(
    `\n🔍 [MAPPER DEBUG] query="${query}"\n` +
      `   TOTAL from SerpAPI: ${total}\n` +
      `   ✅ KEPT: ${out.length}\n` +
      `   ❌ dropped (untrusted store): ${droppedStores.length}\n` +
      `   ❌ dropped (no/insane price): ${droppedNoPrice}\n` +
      `   ❌ dropped (accessory): ${droppedAccessory}\n` +
      `   ❌ dropped (duplicate): ${droppedDupe}\n` +
      `   🏪 DROPPED STORE NAMES: ${JSON.stringify(droppedStores)}\n`,
  );

  return out;
}
