/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useActionState, useMemo, useRef, useState } from "react";

import { StoryBodyWithInlineMedia } from "@/components/story-body-with-inline-media";

type MediaType = "YOUTUBE" | "TWEET" | "VIDEO" | "IMAGE" | "AUDIO" | "EMBED";
type PostStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED";
type CoverImageSize = "COMPACT" | "STANDARD" | "FEATURE";
type CoverImagePosition = "TOP" | "CENTER" | "BOTTOM";
type PreviewMode = "EDIT" | "PREVIEW" | "SPLIT";

const POST_STATUS = {
  DRAFT: "DRAFT" as PostStatus,
  SCHEDULED: "SCHEDULED" as PostStatus,
  PUBLISHED: "PUBLISHED" as PostStatus,
} as const;

const COVER_IMAGE_SIZE = {
  COMPACT: "COMPACT" as CoverImageSize,
  STANDARD: "STANDARD" as CoverImageSize,
  FEATURE: "FEATURE" as CoverImageSize,
} as const;

const COVER_IMAGE_POSITION = {
  TOP: "TOP" as CoverImagePosition,
  CENTER: "CENTER" as CoverImagePosition,
  BOTTOM: "BOTTOM" as CoverImagePosition,
} as const;

const PREVIEW_MODE = {
  EDIT: "EDIT" as PreviewMode,
  PREVIEW: "PREVIEW" as PreviewMode,
  SPLIT: "SPLIT" as PreviewMode,
} as const;

const COVER_HEIGHT_BY_SIZE: Record<CoverImageSize, number> = {
  COMPACT: 220,
  STANDARD: 300,
  FEATURE: 380,
};

const COVER_OBJECT_POSITION_BY_ALIGNMENT: Record<CoverImagePosition, string> = {
  TOP: "center top",
  CENTER: "center center",
  BOTTOM: "center bottom",
};

const MEDIA_TYPES: MediaType[] = ["YOUTUBE", "TWEET", "VIDEO", "IMAGE", "AUDIO", "EMBED"];
const MEDIA_TYPE = {
  IMAGE: "IMAGE" as MediaType,
} as const;

type PostActionState = {
  error?: string;
  success?: string;
  postId?: string;
  slug?: string;
};

type PostAction = (state: PostActionState, payload: FormData) => Promise<PostActionState>;

type MediaDraft = {
  id: string;
  type: MediaType;
  url: string;
  caption: string;
};

type PostEditorDraft = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  categoryId: string;
  tags: string;
  status: PostStatus;
  publishedAt: string;
  coverImageUrl: string;
  coverImageSize: CoverImageSize;
  coverImageHeight: string;
  coverImagePosition: CoverImagePosition;
  authorId: string;
};

type PostEditorFormProps = {
  heading: string;
  description: string;
  submitLabel: string;
  authors: Array<{
    id: string;
    name: string;
  }>;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  initialValues: {
    postId?: string;
    title: string;
    slug: string;
    excerpt: string;
    body: string;
    categoryId: string;
    tags: string;
    status: PostStatus;
    publishedAt: string;
    coverImageUrl: string;
    coverImageSize: CoverImageSize;
    coverImageHeight: string;
    coverImagePosition: CoverImagePosition;
    authorId: string;
    media: MediaDraft[];
  };
  action: PostAction;
};

function createEmptyMediaDraft(): MediaDraft {
  return {
    id: `media-${Math.random().toString(36).slice(2)}`,
    type: MEDIA_TYPE.IMAGE,
    url: "",
    caption: "",
  };
}

function parsePreviewTags(rawValue: string) {
  const seen = new Set<string>();

  return rawValue
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => {
      const normalized = item.toLowerCase();

      if (seen.has(normalized)) {
        return false;
      }

      seen.add(normalized);
      return true;
    });
}

function clampCustomCoverHeight(rawValue: string, fallback: number) {
  const parsed = Number.parseInt(rawValue.trim(), 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, 160), 560);
}

