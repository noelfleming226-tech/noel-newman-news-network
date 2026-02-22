/* eslint-disable @next/next/no-img-element */

import { format } from "date-fns";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { MediaRenderer } from "@/components/media-renderer";
import { SiteHeader } from "@/components/site-header";
import { FounderBranding } from "@/components/founder-branding";
import { getVisiblePostBySlug } from "@/lib/posts";

const COVER_HEIGHT_BY_SIZE = {
  COMPACT: 220,
  STANDARD: 300,
  FEATURE: 380,
} as const;

const COVER_OBJECT_POSITION_BY_ALIGNMENT = {
  TOP: "center top",
  CENTER: "center center",
  BOTTOM: "center bottom",
} as const;

type ArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getVisiblePostBySlug(slug);

  if (!post) {
    return {
      title: "Story Not Found | Noel Newman News Network",
    };
  }

  return {
    title: `${post.title} | Noel Newman News Network`,
    description: post.excerpt ?? "Read this story on Noel Newman News Network.",
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const post = await getVisiblePostBySlug(slug);

  if (!post) {
    notFound();
  }

  const coverSize = post.coverImageSize ?? "COMPACT";
  const coverAlignment = post.coverImagePosition ?? "CENTER";
  const coverHeight =
    post.coverImageHeight ?? COVER_HEIGHT_BY_SIZE[coverSize] ?? COVER_HEIGHT_BY_SIZE.COMPACT;
  const coverClass = `article__cover article__cover--${coverSize.toLowerCase()}`;
  const coverObjectPosition =
    COVER_OBJECT_POSITION_BY_ALIGNMENT[coverAlignment] ?? COVER_OBJECT_POSITION_BY_ALIGNMENT.CENTER;

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="article-layout">
        <article className="article">
          <p className="article__eyebrow">NN^2 · Noel Newman News Network</p>
          <h1>{post.title}</h1>
          <p className="article__meta">
            {post.publishedAt ? format(post.publishedAt, "PPPP p") : "Date pending"} · {post.author.name}
          </p>

          {post.category || post.tags.length ? (
            <div className="taxonomy-strip">
              {post.category ? (
                <Link href={`/category/${post.category.slug}`} className="taxonomy-pill taxonomy-pill--category">
                  {post.category.name}
                </Link>
              ) : null}
              {post.tags.map((item) => (
                <Link key={item.tag.id} href={`/tag/${item.tag.slug}`} className="taxonomy-pill">
                  #{item.tag.name}
                </Link>
              ))}
            </div>
          ) : null}

          {post.coverImageUrl ? (
            <div
              className="article__cover-frame"
              style={{ ["--article-cover-height" as string]: `${coverHeight}px` }}
            >
              <img
                className={coverClass}
                src={post.coverImageUrl}
                alt={post.title}
                style={{ objectPosition: coverObjectPosition }}
              />
            </div>
          ) : null}

          <MediaRenderer media={post.media} />

          <div className="rich-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.body}</ReactMarkdown>
          </div>
        </article>

        <aside className="article-aside">
          <h2>More from NNNN</h2>
          <p>Stay with Noel Newman News Network for ongoing reporting and multimedia updates.</p>
          <div className="article-aside__founders">
            <FounderBranding mode="chips" compact />
          </div>
          <Link className="button button--ghost" href="/">
            Back to Homepage
          </Link>
        </aside>
      </main>
    </div>
  );
}
