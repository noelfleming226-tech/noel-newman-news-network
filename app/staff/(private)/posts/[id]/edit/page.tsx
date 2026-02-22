import { notFound } from "next/navigation";

import { PostEditorForm } from "@/components/staff/post-editor-form";
import { getPostByIdForStaff } from "@/lib/posts";
import { toDateTimeLocalValue } from "@/lib/post-utils";
import { prisma } from "@/lib/prisma";

import { savePostAction } from "../../actions";

export const metadata = {
  title: "Edit Post | Noel Newman News Network",
};

type EditPostPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;

  const [post, authors] = await Promise.all([
    getPostByIdForStaff(id),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  if (!post) {
    notFound();
  }

  return (
    <PostEditorForm
      heading={`Edit: ${post.title}`}
      description="Update content, media embeds, authorship, and scheduling controls."
      submitLabel="Save Changes"
      authors={authors}
      action={savePostAction}
      initialValues={{
        postId: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? "",
        body: post.body,
        status: post.status,
        publishedAt: toDateTimeLocalValue(post.publishedAt),
        coverImageUrl: post.coverImageUrl ?? "",
        authorId: post.authorId,
        media: post.media.map((item) => ({
          id: item.id,
          type: item.type,
          url: item.url,
          caption: item.caption ?? "",
        })),
      }}
    />
  );
}
