import { prisma } from "@/lib/prisma";
import { type MediaType } from "@/lib/domain";

type MediaRecord = {
  id: string;
  type: MediaType;
  url: string;
  caption: string | null;
  sortOrder: number;
};

type AuthorRecord = {
  id: string;
  name: string;
};

export type VisiblePostRecord = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  publishedAt: Date | null;
  coverImageUrl: string | null;
  author: AuthorRecord;
  media: MediaRecord[];
};

export type StaffPostRecord = {
  id: string;
  title: string;
  slug: string;
  status: string;
  publishedAt: Date | null;
  author: {
    name: string;
  };
  media: Array<{
    id: string;
  }>;
};

export async function getVisiblePosts(limit = 12): Promise<VisiblePostRecord[]> {
  const records = await prisma.post.findMany({
    where: {
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

  return records as unknown as VisiblePostRecord[];
}

export async function getVisiblePostBySlug(slug: string): Promise<VisiblePostRecord | null> {
  const record = await prisma.post.findFirst({
    where: {
      slug,
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

  return record as unknown as VisiblePostRecord | null;
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

export async function getStaffPostIndex(): Promise<StaffPostRecord[]> {
  const records = await prisma.post.findMany({
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

  return records as unknown as StaffPostRecord[];
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
