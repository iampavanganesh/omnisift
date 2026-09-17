import type { NextConfig } from "next";
import path from "path";

// next.config.ts runs at build time in plain Node — reading process.env directly here
// (not via src/lib/env.ts, which is for app runtime code) with the same fallback used
// there, so the CSP's connect-src matches whatever API origin the build is using.
// The authenticated app (env.appUrl) only ever gets a plain <a href> navigation, never
// fetch/XHR from this app, so it doesn't need to be in connect-src.
const apiOrigin = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
const isDev = process.env.NODE_ENV === "development";

// script-src allows 'unsafe-inline' rather than a nonce: Next.js injects inline
// hydration/RSC-payload scripts on every page, and a strict nonce-based CSP requires
// forcing ALL routes to dynamic rendering (no SSG) to inject one — including /category,
// /brand, and /guides, which don't need to be dynamic. Worth it for an app with a real
// HTML-injection surface; this one has none (no dangerouslySetInnerHTML anywhere — every
// dynamic value renders through JSX's auto-escaping), so CSP here is defense-in-depth on
// top of that, not the only thing stopping injected markup from executing. Revisit with
// a proxy.ts nonce (see Next's content-security-policy guide) if that ever changes —
// e.g. user-generated content or third-party script embeds.
const csp = [
  "default-src 'self'",
  // 'unsafe-eval' only in dev: React's dev-mode stack-trace reconstruction uses eval();
  // per Next's own CSP guide, production never needs it.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // Broad on purpose: product images come from whichever seller/provider CDN a given
  // listing happens to use (Supabase storage, Google Shopping thumbnails, etc.) — no
  // fixed allowlist is possible without breaking images every time a new source shows up.
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigin}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  // Don't advertise the framework unnecessarily.
  poweredByHeader: false,
  // apps/web isn't an npm workspace member (each app in this monorepo has its own
  // independent package.json/lockfile) — pin the root so Turbopack doesn't guess wrong
  // from the repo-root lockfile.
  //
  // Uses process.cwd() rather than __dirname: Next compiles this config to either
  // CommonJS or ESM depending on the resolved dependency tree, and `__dirname` is
  // undefined in the ESM case ("__dirname is not defined in ES module scope").
  // process.cwd() is valid in both, and every entry point that loads this config
  // (`npm run dev`, `npm run build`, `npm start`) runs with the app directory as cwd.
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  // Every image field actually rendered through next/image traces back to
  // Product.primaryImageUrl / Product.images — which the backend always
  // re-hosts to Supabase storage before saving (ImageStorageService), with
  // the pre-rehost SerpAPI/Google-Shopping thumbnail (gstatic.com) as the
  // only fallback if that re-host ever fails. One confirmed exception: the
  // Deals feed's image can fall back to a raw, never-rehosted per-listing
  // thumbnail (prisma-deals.repository.ts) that isn't guaranteed to be
  // either domain — ProductCard renders that one `unoptimized` (see
  // deals/page.tsx) specifically so it never depends on this allowlist.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.gstatic.com" },
    ],
  },

  // Security headers (ADR-0003's web security plan). apps/web is a public, unauthenticated
  // surface — no cookies, no session, bearer tokens only live in the Flutter app — so
  // there's deliberately no CSRF middleware here: there's nothing session-based to forge.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
