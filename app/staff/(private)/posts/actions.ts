"use server";

import { PostStatus } from "@prisma/client";
import { z } from "zod";

import { requireStaffUser } from "@/lib/auth";
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
  status: z.nativeEnum(PostStatus),
  publishedAt: z.string().trim().optional(),
  coverImageUrl: z.string().trim().optional(),
  mediaPayload: z.string().optional(),
});

export async function savePostAction(_: PostActionState, formData: FormData): Promise<PostActionState> {
  await requireStaffUser();

  const parsedResult = postSchema.safeParse({
    postId: formData.get("postId"),
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    body: formData.get("body"),
    authorId: formData.get("authorId"),
    status: formData.get("status"),
    publishedAt: formData.get("publishedAt"),
    coverImageUrl: formData.get("coverImageUrl"),
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

  let publishDate: Date | null;

  try {
    publishDate = parseOptionalDate(parsedData.publishedAt || null);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Publish date is invalid.",
    };
  }

  if (parsedData.status === PostStatus.SCHEDULED) {
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
        authorId: parsedData.authorId,
        media: {
          deleteMany: {},
          create: mediaCreateManyData,
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
      authorId: parsedData.authorId,
      media: {
        create: mediaCreateManyData,
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
