import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { apiClient } from "@/lib/api-client";
import { GUIDES } from "@/lib/guides-data";
import { isUserFacingCategory } from "@/lib/catalog-data";
import type { BrandSummary, CategoryDetail, CategorySummary } from "@/lib/types";

async function getCategories(): Promise<CategorySummary[]> {
  try {
    const categories = await apiClient.get<CategorySummary[]>("/categories");
    return categories.filter(isUserFacingCategory);
  } catch {
    return [];
  }
}

async function getBrands(): Promise<BrandSummary[]> {
  try {
    return await apiClient.get<BrandSummary[]>("/brands");
  } catch {
    return [];
  }
}

/** 50 (the real backend pageSize ceiling) covers every category today — this
 * catalog is small enough that one page per category is exact, not a sample. */
async function getCategoryDetail(slug: string): Promise<CategoryDetail | null> {
  try {
    return await apiClient.get<CategoryDetail>(`/categories/${slug}?pageSize=50`);
  } catch {
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, brands] = await Promise.all([getCategories(), getBrands()]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: env.siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${env.siteUrl}/category`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${env.siteUrl}/brand`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${env.siteUrl}/deals`, changeFrequency: "daily", priority: 0.7 },
    { url: `${env.siteUrl}/trending`, changeFrequency: "daily", priority: 0.7 },
    // Only worth indexing once there's at least one published guide.
    ...(GUIDES.length > 0
      ? [{ url: `${env.siteUrl}/guides`, changeFrequency: "weekly" as const, priority: 0.6 }]
      : []),
    { url: `${env.siteUrl}/about`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${env.siteUrl}/category/${category.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const brandRoutes: MetadataRoute.Sitemap = brands.map((brand) => ({
    url: `${env.siteUrl}/brand/${brand.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const guideRoutes: MetadataRoute.Sitemap = GUIDES.map((guide) => ({
    url: `${env.siteUrl}/guides/${guide.slug}`,
    lastModified: guide.updated,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  // Product and brand×category routes — derived from each category's own real
  // detail response (the same data powering /category/[slug] and
  // /brand/[brand]/[category]), not a separate bulk endpoint or guessed URLs.
  // Catalog is small today (well under generateSitemaps()'s multi-file territory
  // — revisit that only if this ever grows into the thousands of URLs).
  const categoryDetails = await Promise.all(categories.map((c) => getCategoryDetail(c.slug)));

  const seenProductSlugs = new Set<string>();
  const productRoutes: MetadataRoute.Sitemap = [];
  const seenBrandCategoryPairs = new Set<string>();
  const brandCategoryRoutes: MetadataRoute.Sitemap = [];

  for (const detail of categoryDetails) {
    if (!detail) continue;
    for (const product of detail.products) {
      if (seenProductSlugs.has(product.slug)) continue;
      seenProductSlugs.add(product.slug);
      productRoutes.push({
        url: `${env.siteUrl}/product/${product.slug}`,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
    for (const brand of detail.brandsInCategory) {
      const key = `${brand.slug}/${detail.category.slug}`;
      if (seenBrandCategoryPairs.has(key)) continue;
      seenBrandCategoryPairs.add(key);
      brandCategoryRoutes.push({
        url: `${env.siteUrl}/brand/${brand.slug}/${detail.category.slug}`,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
  }

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...brandRoutes,
    ...guideRoutes,
    ...productRoutes,
    ...brandCategoryRoutes,
  ];
}
