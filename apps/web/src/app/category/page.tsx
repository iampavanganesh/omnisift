import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { apiClient } from "@/lib/api-client";
import { isUserFacingCategory } from "@/lib/catalog-data";
import type { CategorySummary } from "@/lib/types";

// Aggregate, catalog-wide listing — no per-request searchParams, no live
// pricing. ISR is safe here (well inside the 7-day freshness policy); a
// change to the category list shows up within an hour without needing a
// fresh request to force it.
export const revalidate = 3600;
const REVALIDATE_SECONDS = revalidate;

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse every product category on OmniSift.",
};

async function getCategories(): Promise<CategorySummary[]> {
  try {
    const categories = await apiClient.getCached<CategorySummary[]>(
      "/categories",
      REVALIDATE_SECONDS,
    );
    return categories.filter(isUserFacingCategory);
  } catch {
    return [];
  }
}

export default async function CategoryIndexPage() {
  const categories = await getCategories();

  return (
    <div className="index-page">
      <h1>Categories</h1>
      {categories.length > 0 ? (
        <div className="chip-row">
          {categories.map((category) => (
            <Link key={category.slug} href={`/category/${category.slug}`} className="chip">
              {category.name} ({category.productCount})
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState message="Categories will appear here once the catalog has products." />
      )}
    </div>
  );
}
