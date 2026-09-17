import Image from "next/image";
import Link from "next/link";
import { formatInr } from "@/lib/format";

export function ProductCard({
  href,
  title,
  imageUrl,
  price,
  isGoodPrice,
  meta,
  unoptimizedImage,
}: {
  /** Omit when the product has no canonical slug yet (e.g. raw search results,
   * pre-catalog) — renders a non-clickable card instead of a broken link. */
  href?: string;
  title: string;
  imageUrl: string | null;
  price: number | null;
  isGoodPrice?: boolean;
  meta?: string;
  /** Set when imageUrl can't be guaranteed to come from an allow-listed CDN
   * (currently only the Deals feed, whose image can fall back to a raw,
   * never-rehosted per-listing thumbnail — see next.config.ts) — skips
   * next/image's optimizer so an unlisted domain can never break the image. */
  unoptimizedImage?: boolean;
}) {
  const content = (
    <>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          width={300}
          height={300}
          sizes="(max-width: 640px) 40vw, 200px"
          className="product-card-image"
          unoptimized={unoptimizedImage}
        />
      ) : (
        <div className="product-card-image" aria-hidden />
      )}
      <h3 className="product-card-name">{title}</h3>
      <p className="product-card-price">
        {price != null ? formatInr(price) : "Price unavailable"}
        {isGoodPrice && <span className="badge-good">Good price</span>}
      </p>
      {meta && <p className="product-card-rating">{meta}</p>}
    </>
  );

  if (!href) {
    return <div className="product-card product-card-static">{content}</div>;
  }

  return (
    <Link href={href} className="product-card">
      {content}
    </Link>
  );
}
