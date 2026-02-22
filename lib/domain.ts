export const USER_ROLE = {
  STAFF: "STAFF",
  ADMIN: "ADMIN",
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export const POST_STATUS = {
  DRAFT: "DRAFT",
  SCHEDULED: "SCHEDULED",
  PUBLISHED: "PUBLISHED",
} as const;

export type PostStatus = (typeof POST_STATUS)[keyof typeof POST_STATUS];

export const MEDIA_TYPE = {
  YOUTUBE: "YOUTUBE",
  VIDEO: "VIDEO",
  IMAGE: "IMAGE",
  AUDIO: "AUDIO",
  EMBED: "EMBED",
} as const;

export type MediaType = (typeof MEDIA_TYPE)[keyof typeof MEDIA_TYPE];

export const COVER_IMAGE_SIZE = {
  COMPACT: "COMPACT",
  STANDARD: "STANDARD",
  FEATURE: "FEATURE",
} as const;

export type CoverImageSize = (typeof COVER_IMAGE_SIZE)[keyof typeof COVER_IMAGE_SIZE];

export const COVER_IMAGE_POSITION = {
  TOP: "TOP",
  CENTER: "CENTER",
  BOTTOM: "BOTTOM",
} as const;

export type CoverImagePosition = (typeof COVER_IMAGE_POSITION)[keyof typeof COVER_IMAGE_POSITION];
