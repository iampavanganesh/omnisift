import Link from "next/link";
import { BrandMark } from "./brand-mark";
import type { BrandRef } from "@/lib/types";

/** Grid of tappable brand-logo cards. Real logoUrl when the DB has one; a
 * plain initial-letter tile otherwise — never a fabricated logo. */
export function BrandLogoGrid({
  brands,
  categorySlug,
}: {
  brands: BrandRef[];
  categorySlug: string;
}) {
  return (
    <div className="brand-logo-grid">
      {brands.map((brand) => (
        <Link key={brand.slug} href={`/brand/${brand.slug}/${categorySlug}`} className="brand-logo-card">
          <BrandMark name={brand.name} logoUrl={brand.logoUrl} size={48} />
          <span className="brand-logo-card-name">{brand.name}</span>
          <span className="brand-logo-card-count">
            {brand.productCount} product{brand.productCount === 1 ? "" : "s"}
          </span>
        </Link>
      ))}
    </div>
  );
}
