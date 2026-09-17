import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: "OmniSift — Buy with Confidence.",
    template: "%s | OmniSift",
  },
  description:
    "Compare prices across stores, understand whether a price is actually good, and buy with confidence.",
  openGraph: {
    type: "website",
    siteName: "OmniSift",
    title: "OmniSift — Buy with Confidence.",
    description:
      "Compare prices across stores, understand whether a price is actually good, and buy with confidence.",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "OmniSift — Buy with Confidence.",
    description:
      "Compare prices across stores, understand whether a price is actually good, and buy with confidence.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
