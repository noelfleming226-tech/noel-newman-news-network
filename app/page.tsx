import Link from "next/link";

import { format } from "date-fns";

import { BrandMark } from "@/components/brand-mark";
import { PostCard } from "@/components/post-card";
import { SiteHeader } from "@/components/site-header";
import { getVisiblePosts } from "@/lib/posts";

type VisiblePost = Awaited<ReturnType<typeof getVisiblePosts>>[number];

export default async function HomePage() {
  const posts = await getVisiblePosts();
  const leadPost = posts[0];

  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        <section className="hero">
          <BrandMark />
          <p className="hero__eyebrow">Independent Reporting + Modern Storytelling</p>
          <h1>Noel Newman News Network</h1>
          <p>
            News, analysis, and feature stories from a digital-first newsroom built for mixed media. Publish long-form
            text with embedded YouTube, video, audio, and image storytelling in one continuous experience.
          </p>
          {leadPost ? (
            <Link className="button button--primary" href={`/articles/${leadPost.slug}`}>
              Read Latest: {leadPost.title}
            </Link>
          ) : (
            <p className="hero__empty">No published stories yet. Staff can publish from the portal.</p>
          )}
        </section>

        {leadPost ? (
          <section className="lead-story">
            <p className="lead-story__kicker">Featured Story</p>
            <h2>{leadPost.title}</h2>
            <p>{leadPost.excerpt || "Open the story for full coverage."}</p>
            <p className="lead-story__meta">
              {leadPost.publishedAt ? format(leadPost.publishedAt, "PPPP") : "Date pending"} · {leadPost.author.name}
            </p>
            <Link href={`/articles/${leadPost.slug}`} className="button button--ghost">
              Open Story
            </Link>
          </section>
        ) : null}

        <section className="post-grid" aria-label="Latest articles">
          {posts.slice(leadPost ? 1 : 0).map((post: VisiblePost) => (
            <PostCard key={post.id} post={post} />
          ))}

          {!posts.length ? (
            <article className="post-card post-card--placeholder">
              <div className="post-card__content">
                <h2>Publishing queue is empty</h2>
                <p>Once staff publish or scheduled stories go live, they will appear here automatically.</p>
              </div>
            </article>
          ) : null}
        </section>

        <section id="proprietors" className="proprietors">
          <p className="proprietors__eyebrow">NN^2 Ownership</p>
          <h2>Primary Proprietors</h2>
          <div className="proprietors__grid">
            <article>
              <h3>Noel Fleming</h3>
              <p>Co-proprietor focused on editorial leadership, community coverage, and platform strategy.</p>
            </article>
            <article>
              <h3>Phil Newman</h3>
              <p>Co-proprietor overseeing operations, growth, and multi-format content publishing workflows.</p>
            </article>
          </div>
          <Link className="button button--ghost" href="/staff/login">
            Enter Staff Portal
          </Link>
        </section>
      </main>
      <footer className="site-footer">
        <p>NN^2 · Noel Newman News Network</p>
        <p>Built for multimedia journalism in a modern dark-mode experience.</p>
      </footer>
    </div>
  );
}
