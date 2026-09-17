import Image from "next/image";
import Link from "next/link";
import { env } from "@/lib/env";
import { GUIDES } from "@/lib/guides-data";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-grid">
        <div>
          <Image
            src="/logo-full.png"
            alt="OmniSift — All shops. One view."
            width={180}
            height={180}
            className="footer-logo"
          />
          <p className="footer-tagline">Buy with Confidence.</p>
        </div>

        <div>
          <p className="footer-heading">Shop</p>
          <Link href="/category">Categories</Link>
          <Link href="/brand">Brands</Link>
          <Link href="/deals">Deals</Link>
          <Link href="/trending">Trending</Link>
          {/* Only a real destination once there's at least one published guide. */}
          {GUIDES.length > 0 && <Link href="/guides">Buying guides</Link>}
        </div>

        <div>
          <p className="footer-heading">Account</p>
          <a href={env.appUrl}>Sign in</a>
          <a href={`${env.appUrl}/wishlist`}>Wishlist</a>
          <a href={`${env.appUrl}/alerts`}>Price alerts</a>
          <a href={`${env.appUrl}/compare`}>Compare</a>
        </div>

        <div>
          <p className="footer-heading">Company</p>
          <Link href="/about">About</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/affiliate-disclosure">Affiliate Disclosure</Link>
        </div>
      </div>

      <p className="footer-copy">© {new Date().getFullYear()} OmniSift</p>
    </footer>
  );
}
