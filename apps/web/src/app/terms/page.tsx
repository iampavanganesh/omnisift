import type { Metadata } from "next";
import { PlaceholderNotice } from "@/components/placeholder-notice";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "OmniSift's terms of service.",
  robots: { index: false, follow: true },
};

export default function TermsPage() {
  return (
    <article className="legal-page">
      <h1>Terms of Service</h1>
      <PlaceholderNotice />
      <p className="legal-updated">Last updated: [date]</p>

      <p>
        These Terms govern your use of omnisift.com and OmniSift&apos;s apps, operated by
        [Company Legal Name] (&quot;OmniSift&quot;, &quot;we&quot;, &quot;us&quot;). By using
        OmniSift, you agree to these Terms.
      </p>

      <h2>The service</h2>
      <p>
        OmniSift compares prices for products across participating stores and, where you opt in,
        sends price-drop alerts. We are not the seller of any product shown — every purchase is
        made directly with the store you&apos;re redirected to, under that store&apos;s own terms.
      </p>

      <h2>Accounts</h2>
      <p>
        You&apos;re responsible for keeping your account credentials secure and for activity
        under your account. [Add any age requirement, account termination conditions, etc.]
      </p>

      <h2>Accuracy of prices and listings</h2>
      <p>
        We work to keep prices current, but a store&apos;s actual price, stock, and availability
        can change between when we last observed it and when you visit — always confirm on the
        store&apos;s own page before purchasing.
      </p>

      <h2>Affiliate links</h2>
      <p>
        Some links to partner stores are affiliate links — see our{" "}
        <a href="/affiliate-disclosure">Affiliate Disclosure</a>.
      </p>

      <h2>Limitation of liability</h2>
      <p>[Standard limitation-of-liability language, reviewed for your jurisdiction, goes here.]</p>

      <h2>Changes to these Terms</h2>
      <p>[Describe how and when Terms may change, and how users will be notified.]</p>

      <h2>Governing law</h2>
      <p>[Jurisdiction / governing law goes here.]</p>

      <h2>Contact</h2>
      <p>[Legal contact email goes here.]</p>
    </article>
  );
}
