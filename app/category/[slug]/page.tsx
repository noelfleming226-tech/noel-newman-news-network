import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PostCard } from "@/components/post-card";
import { SiteHeader } from "@/components/site-header";
import { getVisibleCategoryBySlug, getVisiblePostsByCategorySlug } from "@/lib/posts";

type CategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getVisibleCategoryBySlug(slug);

  return {
    title: category ? `${category.name} | Noel Newman News Network` : "Category | Noel Newman News Network",
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getVisibleCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const posts = await getVisiblePostsByCategorySlug(category.slug, 24);

  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        <section className="topic-hero">
          <p className="topic-hero__eyebrow">Category</p>
          <h1>{category.name}</h1>
          <p>Stories filed under {category.name}.</p>
          <div className="topic-hero__links">
            <Link href="/" className="button button--ghost">
              Latest Stories
            </Link>
            <Link href="/search" className="button button--ghost">
              Search
            </Link>
          </div>
        </section>

        {posts.length ? (
          <section className="post-grid" aria-label={`${category.name} posts`}>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </section>
        ) : (
          <section className="empty-state">
            <h2>No published stories yet</h2>
            <p>Posts in this category will appear here after they are published.</p>
          </section>
        )}
      </main>
    </div>
  );
}
