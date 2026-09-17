import type { Metadata } from "next";
import { PlaceholderNotice } from "@/components/placeholder-notice";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "OmniSift's privacy policy.",
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <article className="legal-page">
      <h1>Privacy Policy</h1>
      <PlaceholderNotice />
      <p className="legal-updated">Last updated: [date]</p>

      <p>
        This Privacy Policy explains what information [Company Legal Name] (&quot;OmniSift&quot;,
        &quot;we&quot;, &quot;us&quot;) collects when you use omnisift.com and our apps, and how
        we use it.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>Account information you provide (email, name) when you sign up.</li>
        <li>
          Usage data — searches, products viewed, wishlist and price-alert activity — used to
          operate the comparison and alert features.
        </li>
        <li>Device information for push notifications (device token, platform).</li>
        <li>[Add any analytics/advertising data collected, and by which providers.]</li>
      </ul>

      <h2>How we use it</h2>
      <p>
        To operate the service (price comparisons, wishlist, price-drop alerts), to communicate
        with you about your account and alerts, and [add any other real uses — analytics,
        product improvement, marketing].
      </p>

      <h2>Third parties</h2>
      <p>
        We use third-party services to operate OmniSift, including [list real providers — e.g.
        Supabase for data storage, Firebase for push notifications, your search/pricing data
        provider]. Purchases you make happen on the partner store&apos;s own site, under their own
        privacy policy — see our{" "}
        <a href="/affiliate-disclosure">Affiliate Disclosure</a>.
      </p>

      <h2>Your rights</h2>
      <p>
        [Describe applicable rights — access, correction, deletion, portability — and how a user
        can exercise them, based on the jurisdictions OmniSift actually operates in.]
      </p>

      <h2>Contact</h2>
      <p>[Privacy contact email / DPO details go here.]</p>
    </article>
  );
}
