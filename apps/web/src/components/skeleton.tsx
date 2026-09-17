/** Content-shaped loading placeholders — never a full-page spinner for a
 * section that already knows its own final shape. Pure server components
 * (no client JS); the pulse is a CSS animation only. */

export function SkeletonProductCard() {
  return (
    <div className="product-card skeleton-card" aria-hidden>
      <div className="skeleton-block product-card-image" />
      <div className="skeleton-line" style={{ width: "90%" }} />
      <div className="skeleton-line" style={{ width: "60%" }} />
      <div className="skeleton-line" style={{ width: "40%", height: "0.8em" }} />
    </div>
  );
}

export function SkeletonProductRail({ count = 6 }: { count?: number }) {
  return (
    <div className="product-rail" aria-label="Loading" role="status">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="product-rail-item">
          <SkeletonProductCard />
        </div>
      ))}
    </div>
  );
}

export function SkeletonProductGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="product-grid" aria-label="Loading" role="status">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonProductCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonChipRow({ count = 10 }: { count?: number }) {
  return (
    <div className="chip-row" aria-label="Loading" role="status">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-chip" style={{ width: 70 + ((i * 17) % 50) }} />
      ))}
    </div>
  );
}
