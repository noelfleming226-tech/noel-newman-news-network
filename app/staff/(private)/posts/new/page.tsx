import { PostStatus } from "@prisma/client";

import { PostEditorForm } from "@/components/staff/post-editor-form";
import { requireStaffUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { savePostAction } from "../actions";

export const metadata = {
  title: "New Post | Noel Newman News Network",
};

export default async function NewPostPage() {
  const staffUser = await requireStaffUser();
  const authors = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <PostEditorForm
      heading="Create Post"
      description="Draft a new news or blog entry with mixed media blocks and optional scheduling."
      submitLabel="Create Post"
      authors={authors}
      action={savePostAction}
      initialValues={{
        title: "",
        slug: "",
        excerpt: "",
        body: "## Headline\n\nWrite your story here.",
        status: PostStatus.DRAFT,
        publishedAt: "",
        coverImageUrl: "",
        authorId: staffUser.id,
        media: [],
      }}
    />
  );
}
