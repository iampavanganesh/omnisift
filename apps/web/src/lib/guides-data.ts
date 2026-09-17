/**
 * Guides are editorial content, not catalog data — there's no `Guide` table in the
 * schema and there doesn't need to be one yet. A local fixture is the right amount of
 * infrastructure for one launch guide; move to a CMS/MDX pipeline only once there are
 * enough of these to make hand-editing this file painful.
 */
export interface Guide {
  slug: string;
  title: string;
  description: string;
  updated: string; // ISO date
  picks: Array<{ label: string; product: string }>;
}

// No guides published yet — the one placeholder ("Coming soon" picks with no real
// recommendation behind them) was removed rather than shipped empty. Add real
// entries here once there's actual editorial judgment to back the picks; the
// index/detail pages and nav links pick guides up automatically once this isn't empty.
export const GUIDES: Guide[] = [];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}
