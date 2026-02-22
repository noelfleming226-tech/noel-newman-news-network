import { PostEditorForm } from "@/components/staff/post-editor-form";
import { requireStaffUser } from "@/lib/auth";
import { POST_STATUS } from "@/lib/domain";
import { getCategoriesForStaff } from "@/lib/posts";
import { prisma } from "@/lib/prisma";

import { savePostAction } from "../actions";

export const metadata = {
  title: "New Post | Noel Newman News Network",
};

export default async function NewPostPage() {
  const staffUser = await requireStaffUser();
  const [authors, categories] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    getCategoriesForStaff(),
  ]);

  return (
    <PostEditorForm
      heading="Create Post"
      description="Draft a new news or blog entry with mixed media blocks and optional scheduling."
      submitLabel="Create Post"
      authors={authors}
      categories={categories}
      action={savePostAction}
      initialValues={{
        title: "",
        slug: "",
        excerpt: "",
        body: "## Headline\n\nWrite your story here.",
        categoryId: "",
        tags: "",
        status: POST_STATUS.DRAFT,
        publishedAt: "",
        coverImageUrl: "",
        coverImageSize: "COMPACT",
        coverImageHeight: "",
        coverImagePosition: "CENTER",
        authorId: staffUser.id,
        media: [],
      }}
    />
  );
}
