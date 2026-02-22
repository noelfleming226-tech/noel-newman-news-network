import { type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const visiblePostWhere: Prisma.PostWhereInput = {
  OR: [
    {
      status: "PUBLISHED",
      publishedAt: {
        lte: new Date(),
      },
    },
    {
      status: "SCHEDULED",
      publishedAt: {
        lte: new Date(),
      },
    },
  ],
};

export async function getVisiblePosts(limit = 12) {
  return prisma.post.findMany({
    where: visiblePostWhere,
    include: {
      author: {
        select: {
          id: true,
          name: true,
        },
      },
      media: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
    orderBy: [
      {
        publishedAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    take: limit,
  });
}

export async function getVisiblePostBySlug(slug: string) {
  return prisma.post.findFirst({
    where: {
      slug,
      ...visiblePostWhere,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
        },
      },
      media: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });
}

export async function getPostByIdForStaff(postId: string) {
  return prisma.post.findUnique({
    where: {
      id: postId,
    },
    include: {
      media: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      author: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

export async function getStaffPostIndex() {
  return prisma.post.findMany({
    include: {
      author: {
        select: {
          name: true,
        },
      },
      media: {
        select: {
          id: true,
        },
      },
    },
    orderBy: [
      {
        createdAt: "desc",
      },
    ],
  });
}

export async function createUniqueSlug(baseSlug: string, excludeId?: string) {
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await prisma.post.findFirst({
      where: {
        slug: candidate,
        ...(excludeId
          ? {
              id: {
                not: excludeId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}
