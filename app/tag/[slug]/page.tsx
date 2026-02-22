import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PostCard } from "@/components/post-card";
import { SiteHeader } from "@/components/site-header";
import { getVisiblePostsByTagSlug, getVisibleTagBySlug } from "@/lib/posts";

type TagPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getVisibleTagBySlug(slug);

  return {
    title: tag ? `#${tag.name} | Noel Newman News Network` : "Tag | Noel Newman News Network",
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { slug } = await params;
  const tag = await getVisibleTagBySlug(slug);

  if (!tag) {
    notFound();
  }

  const posts = await getVisiblePostsByTagSlug(tag.slug, 24);

  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        <section className="topic-hero">
          <p className="topic-hero__eyebrow">Tag</p>
          <h1>#{tag.name}</h1>
          <p>Stories tagged with {tag.name}.</p>
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
          <section className="post-grid" aria-label={`${tag.name} tagged posts`}>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </section>
        ) : (
          <section className="empty-state">
            <h2>No published stories yet</h2>
            <p>Posts with this tag will appear here after they are published.</p>
          </section>
        )}
      </main>
    </div>
  );
}
