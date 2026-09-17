import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { apiClient } from "@/lib/api-client";
import type { BrandSummary } from "@/lib/types";

// Aggregate, catalog-wide listing — no per-request searchParams, no live
// pricing. ISR is safe here (well inside the 7-day freshness policy); a
// change to the brand list shows up within an hour without needing a
// fresh request to force it.
export const revalidate = 3600;
const REVALIDATE_SECONDS = revalidate;

export const metadata: Metadata = {
  title: "Brands",
  description: "Browse every brand available on OmniSift.",
};

async function getBrands(): Promise<BrandSummary[]> {
  try {
    return await apiClient.getCached<BrandSummary[]>("/brands", REVALIDATE_SECONDS);
  } catch {
    return [];
  }
}

export default async function BrandIndexPage() {
  const brands = await getBrands();

  return (
    <div className="index-page">
      <h1>Brands</h1>
      {brands.length > 0 ? (
        <div className="chip-row">
          {brands.map((brand) => (
            <Link key={brand.slug} href={`/brand/${brand.slug}`} className="chip">
              {brand.name} ({brand.productCount})
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState message="Brands will appear here once the catalog has products." />
      )}
    </div>
  );
}
