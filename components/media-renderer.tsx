/* eslint-disable @next/next/no-img-element */

import { MediaType } from "@prisma/client";

import { toYouTubeEmbedUrl } from "@/lib/post-utils";

type MediaRendererProps = {
  media: Array<{
    id: string;
    type: MediaType;
    url: string;
    caption: string | null;
  }>;
};

export function MediaRenderer({ media }: MediaRendererProps) {
  if (!media.length) {
    return null;
  }

  return (
    <section className="article-media" aria-label="Embedded media">
      {media.map((item) => {
        const caption = item.caption ? <figcaption>{item.caption}</figcaption> : null;

        if (item.type === MediaType.YOUTUBE) {
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

        if (item.type === MediaType.VIDEO) {
          return (
            <figure key={item.id} className="media-card">
              <video className="media-frame media-frame--video" controls src={item.url} />
              {caption}
            </figure>
          );
        }

        if (item.type === MediaType.AUDIO) {
          return (
            <figure key={item.id} className="media-card">
              <audio className="media-frame media-frame--audio" controls src={item.url} />
              {caption}
            </figure>
          );
        }

        if (item.type === MediaType.EMBED) {
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
      })}
    </section>
  );
}
