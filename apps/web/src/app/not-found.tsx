import Link from "next/link";

export default function NotFound() {
  return (
    <div className="status-page">
      <p className="status-code">404</p>
      <h1>We couldn&apos;t find that page</h1>
      <p className="hub-subtitle">
        The link might be broken, or the page may have moved.
      </p>
      <div className="status-actions">
        <Link href="/" className="button-primary">
          Back to home
        </Link>
        <Link href="/category" className="button-secondary">
          Browse categories
        </Link>
      </div>
    </div>
  );
}
