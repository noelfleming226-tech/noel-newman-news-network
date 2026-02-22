import Link from "next/link";

import { PostCard } from "@/components/post-card";
import { SiteHeader } from "@/components/site-header";
import { SiteSearchForm } from "@/components/site-search-form";
import { searchVisiblePosts } from "@/lib/posts";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    page?: string | string[];
  }>;
};

function getSingleValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export const metadata = {
  title: "Search | Noel Newman News Network",
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = getSingleValue(params.q).trim();
  const page = Number.parseInt(getSingleValue(params.page), 10) || 1;
  const result = await searchVisiblePosts(query, page, 12);
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  const prevHref = `/search?q=${encodeURIComponent(query)}&page=${Math.max(1, result.page - 1)}`;
  const nextHref = `/search?q=${encodeURIComponent(query)}&page=${Math.min(totalPages, result.page + 1)}`;

  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        <section className="topic-hero">
          <p className="topic-hero__eyebrow">NN^2 Search</p>
          <h1>Search the Network</h1>
          <p>Search article headlines, text, categories, and tags.</p>
          <div className="topic-hero__search">
            <SiteSearchForm />
          </div>
          {query ? (
            <p className="topic-hero__meta">
              {result.total} result{result.total === 1 ? "" : "s"} for “{query}”
            </p>
          ) : (
            <p className="topic-hero__meta">Enter at least 2 characters to search.</p>
          )}
        </section>

        {query && result.items.length ? (
          <>
            <section className="post-grid" aria-label="Search results">
              {result.items.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </section>

            {totalPages > 1 ? (
              <nav className="pager" aria-label="Search result pages">
                <Link
                  className={`button button--ghost ${result.page <= 1 ? "button--disabled" : ""}`}
                  href={prevHref}
                  aria-disabled={result.page <= 1}
                >
                  Previous
                </Link>
                <p className="pager__label">
                  Page {result.page} of {totalPages}
                </p>
                <Link
                  className={`button button--ghost ${result.page >= totalPages ? "button--disabled" : ""}`}
                  href={nextHref}
                  aria-disabled={result.page >= totalPages}
                >
                  Next
                </Link>
              </nav>
            ) : null}
          </>
        ) : query.length >= 2 ? (
          <section className="empty-state">
            <h2>No results found</h2>
            <p>Try broader terms, category names, or tag keywords.</p>
          </section>
        ) : null}
      </main>
    </div>
  );
}
