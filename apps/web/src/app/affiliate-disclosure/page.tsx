import type { Metadata } from "next";
import { PlaceholderNotice } from "@/components/placeholder-notice";

export const metadata: Metadata = {
  title: "Affiliate Disclosure",
  description: "How OmniSift makes money from links to partner stores.",
  robots: { index: false, follow: true },
};

export default function AffiliateDisclosurePage() {
  return (
    <article className="legal-page">
      <h1>Affiliate Disclosure</h1>
      <PlaceholderNotice />

      <p>
        When you tap &quot;Visit&quot; on a seller listing, OmniSift routes you through our own
        redirect link on the way to that store. For some stores, this link is an affiliate link:
        if you go on to make a purchase, OmniSift may earn a commission from the store.
      </p>

      <h2>This never changes your price</h2>
      <p>
        Using an affiliate link doesn&apos;t cost you anything extra — the price you pay is set by
        the store, identical to visiting them directly. It&apos;s how we keep price comparison
        free to use.
      </p>

      <h2>It never changes what we show you</h2>
      <p>
        Whether a store pays an affiliate commission has no bearing on how OmniSift ranks or
        labels its prices — &quot;lowest price&quot;, &quot;good price&quot;, and every other
        signal on OmniSift are computed the same way from the same observed prices, regardless of
        affiliate relationship. [Confirm/expand this if that ever changes.]
      </p>

      <h2>Which stores</h2>
      <p>
        [List current affiliate partners here, or state that it varies by store and product and
        may change over time.]
      </p>

      <h2>Questions</h2>
      <p>[Contact email goes here.]</p>
    </article>
  );
}
