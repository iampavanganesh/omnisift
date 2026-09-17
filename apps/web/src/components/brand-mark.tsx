import Image from "next/image";

/** Real logoUrl when the DB has one; a plain initial-letter tile otherwise —
 * never a fabricated logo. Shared by the brand grid cards and the brand
 * hero (different sizes, same rule). */
export function BrandMark({
  name,
  logoUrl,
  size = 48,
}: {
  name: string;
  logoUrl: string | null;
  size?: number;
}) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt=""
        width={size}
        height={size}
        className="brand-mark"
        style={{ width: size, height: size }}
        // No brand currently has a real logoUrl, so there's no live evidence
        // of which CDN a future one would come from (unlike product images,
        // never traced to a guaranteed-rehosted field) — skip the optimizer
        // rather than risk an unlisted domain breaking every brand tile.
        unoptimized
      />
    );
  }
  return (
    <div
      className="brand-mark brand-mark-initial"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
