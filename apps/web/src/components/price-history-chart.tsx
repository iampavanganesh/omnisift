import { formatInr } from "@/lib/format";
import type { PricePoint } from "@/lib/types";

const WIDTH = 640;
const HEIGHT = 220;
const PADDING = { top: 16, right: 16, bottom: 12, left: 64 };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** Server-rendered SVG line chart of the real daily "lowest price" snapshot —
 * no client JS, no charting library (today's data is a handful of points at
 * most, nowhere near enough to justify one). Only ever called with real,
 * already-fetched points; renders nothing implied that isn't in the array. */
export function PriceHistoryChart({ points }: { points: PricePoint[] }) {
  if (points.length === 0) return null;

  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const prices = points.map((p) => p.lowest);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1; // flat line: avoid div-by-zero

  const times = points.map((p) => new Date(p.capturedAt).getTime());
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const timeRange = maxTime - minTime || 1;

  const coords = points.map((p) => {
    const t = new Date(p.capturedAt).getTime();
    const x =
      PADDING.left + (points.length === 1 ? plotWidth / 2 : ((t - minTime) / timeRange) * plotWidth);
    const y = PADDING.top + plotHeight - ((p.lowest - minPrice) / priceRange) * plotHeight;
    return { x, y };
  });

  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  const baselineY = PADDING.top + plotHeight;

  return (
    <div className="price-history-chart">
      <p className="price-history-summary">
        Lowest recorded: <strong>{formatInr(minPrice)}</strong>
        {points.length > 1 && (
          <>
            {" · "}
            {formatDate(points[0].capturedAt)} – {formatDate(points[points.length - 1].capturedAt)}
          </>
        )}
      </p>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Price history chart. Lowest price ranged from ${formatInr(minPrice)} to ${formatInr(maxPrice)} across ${points.length} recorded day${points.length === 1 ? "" : "s"}.`}
        className="price-history-svg"
      >
        <line x1={PADDING.left} y1={baselineY} x2={WIDTH - PADDING.right} y2={baselineY} className="price-history-axis" />
        <text x={PADDING.left - 8} y={PADDING.top + 4} textAnchor="end" className="price-history-axis-label">
          {formatInr(maxPrice)}
        </text>
        <text x={PADDING.left - 8} y={baselineY} textAnchor="end" className="price-history-axis-label">
          {formatInr(minPrice)}
        </text>
        {points.length > 1 && <path d={path} className="price-history-line" fill="none" />}
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={3.5} className="price-history-dot" />
        ))}
      </svg>
    </div>
  );
}
