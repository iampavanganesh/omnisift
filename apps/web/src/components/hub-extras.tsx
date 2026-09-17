import Link from "next/link";
import { Section } from "./section";
import { BUDGET_BANDS } from "@/lib/catalog-data";

/** Shared by category/brand/brand×category hub pages — the one part of each
 * that really is identical, unlike the cross-reference sections above it. */
export function BudgetChips({ searchHref }: { searchHref: string }) {
  return (
    <Section title="Shop by budget">
      <div className="chip-row">
        {BUDGET_BANDS.map((band) => (
          <Link
            key={band.label}
            href={band.max ? `${searchHref}&maxPrice=${band.max}` : searchHref}
            className="chip"
          >
            {band.label}
          </Link>
        ))}
      </div>
    </Section>
  );
}
