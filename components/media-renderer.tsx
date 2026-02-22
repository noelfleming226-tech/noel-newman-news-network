/* eslint-disable @next/next/no-img-element */

import { MEDIA_TYPE, type MediaType } from "@/lib/domain";
import { extractTweetStatusId, toTweetEmbedUrl, toYouTubeEmbedUrl } from "@/lib/post-utils";

export type MediaItem = {
  id: string;
  type: MediaType;
  url: string;
  caption: string | null;
};

type MediaRendererProps = {
  media: MediaItem[];
  className?: string;
  ariaLabel?: string;
};

type MediaFigureProps = {
  item: MediaItem;
};

export function MediaFigure({ item }: MediaFigureProps) {
  const caption = item.caption ? <figcaption>{item.caption}</figcaption> : null;

  if (item.type === MEDIA_TYPE.YOUTUBE) {
    return (
      <figure key={item.id} className="media-card">
        <div className="media-frame media-frame--video">
          <iframe
            src={toYouTubeEmbedUrl(item.url)}
            title="Embedded YouTube video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        {caption}
      </figure>
    );
  }

  if (item.type === MEDIA_TYPE.TWEET) {
    const tweetId = extractTweetStatusId(item.url);

    return (
      <figure key={item.id} className="media-card media-card--tweet">
        <div className="media-card__label">NN^2 · Social Post Reference</div>
        {tweetId ? (
          <div className="media-frame media-frame--tweet">
            <iframe
              src={toTweetEmbedUrl(item.url)}
              title="Embedded X post"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        ) : (
          <div className="media-frame media-frame--tweet media-frame--tweet-fallback">
            <p>Unable to parse the X/Twitter post URL for embed. Open the source link instead:</p>
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              {item.url}
            </a>
          </div>
        )}
        {caption}
      </figure>
    );
  }

  if (item.type === MEDIA_TYPE.VIDEO) {
    return (
      <figure key={item.id} className="media-card">
        <video className="media-frame media-frame--video" controls src={item.url} />
        {caption}
      </figure>
    );
  }

  if (item.type === MEDIA_TYPE.AUDIO) {
    return (
      <figure key={item.id} className="media-card">
        <audio className="media-frame media-frame--audio" controls src={item.url} />
        {caption}
      </figure>
    );
  }

  if (item.type === MEDIA_TYPE.EMBED) {
    return (
      <figure key={item.id} className="media-card">
        <div className="media-frame media-frame--video">
          <iframe
            src={item.url}
            title="Embedded media"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        {caption}
      </figure>
    );
  }

  return (
    <figure key={item.id} className="media-card">
      <img className="media-frame media-frame--image" src={item.url} alt={item.caption || "Article media"} />
      {caption}
    </figure>
  );
}

export function MediaRenderer({
  media,
  className = "article-media",
  ariaLabel = "Embedded media",
}: MediaRendererProps) {
  if (!media.length) {
    return null;
  }

  return (
    <section className={className} aria-label={ariaLabel}>
      {media.map((item) => (
        <MediaFigure key={item.id} item={item} />
      ))}
    </section>
  );
}
