import { prisma } from "@/lib/prisma";
import { type CoverImagePosition, type CoverImageSize, type MediaType } from "@/lib/domain";

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

export type TopicRecord = {
  id: string;
  name: string;
  slug: string;
};

type PostTagRelationRecord = {
  tag: TopicRecord;
};

export type VisiblePostRecord = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  publishedAt: Date | null;
  coverImageUrl: string | null;
  coverImageSize: CoverImageSize;
  coverImageHeight: number | null;
  coverImagePosition: CoverImagePosition;
  category: TopicRecord | null;
  tags: PostTagRelationRecord[];
  author: AuthorRecord;
  media: MediaRecord[];
};

export type StaffPostRecord = {
  id: string;
  title: string;
  slug: string;
  status: string;
  publishedAt: Date | null;
  category: TopicRecord | null;
  tags: PostTagRelationRecord[];
  author: {
    name: string;
  };
  media: Array<{
    id: string;
  }>;
};

export type SearchVisiblePostsResult = {
  items: VisiblePostRecord[];
  total: number;
  page: number;
  pageSize: number;
};

function visiblePostWhere() {
  return {
    OR: [
      {
        status: "PUBLISHED" as const,
        publishedAt: {
          lte: new Date(),
        },
      },
      {
        status: "SCHEDULED" as const,
        publishedAt: {
          lte: new Date(),
        },
      },
    ],
  };
}

const visiblePostInclude = {
  author: {
    select: {
      id: true,
      name: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  tags: {
    orderBy: {
      tag: {
        name: "asc" as const,
      },
    },
    include: {
      tag: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  },
  media: {
    orderBy: {
      sortOrder: "asc" as const,
    },
  },
} as const;

function visiblePostOrderBy() {
  return [
    {
      publishedAt: "desc" as const,
    },
    {
      createdAt: "desc" as const,
    },
  ];
}

export async function getCategoriesForStaff(): Promise<TopicRecord[]> {
  return prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function getVisiblePosts(limit = 12): Promise<VisiblePostRecord[]> {
  const records = await prisma.post.findMany({
    where: visiblePostWhere(),
    include: visiblePostInclude,
    orderBy: visiblePostOrderBy(),
    take: limit,
  });

  return records as unknown as VisiblePostRecord[];
}

export async function getVisiblePostBySlug(slug: string): Promise<VisiblePostRecord | null> {
  const record = await prisma.post.findFirst({
    where: {
      slug,
      ...visiblePostWhere(),
    },
    include: visiblePostInclude,
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
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      tags: {
        orderBy: {
          tag: {
            name: "asc",
          },
        },
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
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
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: {
          tag: {
            name: "asc",
          },
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

export async function getVisiblePostsByCategorySlug(categorySlug: string, limit = 24): Promise<VisiblePostRecord[]> {
  const records = await prisma.post.findMany({
    where: {
      category: {
        slug: categorySlug,
      },
      ...visiblePostWhere(),
    },
    include: visiblePostInclude,
    orderBy: visiblePostOrderBy(),
    take: limit,
  });

  return records as unknown as VisiblePostRecord[];
}

export async function getVisiblePostsByTagSlug(tagSlug: string, limit = 24): Promise<VisiblePostRecord[]> {
  const records = await prisma.post.findMany({
    where: {
      tags: {
        some: {
          tag: {
            slug: tagSlug,
          },
        },
      },
      ...visiblePostWhere(),
    },
    include: visiblePostInclude,
    orderBy: visiblePostOrderBy(),
    take: limit,
  });

  return records as unknown as VisiblePostRecord[];
}

export async function getVisibleCategoryBySlug(slug: string): Promise<TopicRecord | null> {
  return prisma.category.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });
}

export async function getVisibleTagBySlug(slug: string): Promise<TopicRecord | null> {
  return prisma.tag.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });
}

export async function searchVisiblePosts(
  rawQuery: string,
  page = 1,
  pageSize = 20,
): Promise<SearchVisiblePostsResult> {
  const query = rawQuery.trim();
  const normalizedPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const normalizedPageSize = Math.min(Math.max(Math.floor(pageSize) || 20, 1), 50);

  if (query.length < 2) {
    return {
      items: [],
      total: 0,
      page: normalizedPage,
      pageSize: normalizedPageSize,
    };
  }

  const where = {
    AND: [
      visiblePostWhere(),
      {
        OR: [
          {
            title: {
              contains: query,
            },
          },
          {
            excerpt: {
              contains: query,
            },
          },
          {
            body: {
              contains: query,
            },
          },
          {
            category: {
              is: {
                OR: [
                  {
                    name: {
                      contains: query,
                    },
                  },
                  {
                    slug: {
                      contains: query,
                    },
                  },
                ],
              },
            },
          },
          {
            tags: {
              some: {
                tag: {
                  OR: [
                    {
                      name: {
                        contains: query,
                      },
                    },
                    {
                      slug: {
                        contains: query,
                      },
                    },
                  ],
                },
              },
            },
          },
        ],
      },
    ],
  };

  const [total, items] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      include: visiblePostInclude,
      orderBy: visiblePostOrderBy(),
      skip: (normalizedPage - 1) * normalizedPageSize,
      take: normalizedPageSize,
    }),
  ]);

  return {
    items: items as unknown as VisiblePostRecord[],
    total,
    page: normalizedPage,
    pageSize: normalizedPageSize,
  };
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