export function PostEditorForm({
  heading,
  description,
  submitLabel,
  authors,
  categories,
  initialValues,
  action,
}: PostEditorFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});
  const [previewMode, setPreviewMode] = useState<PreviewMode>(PREVIEW_MODE.SPLIT);
  const [draft, setDraft] = useState<PostEditorDraft>({
    title: initialValues.title,
    slug: initialValues.slug,
    excerpt: initialValues.excerpt,
    body: initialValues.body,
    categoryId: initialValues.categoryId,
    tags: initialValues.tags,
    status: initialValues.status,
    publishedAt: initialValues.publishedAt,
    coverImageUrl: initialValues.coverImageUrl,
    coverImageSize: initialValues.coverImageSize,
    coverImageHeight: initialValues.coverImageHeight,
    coverImagePosition: initialValues.coverImagePosition,
    authorId: initialValues.authorId,
  });
  const [media, setMedia] = useState<MediaDraft[]>(
    initialValues.media.length > 0 ? initialValues.media : [createEmptyMediaDraft()],
  );
  const bodyTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const mediaPayload = useMemo(
    () => JSON.stringify(media.map((item) => ({ type: item.type, url: item.url, caption: item.caption }))),
    [media],
  );

  const previewAuthorName =
    authors.find((author) => author.id === draft.authorId)?.name ?? authors[0]?.name ?? "Staff Writer";
  const previewCategory = categories.find((category) => category.id === draft.categoryId) ?? null;
  const previewTags = parsePreviewTags(draft.tags);
  const previewCoverHeight = clampCustomCoverHeight(draft.coverImageHeight, COVER_HEIGHT_BY_SIZE[draft.coverImageSize]);
  const previewCoverPosition = COVER_OBJECT_POSITION_BY_ALIGNMENT[draft.coverImagePosition];
  const previewMedia = media
    .filter((item) => item.url.trim().length > 0)
    .map((item) => ({ ...item, caption: item.caption.trim() || null }));

  function updateDraftField<K extends keyof PostEditorDraft>(key: K, value: PostEditorDraft[K]) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function insertInlineMediaToken(blockIndex: number) {
    const token = `{{media:${blockIndex + 1}}}`;

    updateDraftField(
      "body",
      (() => {
        const textarea = bodyTextareaRef.current;

        if (!textarea) {
          return draft.body.trim() ? `${draft.body}\n\n${token}\n` : `${token}\n`;
        }

        const start = textarea.selectionStart ?? draft.body.length;
        const end = textarea.selectionEnd ?? start;
        const nextValue = `${draft.body.slice(0, start)}${token}${draft.body.slice(end)}`;

        queueMicrotask(() => {
          textarea.focus();
          const caret = start + token.length;
          textarea.setSelectionRange(caret, caret);
        });

        return nextValue;
      })(),
    );
  }

  return (
    <section className="staff-panel">
      <div className="staff-panel__head">
        <h1>{heading}</h1>
        <p>{description}</p>
      </div>

      <form action={formAction} className="staff-form">
        {initialValues.postId ? <input type="hidden" name="postId" value={initialValues.postId} /> : null}
        <input type="hidden" name="mediaPayload" value={mediaPayload} />

        <div className="preview-mode-bar" role="tablist" aria-label="Editor preview mode">
          <button
            type="button"
            className={`button button--ghost preview-mode-bar__button ${
              previewMode === PREVIEW_MODE.EDIT ? "preview-mode-bar__button--active" : ""
            }`}
            onClick={() => setPreviewMode(PREVIEW_MODE.EDIT)}
          >
            Edit
          </button>
          <button
            type="button"
            className={`button button--ghost preview-mode-bar__button ${
              previewMode === PREVIEW_MODE.PREVIEW ? "preview-mode-bar__button--active" : ""
            }`}
            onClick={() => setPreviewMode(PREVIEW_MODE.PREVIEW)}
          >
            Preview
          </button>
          <button
            type="button"
            className={`button button--ghost preview-mode-bar__button ${
              previewMode === PREVIEW_MODE.SPLIT ? "preview-mode-bar__button--active" : ""
            }`}
            onClick={() => setPreviewMode(PREVIEW_MODE.SPLIT)}
          >
            Split
          </button>
        </div>

        <div className={`post-editor-workspace post-editor-workspace--${previewMode.toLowerCase()}`}>
          <div className="post-editor-workspace__pane post-editor-workspace__pane--form">
            <label>
              Title
              <input
                name="title"
                value={draft.title}
                onChange={(event) => updateDraftField("title", event.target.value)}
                required
                minLength={4}
              />
            </label>

            <label>
              Custom Slug (optional)
              <input
                name="slug"
                value={draft.slug}
                onChange={(event) => updateDraftField("slug", event.target.value)}
                placeholder="auto-generated-from-title"
              />
            </label>

            <label>
              Excerpt
              <textarea
                name="excerpt"
                rows={3}
                value={draft.excerpt}
                onChange={(event) => updateDraftField("excerpt", event.target.value)}
              />
            </label>

            <label>
              Body (Markdown supported)
              <textarea
                ref={bodyTextareaRef}
                name="body"
                rows={14}
                value={draft.body}
                onChange={(event) => updateDraftField("body", event.target.value)}
                required
              />
            </label>
            <p className="staff-form__hint">
              Place media inline with <code>{"{{media:1}}"}</code>, <code>{"{{media:2}}"}</code>, etc. Tweets can be
              embedded inline using a media block set to <code>TWEET</code>.
            </p>

            <div className="staff-form__grid">
              <label>
                Author
                <select
                  name="authorId"
                  value={draft.authorId}
                  onChange={(event) => updateDraftField("authorId", event.target.value)}
                >
                  {authors.map((author) => (
                    <option key={author.id} value={author.id}>
                      {author.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Status
                <select
                  name="status"
                  value={draft.status}
                  onChange={(event) => updateDraftField("status", event.target.value as PostStatus)}
                >
                  <option value={POST_STATUS.DRAFT}>Draft</option>
                  <option value={POST_STATUS.SCHEDULED}>Scheduled</option>
                  <option value={POST_STATUS.PUBLISHED}>Published</option>
                </select>
              </label>

              <label>
                Category
                <select
                  name="categoryId"
                  value={draft.categoryId}
                  onChange={(event) => updateDraftField("categoryId", event.target.value)}
                >
                  <option value="">No category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Tags (comma-separated)
                <input
                  name="tags"
                  value={draft.tags}
                  onChange={(event) => updateDraftField("tags", event.target.value)}
                  placeholder="breaking news, analysis, markets"
                />
              </label>

              <label>
                Publish Date/Time
                <input
                  type="datetime-local"
                  name="publishedAt"
                  value={draft.publishedAt}
                  onChange={(event) => updateDraftField("publishedAt", event.target.value)}
                />
              </label>

              <label>
                Cover Image URL
                <input
                  type="url"
                  name="coverImageUrl"
                  value={draft.coverImageUrl}
                  onChange={(event) => updateDraftField("coverImageUrl", event.target.value)}
                />
              </label>

              <label>
                Cover Size Preset
                <select
                  name="coverImageSize"
                  value={draft.coverImageSize}
                  onChange={(event) => updateDraftField("coverImageSize", event.target.value as CoverImageSize)}
                >
                  <option value={COVER_IMAGE_SIZE.COMPACT}>Compact (recommended)</option>
                  <option value={COVER_IMAGE_SIZE.STANDARD}>Standard</option>
                  <option value={COVER_IMAGE_SIZE.FEATURE}>Feature</option>
                </select>
              </label>

              <label>
                Custom Cover Height (px)
                <input
                  type="number"
                  name="coverImageHeight"
                  min={160}
                  max={560}
                  step={10}
                  value={draft.coverImageHeight}
                  onChange={(event) => updateDraftField("coverImageHeight", event.target.value)}
                  placeholder="Optional override: 160-560"
                />
              </label>

              <label>
                Cover Image Alignment
                <select
                  name="coverImagePosition"
                  value={draft.coverImagePosition}
                  onChange={(event) =>
                    updateDraftField("coverImagePosition", event.target.value as CoverImagePosition)
                  }
                >
                  <option value={COVER_IMAGE_POSITION.TOP}>Top</option>
                  <option value={COVER_IMAGE_POSITION.CENTER}>Center</option>
                  <option value={COVER_IMAGE_POSITION.BOTTOM}>Bottom</option>
                </select>
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
                          current.map((entry) => (entry.id === item.id ? { ...entry, type: nextType } : entry)),
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
                          current.map((entry) => (entry.id === item.id ? { ...entry, url: nextUrl } : entry)),
                        );
                      }}
                      placeholder={item.type === "TWEET" ? "https://x.com/.../status/..." : "https://"}
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
                            entry.id === item.id ? { ...entry, caption: nextCaption } : entry,
                          ),
                        );
                      }}
                    />
                  </label>

                  <div className="media-editor__inline-tools">
                    <span className="media-editor__inline-token">
                      Inline token: <code>{`{{media:${index + 1}}}`}</code>
                    </span>
                    <button
                      type="button"
                      className="button button--ghost button--small"
                      onClick={() => insertInlineMediaToken(index)}
                    >
                      Insert Token in Body
                    </button>
                  </div>

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
          </div>

          <div className="post-editor-workspace__pane post-editor-workspace__pane--preview" aria-live="polite">
            <div className="post-preview">
              <p className="article__eyebrow">NN^2 · Live Preview</p>
              <h1>{draft.title.trim() || "Untitled Story"}</h1>
              <p className="article__meta">
                {draft.publishedAt ? new Date(draft.publishedAt).toLocaleString() : "Publish date preview"} ·{" "}
                {previewAuthorName}
              </p>

              {previewCategory || previewTags.length ? (
                <div className="taxonomy-strip">
                  {previewCategory ? (
                    <span className="taxonomy-pill taxonomy-pill--category">{previewCategory.name}</span>
                  ) : null}
                  {previewTags.map((tag) => (
                    <span key={tag} className="taxonomy-pill">
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}

              {draft.coverImageUrl.trim() ? (
                <div
                  className="article__cover-frame"
                  style={{ ["--article-cover-height" as string]: `${previewCoverHeight}px` }}
                >
                  <img
                    className={`article__cover article__cover--${draft.coverImageSize.toLowerCase()}`}
                    src={draft.coverImageUrl}
                    alt={draft.title || "Cover preview"}
                    style={{ objectPosition: previewCoverPosition }}
                  />
                </div>
              ) : null}

              <StoryBodyWithInlineMedia
                body={draft.body.trim() || "Write your story body to preview markdown output."}
                media={previewMedia.map((item) => ({ ...item, id: item.id }))}
              />

              {draft.excerpt.trim() ? <p className="post-preview__excerpt">{draft.excerpt}</p> : null}
            </div>
          </div>
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
