"use client";

import Link from "next/link";
import { useState } from "react";
import { SearchBar } from "./search-bar";
import { env } from "@/lib/env";
import { GUIDES } from "@/lib/guides-data";

const NAV_LINKS = [
  { href: "/category", label: "Categories" },
  { href: "/brand", label: "Brands" },
  { href: "/deals", label: "Deals" },
  { href: "/trending", label: "Trending" },
  // Only a real nav destination once there's at least one published guide.
  ...(GUIDES.length > 0 ? [{ href: "/guides", label: "Guides" }] : []),
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="site-header-row">
        <Link href="/" className="wordmark">
          {/* eslint-disable-next-line @next/next/no-img-element -- static brand SVG, no need for next/image */}
          <img src="/logo-mark.svg" alt="" width={28} height={28} className="wordmark-icon" />
          OmniSift
        </Link>

        <SearchBar formClassName="header-search" />

        <nav className="header-nav header-nav-desktop">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <a href={`${env.appUrl}/wishlist`} className="header-icon-link">
            Wishlist
          </a>
          <a href={env.appUrl} className="button-primary button-small">
            Sign in
          </a>
          <button
            type="button"
            className="header-menu-toggle"
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            ☰
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="header-nav-mobile" aria-label="Mobile">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
          {/* Wishlist text link is hidden from the row below 768px (see globals.css)
              to stop the header overflowing on phones — still reachable here. */}
          <a href={`${env.appUrl}/wishlist`} className="header-nav-mobile-wishlist">
            Wishlist
          </a>
        </nav>
      )}
    </header>
  );
}
