import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="auth-page">
        <section className="auth-card">
          <p className="auth-card__eyebrow">404</p>
          <h1>Story not found</h1>
          <p>The article may still be in draft or not yet published.</p>
          <Link className="button button--primary" href="/">
            Back to Homepage
          </Link>
        </section>
      </main>
    </div>
  );
}
