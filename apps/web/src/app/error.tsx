"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="status-page">
      <p className="status-code">Error</p>
      <h1>Something went wrong</h1>
      <p className="hub-subtitle">
        This page hit an unexpected error. Try again, or head back home.
      </p>
      <div className="status-actions">
        <button type="button" className="button-primary" onClick={() => retry()}>
          Try again
        </button>
        <Link href="/" className="button-secondary">
          Back to home
        </Link>
      </div>
    </div>
  );
}
