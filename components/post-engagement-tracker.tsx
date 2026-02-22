"use client";

import { useEffect } from "react";

type PostEngagementTrackerProps = {
  postId: string;
};

function postEngagement(payload: Record<string, unknown>, options?: { preferBeacon?: boolean }) {
  const body = JSON.stringify(payload);

  if (options?.preferBeacon && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    try {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/metrics/engagement", blob)) {
        return;
      }
    } catch {
      // Fallback below.
    }
  }

  void fetch("/api/metrics/engagement", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body,
    keepalive: true,
  }).catch(() => undefined);
}

export function PostEngagementTracker({ postId }: PostEngagementTrackerProps) {
  useEffect(() => {
    if (typeof window === "undefined" || !postId) {
      return;
    }

    const startedAt = Date.now();
    let timeSent = false;
    const path = window.location.pathname;

    const articleRoot = document.querySelector("article.article");
    if (!articleRoot) {
      return;
    }

    const clickHandler = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const link = target?.closest("a");
      if (!link) {
        return;
      }

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) {
        return;
      }

      let url: URL;
      try {
        url = new URL(link.href, window.location.origin);
      } catch {
        return;
      }

      if (url.origin === window.location.origin && url.pathname.startsWith("/articles/")) {
        return;
      }

      sendTimeOnPage("active");
      postEngagement({
        type: "LINK_CLICK",
        postId,
        path,
        targetUrl: url.toString(),
      }, { preferBeacon: false });
    };

    const sendTimeOnPage = (reason: "active" | "hidden" = "hidden") => {
      if (timeSent) {
        return;
      }

      timeSent = true;
      const secondsOnPage = Math.round((Date.now() - startedAt) / 1000);
      postEngagement(
        {
          type: "TIME_ON_PAGE",
          postId,
          path,
          secondsOnPage,
        },
        { preferBeacon: reason === "hidden" },
      );
    };

    const visibilityHandler = () => {
      if (document.visibilityState === "hidden") {
        sendTimeOnPage("hidden");
      }
    };

    const pageHideHandler = () => sendTimeOnPage("hidden");

    articleRoot.addEventListener("click", clickHandler);
    document.addEventListener("visibilitychange", visibilityHandler);
    window.addEventListener("pagehide", pageHideHandler);

    return () => {
      articleRoot.removeEventListener("click", clickHandler);
      document.removeEventListener("visibilitychange", visibilityHandler);
      window.removeEventListener("pagehide", pageHideHandler);
      sendTimeOnPage("hidden");
    };
  }, [postId]);

  return null;
}
