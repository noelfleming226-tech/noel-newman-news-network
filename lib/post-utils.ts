import { z } from "zod";

import { MEDIA_TYPE, POST_STATUS, type MediaType, type PostStatus } from "@/lib/domain";

const MEDIA_TYPE_VALUES = Object.values(MEDIA_TYPE) as [MediaType, ...MediaType[]];

const mediaInputSchema = z.object({
  type: z.enum(MEDIA_TYPE_VALUES),
  url: z.string().trim().url(),
  caption: z.string().trim().max(180).optional(),
});

const mediaPayloadSchema = z.array(mediaInputSchema);

export type ParsedMediaInput = z.infer<typeof mediaInputSchema>;

export function slugify(rawValue: string): string {
  return rawValue
    .toLowerCase()
    .trim()
    .replace(/["']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export function parseMediaPayload(payload: string | null): ParsedMediaInput[] {
  if (!payload) {
    return [];
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(payload);
  } catch {
    throw new Error("Media payload must be valid JSON.");
  }

  const normalized = Array.isArray(parsed)
    ? parsed
        .map((item) => {
          if (typeof item !== "object" || item === null) {
            return item;
          }

          const candidate = item as {
            type?: unknown;
            url?: unknown;
            caption?: unknown;
          };

          return {
            type: candidate.type,
            url: typeof candidate.url === "string" ? candidate.url.trim() : candidate.url,
            caption: typeof candidate.caption === "string" ? candidate.caption.trim() : candidate.caption,
          };
        })
        .filter((item) => {
          if (typeof item !== "object" || item === null) {
            return false;
          }

          const candidate = item as { url?: unknown };
          return typeof candidate.url === "string" && candidate.url.length > 0;
        })
    : parsed;

  const mediaResult = mediaPayloadSchema.safeParse(normalized);

  if (!mediaResult.success) {
    throw new Error("Media entries must include a valid type and URL.");
  }

  return mediaResult.data;
}

export function toDateTimeLocalValue(date: Date | null | undefined): string {
  if (!date) {
    return "";
  }

  const timezoneOffset = date.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(date.getTime() - timezoneOffset);

  return localDate.toISOString().slice(0, 16);
}

export function parseOptionalDate(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Publish date is invalid.");
  }

  return parsed;
}

export function normalizePublishState(status: PostStatus, publishDate: Date | null): Date | null {
  if (status === POST_STATUS.PUBLISHED && !publishDate) {
    return new Date();
  }

  return publishDate;
}

export function toYouTubeEmbedUrl(url: string): string {
  try {
    const candidate = new URL(url);

    if (candidate.hostname.includes("youtu.be")) {
      const id = candidate.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }

    if (candidate.hostname.includes("youtube.com")) {
      const videoId = candidate.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }
  } catch {
    return url;
  }

  return url;
}

export function parseOptionalUrl(rawValue: string): string | null {
  if (!rawValue.trim()) {
    return null;
  }

  let parsed: URL;

  try {
    parsed = new URL(rawValue);
  } catch {
    throw new Error("Cover image must be a valid URL.");
  }

  return parsed.toString();
}
