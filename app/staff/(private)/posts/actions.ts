"use server";

import { z } from "zod";

import { requireStaffUser } from "@/lib/auth";
import { COVER_IMAGE_POSITION, COVER_IMAGE_SIZE, POST_STATUS } from "@/lib/domain";
import { createUniqueSlug } from "@/lib/posts";
import {
  normalizePublishState,
  parseMediaPayload,
  parseOptionalDate,
  parseOptionalUrl,
  slugify,
} from "@/lib/post-utils";
import { prisma } from "@/lib/prisma";

export type PostActionState = {
  error?: string;
  success?: string;
  postId?: string;
  slug?: string;
};

const postSchema = z.object({
  postId: z.string().trim().optional(),
  title: z.string().trim().min(4).max(160),
  slug: z.string().trim().max(120).optional(),
  excerpt: z.string().trim().max(300).optional(),
  body: z.string().trim().min(20),
  authorId: z.string().trim().min(1),
  categoryId: z.string().trim().optional(),
  tags: z.string().trim().max(300).optional(),
  status: z.enum([POST_STATUS.DRAFT, POST_STATUS.SCHEDULED, POST_STATUS.PUBLISHED]),
  publishedAt: z.string().trim().optional(),
  coverImageUrl: z.string().trim().optional(),
  coverImageSize: z.enum([COVER_IMAGE_SIZE.COMPACT, COVER_IMAGE_SIZE.STANDARD, COVER_IMAGE_SIZE.FEATURE]),
  coverImageHeight: z.string().trim().optional(),
  coverImagePosition: z.enum([
    COVER_IMAGE_POSITION.TOP,
    COVER_IMAGE_POSITION.CENTER,
    COVER_IMAGE_POSITION.BOTTOM,
  ]),
  mediaPayload: z.string().optional(),
});

type ParsedTagInput = {
  name: string;
  slug: string;
};

function parseTagInput(rawValue: string | null | undefined): ParsedTagInput[] {
  const normalized = (rawValue ?? "").trim();

  if (!normalized) {
    return [];
  }

  const seen = new Set<string>();
  const tags: ParsedTagInput[] = [];

  for (const item of normalized.split(",")) {
    const name = item.trim().replace(/\s+/g, " ");

    if (!name) {
      continue;
    }

    const tagSlug = slugify(name);

    if (!tagSlug || seen.has(tagSlug)) {
      continue;
    }

    seen.add(tagSlug);
    tags.push({
      name,
      slug: tagSlug,
    });
  }

  if (tags.length > 12) {
    throw new Error("Limit tags to 12 per post.");
  }

  return tags;
}

function parseOptionalCoverImageHeight(rawValue: string | null | undefined): number | null {
  const normalized = (rawValue ?? "").trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number.parseInt(normalized, 10);

  if (!Number.isFinite(parsed)) {
    throw new Error("Custom cover height must be a number.");
  }

  if (parsed < 160 || parsed > 560) {
    throw new Error("Custom cover height must be between 160 and 560 pixels.");
  }

  return parsed;
}

