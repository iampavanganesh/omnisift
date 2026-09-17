import type { ReactNode } from "react";
import Link from "next/link";

export function Section({
  title,
  viewAllHref,
  children,
}: {
  title: string;
  viewAllHref?: string;
  children: ReactNode;
}) {
  return (
    <section className="section">
      <div className="section-head">
        <h2>{title}</h2>
        {viewAllHref && <Link href={viewAllHref}>View all →</Link>}
      </div>
      {children}
    </section>
  );
}
