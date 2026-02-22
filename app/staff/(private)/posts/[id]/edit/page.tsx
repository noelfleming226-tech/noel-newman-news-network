import { notFound } from "next/navigation";

import { PostEditorForm } from "@/components/staff/post-editor-form";
import { getCategoriesForStaff, getPostByIdForStaff } from "@/lib/posts";
import { toDateTimeLocalValue } from "@/lib/post-utils";
import { prisma } from "@/lib/prisma";

import { savePostAction } from "../../actions";

type StaffPostForEdit = NonNullable<Awaited<ReturnType<typeof getPostByIdForStaff>>>;

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

  const [post, authors, categories] = await Promise.all([
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
    getCategoriesForStaff(),
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
      categories={categories}
      action={savePostAction}
      initialValues={{
        postId: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? "",
        body: post.body,
        categoryId: post.categoryId ?? "",
        tags: post.tags.map((item) => item.tag.name).join(", "),
        status: post.status,
        publishedAt: toDateTimeLocalValue(post.publishedAt),
        coverImageUrl: post.coverImageUrl ?? "",
        coverImageSize: post.coverImageSize,
        coverImageHeight: post.coverImageHeight?.toString() ?? "",
        coverImagePosition: post.coverImagePosition,
        authorId: post.authorId,
        media: (post as StaffPostForEdit).media.map((item: StaffPostForEdit["media"][number]) => ({
          id: item.id,
          type: item.type,
          url: item.url,
          caption: item.caption ?? "",
        })),
      }}
    />
  );
}
