"use client";

import { MediaType, PostStatus } from "@prisma/client";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

const MEDIA_TYPES = Object.values(MediaType);

type PostActionState = {
  error?: string;
  success?: string;
  postId?: string;
  slug?: string;
};

type PostAction = (
  state: PostActionState,
  payload: FormData,
) => Promise<PostActionState>;

type MediaDraft = {
  id: string;
  type: MediaType;
  url: string;
  caption: string;
};

type PostEditorFormProps = {
  heading: string;
  description: string;
  submitLabel: string;
  authors: Array<{
    id: string;
    name: string;
  }>;
  initialValues: {
    postId?: string;
    title: string;
    slug: string;
    excerpt: string;
    body: string;
    status: PostStatus;
    publishedAt: string;
    coverImageUrl: string;
    authorId: string;
    media: MediaDraft[];
  };
  action: PostAction;
};

function createEmptyMediaDraft(): MediaDraft {
  return {
    id: `media-${Math.random().toString(36).slice(2)}`,
    type: MediaType.IMAGE,
    url: "",
    caption: "",
  };
}

export function PostEditorForm({
  heading,
  description,
  submitLabel,
  authors,
  initialValues,
  action,
}: PostEditorFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});
  const [media, setMedia] = useState<MediaDraft[]>(
    initialValues.media.length > 0 ? initialValues.media : [createEmptyMediaDraft()],
  );

  const mediaPayload = useMemo(
    () => JSON.stringify(media.map((item) => ({ type: item.type, url: item.url, caption: item.caption }))),
    [media],
  );

  return (
    <section className="staff-panel">
      <div className="staff-panel__head">
        <h1>{heading}</h1>
        <p>{description}</p>
      </div>

      <form action={formAction} className="staff-form">
        {initialValues.postId ? <input type="hidden" name="postId" value={initialValues.postId} /> : null}
        <input type="hidden" name="mediaPayload" value={mediaPayload} />

        <label>
          Title
          <input name="title" defaultValue={initialValues.title} required minLength={4} />
        </label>

        <label>
          Custom Slug (optional)
          <input name="slug" defaultValue={initialValues.slug} placeholder="auto-generated-from-title" />
        </label>

        <label>
          Excerpt
          <textarea name="excerpt" rows={3} defaultValue={initialValues.excerpt} />
        </label>

        <label>
          Body (Markdown supported)
          <textarea name="body" rows={14} defaultValue={initialValues.body} required />
        </label>

        <div className="staff-form__grid">
          <label>
            Author
            <select name="authorId" defaultValue={initialValues.authorId}>
              {authors.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Status
            <select name="status" defaultValue={initialValues.status}>
              <option value={PostStatus.DRAFT}>Draft</option>
              <option value={PostStatus.SCHEDULED}>Scheduled</option>
              <option value={PostStatus.PUBLISHED}>Published</option>
            </select>
          </label>

          <label>
            Publish Date/Time
            <input type="datetime-local" name="publishedAt" defaultValue={initialValues.publishedAt} />
          </label>

          <label>
            Cover Image URL
            <input type="url" name="coverImageUrl" defaultValue={initialValues.coverImageUrl} />
          </label>
        </div>

        <div className="media-editor">
          <div className="media-editor__head">
            <h2>Mixed Media Blocks</h2>
            <button
              type="button"
              className="button button--ghost"
              onClick={() => setMedia((current) => [...current, createEmptyMediaDraft()])}
            >
              Add Media
            </button>
          </div>

          {media.map((item, index) => (
            <div key={item.id} className="media-editor__item">
              <label>
                Type
                <select
                  value={item.type}
                  onChange={(event) => {
                    const nextType = event.target.value as MediaType;
                    setMedia((current) =>
                      current.map((entry) =>
                        entry.id === item.id
                          ? {
                              ...entry,
                              type: nextType,
                            }
                          : entry,
                      ),
                    );
                  }}
                >
                  {MEDIA_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Media URL
                <input
                  type="url"
                  value={item.url}
                  onChange={(event) => {
                    const nextUrl = event.target.value;
                    setMedia((current) =>
                      current.map((entry) =>
                        entry.id === item.id
                          ? {
                              ...entry,
                              url: nextUrl,
                            }
                          : entry,
                      ),
                    );
                  }}
                  placeholder="https://"
                />
              </label>

              <label>
                Caption (optional)
                <input
                  value={item.caption}
                  onChange={(event) => {
                    const nextCaption = event.target.value;
                    setMedia((current) =>
                      current.map((entry) =>
                        entry.id === item.id
                          ? {
                              ...entry,
                              caption: nextCaption,
                            }
                          : entry,
                      ),
                    );
                  }}
                />
              </label>

              <button
                type="button"
                className="button button--danger"
                onClick={() => {
                  setMedia((current) => {
                    if (current.length <= 1) {
                      return [createEmptyMediaDraft()];
                    }

                    return current.filter((entry) => entry.id !== item.id);
                  });
                }}
              >
                Remove Block {index + 1}
              </button>
            </div>
          ))}
        </div>

        {state.error ? <p className="form-message form-message--error">{state.error}</p> : null}
        {state.success ? (
          <p className="form-message form-message--success">
            {state.success}{" "}
            {state.postId && state.slug ? (
              <>
                <Link href={`/staff/posts/${state.postId}/edit`}>Continue editing</Link> or{" "}
                <Link href={`/articles/${state.slug}`} target="_blank" rel="noopener noreferrer">
                  view live
                </Link>
                .
              </>
            ) : null}
          </p>
        ) : null}

        <button type="submit" className="button button--primary" disabled={isPending}>
          {isPending ? "Saving..." : submitLabel}
        </button>
      </form>
    </section>
  );
}
