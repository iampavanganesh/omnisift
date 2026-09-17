import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** next/og renders via Satori in an isolated context that can't resolve the
 * app's real CSS custom properties (globals.css), so the brand hex values are
 * duplicated here literally. Keep these numerically identical to
 * --color-brand / --color-accent / --color-bg in globals.css if that palette
 * ever changes — globals.css remains the single source of truth. */
const BRAND = "#3b2314"; // --color-brand
const ACCENT = "#e3a73a"; // --color-accent
const BG = "#ffffff"; // --color-bg

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND,
          color: BG,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              display: "flex",
              width: 96,
              height: 96,
              borderRadius: 24,
              background: ACCENT,
              color: BRAND,
              fontSize: 56,
              fontWeight: 700,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            O
          </div>
          <div style={{ fontSize: 88, fontWeight: 700 }}>OmniSift</div>
        </div>
        <div style={{ marginTop: 28, fontSize: 36, color: ACCENT }}>Buy with Confidence.</div>
      </div>
    ),
    { ...size },
  );
}
