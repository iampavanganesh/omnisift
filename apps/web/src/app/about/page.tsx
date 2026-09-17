import type { Metadata } from "next";
import { PlaceholderNotice } from "@/components/placeholder-notice";

export const metadata: Metadata = {
  title: "About",
  description: "About OmniSift.",
};

export default function AboutPage() {
  return (
    <article className="legal-page">
      <h1>About OmniSift</h1>
      <PlaceholderNotice />

      <p>
        OmniSift compares prices for the same product across multiple online stores, so you can
        see the full picture — not just the first price you land on — before you buy.
      </p>
      <p>
        We pull real, current listings from participating stores, track how prices move over
        time, and surface that in one place: a single product page instead of a dozen open tabs.
      </p>

      <h2>Our approach</h2>
      <p>
        Every price shown on OmniSift traces back to a real store listing. We don&apos;t invent
        &quot;original&quot; prices to inflate a discount, and our &quot;good price&quot; and
        &quot;Omni&apos;s Take&quot; signals are computed directly from the prices we&apos;ve
        actually observed — never guessed.
      </p>

      <h2>Contact</h2>
      <p>[Company contact details go here.]</p>
    </article>
  );
}
