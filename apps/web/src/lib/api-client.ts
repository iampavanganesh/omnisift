import { env } from "./env";

/**
 * Server-only fetch wrapper — import this from Server Components / route handlers only,
 * never from a "use client" file. `env.apiBaseUrl` is intentionally not NEXT_PUBLIC_-prefixed,
 * so it isn't even available if someone tries to use this from the client.
 *
 * The backend wraps every response as `{ success, data, meta }` (shared/dto/api-response.dto.ts)
 * — `get()` unwraps `.data`; use `getWithMeta()` when a page needs `meta` too (e.g. hasMore).
 *
 * TODO: replace these hand-typed generics with types generated from
 * packages/api-contracts/openapi.yaml. The spec is no longer a placeholder — it now lists
 * all 37 real routes (regenerate with `npm run export:openapi` in apps/backend) — but most
 * operations still have no request/response *schema*, so there is nothing useful to
 * generate types from yet. See packages/api-contracts/README.md.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface Envelope<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
}

/** The actual fetch. Returns the parsed body exactly as the API sent it. */
async function requestRaw<T>(
  path: string,
  init?: RequestInit & { next?: { revalidate?: number } },
): Promise<T> {
  // `cache: "no-store"` and Next's `next.revalidate` are contradictory (one
  // says never cache, the other says cache-with-a-window) — only apply the
  // no-store default when the caller isn't opting into revalidation.
  const cacheOpt = init?.next ? undefined : (init?.cache ?? "no-store");
  const res = await fetch(`${env.apiBaseUrl}${path}`, {
    ...init,
    headers: { Accept: "application/json", ...init?.headers },
    ...(cacheOpt ? { cache: cacheOpt } : {}),
  });

  if (!res.ok) {
    throw new ApiError(res.status, `${path} -> ${res.status}`);
  }

  return res.json() as Promise<T>;
}

/** Same request, typed as the standard envelope every normal route returns. */
function request<T>(
  path: string,
  init?: RequestInit & { next?: { revalidate?: number } },
): Promise<Envelope<T>> {
  return requestRaw<Envelope<T>>(path, init);
}

export const apiClient = {
  get: async <T>(path: string): Promise<T> => (await request<T>(path)).data,
  getWithMeta: <T>(path: string) => request<T>(path),
  /**
   * ISR-friendly variant: lets the route's own `export const revalidate`
   * actually take effect. `cache: "no-store"` (the default above) is itself a
   * Next.js Dynamic API — it forces per-request dynamic rendering regardless
   * of a `revalidate` export, so any page wanting real ISR must opt out of it
   * here instead. Use only for aggregate, non-personalized data (see P1
   * report: category/brand index pages) — never for anything that must
   * reflect a specific user or request.
   */
  getCached: async <T>(path: string, revalidateSeconds: number): Promise<T> =>
    (await request<T>(path, { next: { revalidate: revalidateSeconds } })).data,
  /**
   * Returns the response body AS-IS, with no `.data` unwrapping.
   *
   * Exists for exactly one endpoint: `GET /config` is the only route that does
   * not use the `{ success, data, meta }` envelope — it returns its fields at
   * the top level, and the Flutter client already consumes it that way, so the
   * backend shape is deliberately left alone (see OPENAPI_CONTRACT_REPORT.md
   * §8.1). Calling `get()` on it silently yields `undefined`, because there is
   * no `.data` to read.
   *
   * Do NOT reach for this for normal endpoints — they are enveloped, and `get()`
   * is correct for them.
   */
  getUnwrapped: <T>(path: string): Promise<T> => requestRaw<T>(path),
};
