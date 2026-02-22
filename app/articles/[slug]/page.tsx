/* eslint-disable @next/next/no-img-element */

import { format } from "date-fns";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { MediaRenderer } from "@/components/media-renderer";
import { SiteHeader } from "@/components/site-header";
import { getVisiblePostBySlug } from "@/lib/posts";

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

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="article-layout">
        <article className="article">
          <p className="article__eyebrow">Noel Newman News Network</p>
          <h1>{post.title}</h1>
          <p className="article__meta">
            {post.publishedAt ? format(post.publishedAt, "PPPP p") : "Date pending"} · {post.author.name}
          </p>

          {post.coverImageUrl ? <img className="article__cover" src={post.coverImageUrl} alt={post.title} /> : null}

          <MediaRenderer media={post.media} />

          <div className="rich-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.body}</ReactMarkdown>
          </div>
        </article>

        <aside className="article-aside">
          <h2>More from NNNN</h2>
          <p>Stay with Noel Newman News Network for ongoing reporting and multimedia updates.</p>
          <Link className="button button--ghost" href="/">
            Back to Homepage
          </Link>
        </aside>
      </main>
    </div>
  );
}
