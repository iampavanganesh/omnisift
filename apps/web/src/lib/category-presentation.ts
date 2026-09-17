/**
 * Curated per-category PRESENTATION only — hero copy, nothing else. This is
 * deliberately NOT a filter taxonomy: the real, data-driven facet engine
 * (GET /categories/:slug/facets) still decides which filters actually show,
 * driven entirely by what the category's real products have. This file only
 * changes how a category page is introduced, never what data it claims to
 * have.
 *
 * Every line here is a general, honest description of the category itself
 * (what kind of products it is), never a claim about OmniSift's own
 * capabilities or inventory ("AI-powered", "best selection", specific counts)
 * that isn't independently rendered from real data elsewhere on the page.
 *
 * Keyed by slug. Not every real category needs an entry — `getCategoryTagline`
 * falls back to a generic line for anything not listed here, so a brand-new
 * or thin category (e.g. "Bottles") still renders correctly without needing
 * hand-authored copy first.
 */
const TAGLINES: Record<string, string> = {
  mobiles: "Compare real prices on phones across every store that lists them.",
  laptops: "From budget to performance — see what each laptop actually costs, everywhere.",
  audio: "Headphones, speakers and earbuds — one price view across every store.",
  wearables: "Smartwatches and fitness trackers, compared on real price and specs.",
  footwear: "Real prices on shoes and sneakers, side by side.",
  fashion: "Clothing and accessories, compared across stores in one place.",
  clothing: "Compare real prices on clothing across stores before you buy.",
  beauty: "Skincare, haircare and beauty essentials — real prices, one view.",
  electronics: "Compare real prices across every electronics category we track.",
  appliances: "Home appliances compared on real price, before you commit.",
  home: "Everything for the home, with real prices compared across stores.",
  grocery: "Everyday grocery essentials, price-compared across stores.",
  automotive: "Car and bike accessories, compared on real price across stores.",
  sports: "Sports and fitness gear, compared on real price across stores.",
  books: "Books compared across stores so you know where they're cheapest.",
  accessories: "Real accessories, real prices, compared across every store.",
  "toys-and-games": "Toys and games compared on real price across stores.",
  bottles: "Bottles and drinkware, compared on real price across stores.",
};

const GENERIC_FALLBACK = "Real prices, compared across every store that sells it.";

export function getCategoryTagline(slug: string): string {
  return TAGLINES[slug] ?? GENERIC_FALLBACK;
}
