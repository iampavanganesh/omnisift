/**
 * The provider abstraction — Omnisift's most important boundary.
 * SerpAPI implements this today; Amazon/Flipkart/etc. later.
 */
export interface ProviderProduct {
  token: string; // immersive_product_page_token — powers the detail/compare step
  productId: string;
  title: string;
  platform: string;
  price: number;
  oldPrice: number | null;
  currency: string;
  imageUrl: string;
  productUrl: string;
  rating: number | null;
  reviewCount: number | null;
  delivery: string;
  // --- full raw SerpAPI fields (saved for future use) ---
  position: number | null;
  source: string;
  sourceIcon: string;
  extractedPrice: number | null;
  extractedOldPrice: number | null;
  secondHandCondition: string;
  tag: string;
  extensions: string[];
  serpapiProductApi: string;
}

export interface ProviderSeller {
  platform: string; // Amazon, Flipkart, ...
  price: number;
  currency: string;
  link: string;
  logo: string;
  // --- richer per-seller fields (from stores[]) ---
  sellerTitle: string; // the store's own product title
  tag: string; // e.g. "Best price"
  shipping: string; // e.g. "Free"
  detailsAndOffers: string[]; // "In stock online", "Free delivery Fri–Mon", "5-day returns"
  rating: number | null; // this store's own rating
  reviewCount: number | null; // this store's own review count
  mrp: number | null; // strikethrough price (extracted_original_price)
  discountPct: number | null; // % off, from "discount" or computed mrp vs price
}
export interface ProviderRatingBar {
  stars: number; // 1..5
  amount: number; // how many reviews at this star
}

export interface ProviderUserReview {
  title: string;
  text: string;
  userName: string;
  source: string; // influenster.com, shopee, ...
  rating: number | null;
  date: string; // "9 months ago"
  icon: string;
  images: string[];
}

export interface ProviderVariantItem {
  name: string; // "128 GB", "Black", ...
  available: boolean;
}

export interface ProviderVariantGroup {
  title: string; // "Capacity", "Colour"
  items: ProviderVariantItem[];
}

export interface ProviderRelatedProduct {
  title: string;
  thumbnail: string;
  price: number | null;
  rating: number | null;
  reviewCount: number | null;
}

export interface ProviderVideo {
  title: string;
  link: string;
  source: string; // YouTube, Facebook
  channel: string;
  duration: string;
  thumbnail: string;
}

export interface ProviderComparison {
  title: string;
  brand: string;
  description: string;
  rating: number | null;
  reviewCount: number | null;
  priceRange: string;
  images: string[];
  specifications: { name: string; value: string }[];
  sellers: ProviderSeller[]; // cheapest-first
  // --- richer sections (from google_immersive_product) ---
  aboutTitle: string; // about_the_product.title
  aboutLink: string; // about_the_product.link
  ratingBreakdown: ProviderRatingBar[]; // star histogram
  userReviews: ProviderUserReview[]; // written reviews
  variants: ProviderVariantGroup[]; // capacity / colour options
  relatedProducts: ProviderRelatedProduct[]; // more_options
  reviewsImages: string[]; // customer photos
  videos: ProviderVideo[]; // review videos
}

/** Abstract class so it can serve as a Nest DI token. */
export abstract class ProductProvider {
  abstract readonly slug: string;
  abstract search(query: string, page?: number): Promise<ProviderProduct[]>;
  abstract getComparison(token: string): Promise<ProviderComparison | null>;
}