export async function savePostAction(_: PostActionState, formData: FormData): Promise<PostActionState> {
  await requireStaffUser();

  const parsedResult = postSchema.safeParse({
    postId: formData.get("postId") ?? undefined,
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    body: formData.get("body"),
    authorId: formData.get("authorId"),
    categoryId: formData.get("categoryId"),
    tags: formData.get("tags"),
    status: formData.get("status"),
    publishedAt: formData.get("publishedAt"),
    coverImageUrl: formData.get("coverImageUrl"),
    coverImageSize: formData.get("coverImageSize"),
    coverImageHeight: formData.get("coverImageHeight"),
    coverImagePosition: formData.get("coverImagePosition"),
    mediaPayload: formData.get("mediaPayload"),
  });

  if (!parsedResult.success) {
    return {
      error: "Check your inputs and try again.",
    };
  }

  const parsedData = parsedResult.data;

  const baseSlug = slugify(parsedData.slug || parsedData.title);

  if (!baseSlug) {
    return {
      error: "Title/slug must contain letters or numbers.",
    };
  }

  const existingAuthor = await prisma.user.findUnique({
    where: {
      id: parsedData.authorId,
    },
    select: {
      id: true,
    },
  });

  if (!existingAuthor) {
    return {
      error: "Selected author was not found.",
    };
  }

  let categoryId: string | null = null;

  if (parsedData.categoryId) {
    const existingCategory = await prisma.category.findUnique({
      where: {
        id: parsedData.categoryId,
      },
      select: {
        id: true,
      },
    });

    if (!existingCategory) {
      return {
        error: "Selected category was not found.",
      };
    }

    categoryId = existingCategory.id;
  }

  let publishDate: Date | null;

  try {
    publishDate = parseOptionalDate(parsedData.publishedAt || null);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Publish date is invalid.",
    };
  }

  if (parsedData.status === POST_STATUS.SCHEDULED) {
    if (!publishDate) {
      return {
        error: "Scheduled posts require a future publish date.",
      };
    }

    if (publishDate <= new Date()) {
      return {
        error: "Scheduled publish date must be in the future.",
      };
    }
  }

  const normalizedPublishDate = normalizePublishState(parsedData.status, publishDate);

  let media;

  try {
    media = parseMediaPayload(parsedData.mediaPayload ?? null);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Media is invalid.",
    };
  }

  let coverImageUrl: string | null;

  try {
    coverImageUrl = parseOptionalUrl(parsedData.coverImageUrl ?? "");
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Cover image URL is invalid.",
    };
  }

  let coverImageHeight: number | null;

  try {
    coverImageHeight = parseOptionalCoverImageHeight(parsedData.coverImageHeight);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Custom cover height is invalid.",
    };
  }

  let parsedTags: ParsedTagInput[];

  try {
    parsedTags = parseTagInput(parsedData.tags);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Tags are invalid.",
    };
  }

  const tagRecords = await Promise.all(
    parsedTags.map((tag) =>
      prisma.tag.upsert({
        where: {
          slug: tag.slug,
        },
        update: {
          name: tag.name,
        },
        create: {
          name: tag.name,
          slug: tag.slug,
        },
        select: {
          id: true,
        },
      }),
    ),
  );

  const tagLinkCreateData = tagRecords.map((tag) => ({
    tag: {
      connect: {
        id: tag.id,
      },
    },
  }));

  const finalSlug = await createUniqueSlug(baseSlug, parsedData.postId || undefined);

  const mediaCreateManyData = media.map((item, index) => ({
    type: item.type,
    url: item.url,
    caption: item.caption || null,
    sortOrder: index,
  }));

  if (parsedData.postId) {
    const existingPost = await prisma.post.findUnique({
      where: {
        id: parsedData.postId,
      },
      select: {
        id: true,
      },
    });

    if (!existingPost) {
      return {
        error: "Post not found.",
      };
    }

    const updatedPost = await prisma.post.update({
      where: {
        id: parsedData.postId,
      },
      data: {
        title: parsedData.title,
        slug: finalSlug,
        excerpt: parsedData.excerpt || null,
        body: parsedData.body,
        status: parsedData.status,
        publishedAt: normalizedPublishDate,
        coverImageUrl,
        coverImageSize: parsedData.coverImageSize,
        coverImageHeight,
        coverImagePosition: parsedData.coverImagePosition,
        categoryId,
        authorId: parsedData.authorId,
        media: {
          deleteMany: {},
          create: mediaCreateManyData,
        },
        tags: {
          deleteMany: {},
          create: tagLinkCreateData,
        },
      },
      select: {
        id: true,
        slug: true,
      },
    });

    return {
      success: "Post updated.",
      postId: updatedPost.id,
      slug: updatedPost.slug,
    };
  }

  const createdPost = await prisma.post.create({
    data: {
      title: parsedData.title,
      slug: finalSlug,
      excerpt: parsedData.excerpt || null,
      body: parsedData.body,
      status: parsedData.status,
      publishedAt: normalizedPublishDate,
      coverImageUrl,
      coverImageSize: parsedData.coverImageSize,
      coverImageHeight,
      coverImagePosition: parsedData.coverImagePosition,
      categoryId,
      authorId: parsedData.authorId,
      media: {
        create: mediaCreateManyData,
      },
      tags: {
        create: tagLinkCreateData,
      },
    },
    select: {
      id: true,
      slug: true,
    },
  });

  return {
    success: "Post created.",
    postId: createdPost.id,
    slug: createdPost.slug,
  };
}
