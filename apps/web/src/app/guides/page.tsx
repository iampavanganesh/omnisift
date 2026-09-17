import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { GUIDES } from "@/lib/guides-data";

export const metadata: Metadata = {
  title: "Buying Guides",
  description: "OmniSift's buying guides — what to look for and what we'd actually pick.",
};

export default function GuidesIndexPage() {
  return (
    <div className="index-page">
      <h1>Buying Guides</h1>
      {GUIDES.length > 0 ? (
        <div className="guide-list">
          {GUIDES.map((guide) => (
            <Link key={guide.slug} href={`/guides/${guide.slug}`} className="guide-card">
              <h2>{guide.title}</h2>
              <p>{guide.description}</p>
              <p className="guide-updated">Updated {guide.updated}</p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState message="No buying guides published yet — check back soon." />
      )}
    </div>
  );
}
