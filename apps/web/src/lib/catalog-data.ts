import type { BrandSummary, CategorySummary } from "./types";

/**
 * Fallback catalog used only if the live `/categories` or `/brands` call fails
 * (network error, backend down) — pages fetch the real lists first. Kept small
 * and deliberately not grown by hand as a substitute for the API working.
 */
export const FALLBACK_CATEGORIES: CategorySummary[] = [
  { id: "mobile-phones", slug: "mobile-phones", name: "Mobiles", productCount: 0 },
];

export const FALLBACK_BRANDS: BrandSummary[] = [
  { id: "apple", slug: "apple", name: "Apple", productCount: 0, logoUrl: null, description: null },
];

export const BUDGET_BANDS: Array<{ label: string; max?: number }> = [
  { label: "Under ₹15K", max: 15000 },
  { label: "₹15K – ₹30K", max: 30000 },
  { label: "₹30K – ₹50K", max: 50000 },
  { label: "₹50K+" },
];

/** 'Uncategorized' is a real internal fallback bucket — never user-facing (same rule
 * the Flutter client's isUserFacingCategory follows). Filter every category list with
 * this before rendering or adding to the sitemap. */
export function isUserFacingCategory(category: CategorySummary): boolean {
  return category.name !== "Uncategorized";
}
