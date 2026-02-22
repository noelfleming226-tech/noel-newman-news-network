/* eslint-disable @next/next/no-img-element */

import Link from "next/link";

import { format } from "date-fns";

type PostCardProps = {
  post: {
    title: string;
    slug: string;
    excerpt: string | null;
    publishedAt: Date | null;
    coverImageUrl: string | null;
    author: {
      name: string;
    };
  };
};

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="post-card">
      {post.coverImageUrl ? (
        <div className="post-card__cover-wrap">
          <img className="post-card__cover" src={post.coverImageUrl} alt={post.title} />
        </div>
      ) : (
        <div className="post-card__cover-wrap post-card__cover-wrap--fallback">
          <span>Noel Newman News</span>
        </div>
      )}
      <div className="post-card__content">
        <p className="post-card__meta">
          {post.publishedAt ? format(post.publishedAt, "PPP") : "Date pending"} · {post.author.name}
        </p>
        <h2>
          <Link href={`/articles/${post.slug}`}>{post.title}</Link>
        </h2>
        <p>{post.excerpt || "Read the full article for details."}</p>
      </div>
    </article>
  );
}
