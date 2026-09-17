import { apiClient } from "@/lib/api-client";
import type { RuntimeConfig } from "@/lib/types";

/**
 * Reads the backend's public runtime flags (`GET /config`).
 *
 * `/config` is the one endpoint that does NOT use the `{ success, data, meta }`
 * envelope — it returns `{ maxApiCalls, priceGraphEnabled }` at the top level.
 * The Flutter client already reads it that way, so the backend shape is
 * deliberately unchanged; the web client is what had to adapt. Using the normal
 * `apiClient.get()` here resolved to `undefined` (no `.data` to unwrap), which
 * silently made `priceGraphEnabled` always falsy and kept the price-history
 * chart hidden regardless of the real flag.
 *
 * Lives in `src/lib/` rather than inside the page because Next validates
 * page-file exports, so a page cannot export a helper for tests to import.
 *
 * Returns `null` when the call fails, so a config outage degrades to
 * "features off" instead of breaking the page.
 */
export async function getRuntimeConfig(): Promise<RuntimeConfig | null> {
  try {
    return await apiClient.getUnwrapped<RuntimeConfig>("/config");
  } catch {
    return null;
  }
}
