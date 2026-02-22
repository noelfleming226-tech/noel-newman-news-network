"use client";

import { useEffect } from "react";

type PostViewTrackerProps = {
  postId: string;
};

const CLIENT_DEDUPE_WINDOW_MS = 30 * 60 * 1000;

export function PostViewTracker({ postId }: PostViewTrackerProps) {
  useEffect(() => {
    if (!postId || typeof window === "undefined") {
      return;
    }

    const storageKey = `nn2:view:${postId}`;
    const now = Date.now();

    try {
      const previous = window.sessionStorage.getItem(storageKey);
      if (previous && now - Number(previous) < CLIENT_DEDUPE_WINDOW_MS) {
        return;
      }
      window.sessionStorage.setItem(storageKey, String(now));
    } catch {
      // Best-effort only. Server-side dedupe is authoritative.
    }

    const payload = JSON.stringify({
      postId,
      path: window.location.pathname,
    });

    const sendWithFetch = () =>
      fetch("/api/metrics/view", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: payload,
        credentials: "same-origin",
        keepalive: true,
      }).catch(() => undefined);

    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      try {
        const blob = new Blob([payload], { type: "application/json" });
        const queued = navigator.sendBeacon("/api/metrics/view", blob);
        if (queued) {
          return;
        }
      } catch {
        // Fallback to fetch below.
      }
    }

    void sendWithFetch();
  }, [postId]);

  return null;
}

