"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type TweetEmbedFrameProps = {
  url: string;
};

type TwitterWidgetsApi = {
  widgets?: {
    load?: (element?: HTMLElement) => void;
  };
};

declare global {
  interface Window {
    twttr?: TwitterWidgetsApi;
  }
}

type EmbedState =
  | {
      status: "checking";
    }
  | {
      status: "ready";
      html: string;
    }
  | {
      status: "blocked";
      reason?: string;
    };

let twitterWidgetsScriptPromise: Promise<void> | null = null;

function loadTwitterWidgetsScript() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.twttr?.widgets?.load) {
    return Promise.resolve();
  }

  if (twitterWidgetsScriptPromise) {
    return twitterWidgetsScriptPromise;
  }

  twitterWidgetsScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://platform.twitter.com/widgets.js"]');

    if (existing) {
      const startedAt = Date.now();
      const intervalId = window.setInterval(() => {
        if (window.twttr?.widgets?.load) {
          window.clearInterval(intervalId);
          resolve();
          return;
        }

        if (Date.now() - startedAt > 10000) {
          window.clearInterval(intervalId);
          reject(new Error("widgets.js timed out"));
        }
      }, 120);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load widgets.js"));
    document.head.appendChild(script);
  });

  return twitterWidgetsScriptPromise;
}

export function TweetEmbedFrame({ url }: TweetEmbedFrameProps) {
  const [state, setState] = useState<EmbedState>({ status: "checking" });
  const hostRef = useRef<HTMLDivElement | null>(null);
  const endpoint = useMemo(() => `/api/social/x/oembed?url=${encodeURIComponent(url)}`, [url]);

  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();

    fetch(endpoint, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    })
      .then(async (response) => {
        const data = (await response.json().catch(() => ({}))) as {
          embeddable?: boolean;
          reason?: string;
          html?: string | null;
        };

        if (isCancelled) {
          return;
        }

        if (data.embeddable && typeof data.html === "string" && data.html.length > 0) {
          setState({ status: "ready", html: data.html });
          return;
        }

        setState({ status: "blocked", reason: data.reason });
      })
      .catch(() => {
        if (!isCancelled) {
          setState({ status: "blocked", reason: "fetch_failed" });
        }
      });

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [endpoint]);

  useEffect(() => {
    if (state.status !== "ready" || !hostRef.current) {
      return;
    }

    const host = hostRef.current;

    void loadTwitterWidgetsScript()
      .then(() => {
        window.twttr?.widgets?.load?.(host);
      })
      .catch(() => {
        // Raw oEmbed blockquote remains visible if widgets.js fails.
      });
  }, [state]);

  if (state.status === "checking") {
    return (
      <div className="media-frame media-frame--tweet media-frame--tweet-loading" aria-live="polite">
        <div className="tweet-loading-skeleton">
          <div className="tweet-loading-skeleton__line tweet-loading-skeleton__line--short" />
          <div className="tweet-loading-skeleton__line" />
          <div className="tweet-loading-skeleton__line" />
          <div className="tweet-loading-skeleton__line tweet-loading-skeleton__line--long" />
        </div>
        <p className="tweet-loading-skeleton__copy">Loading X post preview…</p>
      </div>
    );
  }

  if (state.status === "blocked") {
    return (
      <div className="media-frame media-frame--tweet media-frame--tweet-fallback">
        <p>This X post cannot be embedded in-page.</p>
        <p className="media-frame--tweet-fallback__detail">
          X occasionally blocks embedding for specific posts or accounts.
        </p>
        <a href={url} target="_blank" rel="noopener noreferrer">
          Open on X
        </a>
      </div>
    );
  }

  return (
    <div className="media-frame media-frame--tweet media-frame--tweet-widget">
      <div ref={hostRef} className="tweet-widget-host" dangerouslySetInnerHTML={{ __html: state.html }} />
    </div>
  );
}
