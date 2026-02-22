import { hash } from "bcryptjs";

import { MEDIA_TYPE, POST_STATUS, USER_ROLE } from "../lib/domain";
import { prisma } from "../lib/prisma";

async function main() {
  const seedPassword = process.env.SEED_STAFF_PASSWORD || "NNNN-ChangeMe-2026!";
  const passwordHash = await hash(seedPassword, 12);

  const noel = await prisma.user.upsert({
    where: {
      email: "noel@nnnn.local",
    },
    update: {
      name: "Noel Fleming",
      username: "noelfleming",
      passwordHash,
      role: USER_ROLE.ADMIN,
    },
    create: {
      name: "Noel Fleming",
      email: "noel@nnnn.local",
      username: "noelfleming",
      passwordHash,
      role: USER_ROLE.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: {
      email: "phil@nnnn.local",
    },
    update: {
      name: "Phil Newman",
      username: "philnewman",
      passwordHash,
      role: USER_ROLE.ADMIN,
    },
    create: {
      name: "Phil Newman",
      email: "phil@nnnn.local",
      username: "philnewman",
      passwordHash,
      role: USER_ROLE.ADMIN,
    },
  });

  const defaultCategories = [
    { name: "Breaking News", slug: "breaking-news" },
    { name: "Analysis", slug: "analysis" },
    { name: "Business", slug: "business" },
    { name: "Local", slug: "local" },
    { name: "Opinion", slug: "opinion" },
  ];

  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: {
        slug: category.slug,
      },
      update: {
        name: category.name,
      },
      create: category,
    });
  }

  const analysisCategory = await prisma.category.findUnique({
    where: {
      slug: "analysis",
    },
    select: {
      id: true,
    },
  });

  const welcomeSlug = "welcome-to-noel-newman-news-network";
  const existingWelcomePost = await prisma.post.findUnique({
    where: {
      slug: welcomeSlug,
    },
    select: {
      id: true,
    },
  });

  if (!existingWelcomePost) {
    await prisma.post.create({
      data: {
        title: "Welcome to Noel Newman News Network",
        slug: welcomeSlug,
        excerpt: "A quick launch update from Noel Fleming and Phil Newman.",
        body: [
          "## Launch Note",
          "",
          "Noel Newman News Network is now live with full mixed-media publishing.",
          "",
          "- Staff can publish text-first stories.",
          "- YouTube, video, image, audio, and embeds can be attached per post.",
          "- Scheduled publishing supports future release times.",
          "",
          "Thanks for following the launch.",
        ].join("\n"),
        status: POST_STATUS.PUBLISHED,
        publishedAt: new Date(),
        authorId: noel.id,
        categoryId: analysisCategory?.id ?? null,
        coverImageUrl:
          "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1400&q=80",
        media: {
          create: [
            {
              type: MEDIA_TYPE.YOUTUBE,
              url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
              caption: "Sample YouTube embed block.",
              sortOrder: 0,
            },
            {
              type: MEDIA_TYPE.AUDIO,
              url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
              caption: "Sample external audio block.",
              sortOrder: 1,
            },
          ],
        },
        tags: {
          create: [
            {
              tag: {
                connectOrCreate: {
                  where: {
                    slug: "launch",
                  },
                  create: {
                    name: "Launch",
                    slug: "launch",
                  },
                },
              },
            },
            {
              tag: {
                connectOrCreate: {
                  where: {
                    slug: "platform",
                  },
                  create: {
                    name: "Platform",
                    slug: "platform",
                  },
                },
              },
            },
          ],
        },
      },
    });
  }

  console.log("Database seeded successfully.");
  console.log("Default staff users:");
  console.log("- noelfleming /", seedPassword);
  console.log("- philnewman /", seedPassword);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
