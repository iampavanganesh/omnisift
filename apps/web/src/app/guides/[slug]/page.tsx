import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GUIDES, getGuide } from "@/lib/guides-data";

// Guides are a small, fully-known local list (see lib/guides-data.ts) — unlike
// categories/brands/products, a 404 here is real and generateStaticParams is safe.
export function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};
  return { title: guide.title, description: guide.description };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  return (
    <article className="guide-page">
      <p className="eyebrow">Updated {guide.updated}</p>
      <h1>{guide.title}</h1>
      <p className="hub-subtitle">{guide.description}</p>

      <div className="guide-picks">
        {guide.picks.map((pick) => (
          <div key={pick.label} className="guide-pick">
            <p className="guide-pick-label">{pick.label}</p>
            <p className="guide-pick-product">{pick.product}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
