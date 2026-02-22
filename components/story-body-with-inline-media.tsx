import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { MediaFigure, MediaRenderer, type MediaItem } from "@/components/media-renderer";

type StoryBodyWithInlineMediaProps = {
  body: string;
  media: MediaItem[];
};

type BodyPart =
  | {
      kind: "markdown";
      content: string;
      key: string;
    }
  | {
      kind: "media";
      mediaIndex: number;
      key: string;
    };

function parseBodyParts(body: string, mediaCount: number) {
  const inlineMediaTokenPattern = /\{\{media:(\d+)\}\}/gi;
  const parts: BodyPart[] = [];
  const usedIndexes = new Set<number>();
  let lastIndex = 0;
  let matchIndex = 0;

  for (const match of body.matchAll(inlineMediaTokenPattern)) {
    const token = match[0];
    const rawIndex = match[1];
    const tokenOffset = match.index ?? -1;

    if (tokenOffset < 0) {
      continue;
    }

    const mediaIndex = Number.parseInt(rawIndex, 10) - 1;
    const isValidIndex = Number.isFinite(mediaIndex) && mediaIndex >= 0 && mediaIndex < mediaCount;

    if (!isValidIndex) {
      continue;
    }

    const markdownSegment = body.slice(lastIndex, tokenOffset);

    if (markdownSegment.trim().length > 0) {
      parts.push({
        kind: "markdown",
        content: markdownSegment,
        key: `markdown-${matchIndex}-${tokenOffset}`,
      });
    }

    parts.push({
      kind: "media",
      mediaIndex,
      key: `media-${matchIndex}-${mediaIndex}`,
    });

    usedIndexes.add(mediaIndex);
    lastIndex = tokenOffset + token.length;
    matchIndex += 1;
  }

  const trailingMarkdown = body.slice(lastIndex);

  if (trailingMarkdown.trim().length > 0 || parts.length === 0) {
    parts.push({
      kind: "markdown",
      content: trailingMarkdown,
      key: `markdown-trailing-${lastIndex}`,
    });
  }

  return { parts, usedIndexes };
}

export function StoryBodyWithInlineMedia({ body, media }: StoryBodyWithInlineMediaProps) {
  const { parts, usedIndexes } = parseBodyParts(body, media.length);
  const hasInlineMedia = usedIndexes.size > 0;
  const remainingMedia = media.filter((_, index) => !usedIndexes.has(index));

  if (!hasInlineMedia) {
    return (
      <>
        <MediaRenderer media={media} />
        <div className="rich-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="rich-body rich-body--inline-media">
        {parts.map((part) => {
          if (part.kind === "media") {
            const mediaItem = media[part.mediaIndex];

            if (!mediaItem) {
              return null;
            }

            return (
              <div key={part.key} className="inline-media-slot">
                <MediaFigure item={mediaItem} />
              </div>
            );
          }

          return (
            <ReactMarkdown key={part.key} remarkPlugins={[remarkGfm]}>
              {part.content}
            </ReactMarkdown>
          );
        })}
      </div>

      <MediaRenderer media={remainingMedia} ariaLabel="Additional embedded media" />
    </>
  );
}
