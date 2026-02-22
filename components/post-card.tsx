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
    category?: {
      name: string;
      slug: string;
    } | null;
    tags?: Array<{
      tag: {
        name: string;
        slug: string;
      };
    }>;
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
        {post.category || (post.tags && post.tags.length) ? (
          <div className="taxonomy-strip taxonomy-strip--compact">
            {post.category ? (
              <Link href={`/category/${post.category.slug}`} className="taxonomy-pill taxonomy-pill--category">
                {post.category.name}
              </Link>
            ) : null}
            {post.tags?.slice(0, 2).map((item) => (
              <Link key={item.tag.slug} href={`/tag/${item.tag.slug}`} className="taxonomy-pill">
                #{item.tag.name}
              </Link>
            ))}
          </div>
        ) : null}
        <h2>
          <Link href={`/articles/${post.slug}`}>{post.title}</Link>
        </h2>
        <p>{post.excerpt || "Read the full article for details."}</p>
      </div>
    </article>
  );
}
