import Link from "next/link";
import { encodeSpecs, toggleSpec } from "@/lib/specs";
import type { CategoryFacet } from "@/lib/types";

/** Real, data-driven filter facets for a category — whatever spec keys/values
 * actually repeat across its real products right now (see
 * PrismaCategoryQueryRepository.getFacets). Never a hardcoded taxonomy: a
 * thin category with too few real products simply passes an empty list here
 * and this renders nothing. Server-rendered toggle links, no client JS —
 * each chip is a plain URL with that value added/removed from `specs`. */
export function SpecFacetChips({
  facets,
  currentSpecs,
  baseHref,
}: {
  facets: CategoryFacet[];
  currentSpecs: Record<string, string[]>;
  baseHref: string;
}) {
  if (facets.length === 0) return null;

  return (
    <div className="spec-facets">
      {facets.map((facet) => (
        <div key={facet.key} className="spec-facet-group">
          <p className="spec-facet-label">{facet.key}</p>
          <div className="chip-row">
            {facet.values.map((v) => {
              const selected = (currentSpecs[facet.key] ?? []).includes(v.value);
              const nextSpecs = toggleSpec(currentSpecs, facet.key, v.value);
              const specsStr = encodeSpecs(nextSpecs);
              const href = specsStr ? `${baseHref}?specs=${encodeURIComponent(specsStr)}` : baseHref;
              return (
                <Link
                  key={v.value}
                  href={href}
                  className={selected ? "chip chip-active" : "chip"}
                >
                  {v.value} ({v.count})
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
