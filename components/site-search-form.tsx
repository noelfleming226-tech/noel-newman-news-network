export function SiteSearchForm({ compact = false }: { compact?: boolean }) {
  return (
    <form action="/search" method="get" className={`site-search ${compact ? "site-search--compact" : ""}`} role="search">
      <input
        type="search"
        name="q"
        placeholder="Search articles, tags, categories"
        minLength={2}
        aria-label="Search stories"
      />
      <button type="submit">Search</button>
    </form>
  );
}
