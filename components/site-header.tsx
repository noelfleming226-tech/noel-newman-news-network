import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="brand" href="/">
          <span className="brand__eyebrow">NNNN</span>
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
