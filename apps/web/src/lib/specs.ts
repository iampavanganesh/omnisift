/**
 * Real, data-driven spec-facet filters — "key1:val1|val2,key2:val3" in the
 * `specs` query param, mirroring the backend's encoding (see
 * apps/backend/src/modules/products/presentation/validators/catalog-detail.schemas.ts).
 * OR within one key's values, AND across different keys.
 */
export function parseSpecs(raw?: string): Record<string, string[]> {
  if (!raw) return {};
  const result: Record<string, string[]> = {};
  for (const group of raw.split(",")) {
    const idx = group.indexOf(":");
    if (idx === -1) continue;
    const key = group.slice(0, idx);
    const values = group
      .slice(idx + 1)
      .split("|")
      .filter(Boolean);
    if (key && values.length) result[key] = values;
  }
  return result;
}

export function encodeSpecs(specs: Record<string, string[]>): string {
  return Object.entries(specs)
    .filter(([, values]) => values.length > 0)
    .map(([key, values]) => `${key}:${values.join("|")}`)
    .join(",");
}

/** Returns the specs map with `value` toggled on/off for `key`. */
export function toggleSpec(
  specs: Record<string, string[]>,
  key: string,
  value: string,
): Record<string, string[]> {
  const current = specs[key] ?? [];
  const next = current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];
  const result = { ...specs };
  if (next.length > 0) result[key] = next;
  else delete result[key];
  return result;
}
