import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="brand" href="/">
          <BrandMark compact />
          <span className="brand__name">Noel Newman News Network</span>
        </Link>
        <nav className="site-nav" aria-label="Main">
          <Link href="/">Latest</Link>
          <a href="#proprietors">Proprietors</a>
          <Link href="/staff/login">Staff Portal</Link>
        </nav>
      </div>
    </header>
  );
}
