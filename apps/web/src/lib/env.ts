/**
 * Central env access. Two API URLs on purpose:
 * - `apiBaseUrl` is server-only (no NEXT_PUBLIC_ prefix) — used for SSR data fetching in
 *   Server Components. It never reaches the browser bundle.
 * - `publicApiUrl` is safe to put directly into an href (e.g. affiliate redirect links)
 *   because the browser has to hit it directly.
 *
 * This app never talks to Supabase and never receives a service-role key (ADR-0003) —
 * everything goes through the backend API.
 */
export const env = {
  apiBaseUrl: process.env.API_BASE_URL ?? "http://localhost:3000/api/v1",
  publicApiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1",
  // The authenticated app surface (Flutter Web/Android). Wishlist, alerts, account,
  // compare, and the Omni chat adviser all live there, not in this app (ADR-0003).
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:8080",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001",
};
