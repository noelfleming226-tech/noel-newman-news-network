import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { FounderBranding } from "@/components/founder-branding";
import { SiteSearchForm } from "@/components/site-search-form";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="brand" href="/">
          <BrandMark compact />
          <span className="brand__name">Noel Newman News Network</span>
        </Link>
        <div className="site-header__founders" aria-label="Noel and Newman branding">
          <FounderBranding mode="chips" compact />
        </div>
        <div className="site-header__search">
          <SiteSearchForm compact />
        </div>
        <nav className="site-nav" aria-label="Main">
          <Link href="/">Latest</Link>
          <a href="#proprietors">Proprietors</a>
          <Link href="/staff/login">Staff Portal</Link>
        </nav>
      </div>
    </header>
  );
}
