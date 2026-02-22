import { NextResponse } from "next/server";

import { extractTweetStatusId } from "@/lib/post-utils";

function isAllowedTweetUrl(rawUrl: string) {
  try {
    const candidate = new URL(rawUrl);
    const hostname = candidate.hostname.toLowerCase();
    return hostname.includes("x.com") || hostname.includes("twitter.com");
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url")?.trim() ?? "";

  if (!targetUrl || !isAllowedTweetUrl(targetUrl)) {
    return NextResponse.json(
      {
        embeddable: false,
        reason: "invalid_url",
      },
      { status: 400 },
    );
  }

  const tweetId = extractTweetStatusId(targetUrl);

  if (!tweetId) {
    return NextResponse.json(
      {
        embeddable: false,
        reason: "invalid_tweet_id",
      },
      { status: 400 },
    );
  }

  const endpoint = new URL("https://publish.twitter.com/oembed");
  endpoint.searchParams.set("url", targetUrl);
  endpoint.searchParams.set("omit_script", "true");
  endpoint.searchParams.set("dnt", "true");
  endpoint.searchParams.set("theme", "dark");
  endpoint.searchParams.set("align", "left");
  endpoint.searchParams.set("maxwidth", "500");

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json,text/plain,*/*",
      },
      next: {
        revalidate: 300,
      },
    });

    const contentType = response.headers.get("content-type") ?? "";

    if (!response.ok || !contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json({
        embeddable: false,
        reason: "oembed_unavailable",
      });
    }

    const payload = (await response.json()) as {
      html?: unknown;
      author_name?: unknown;
      provider_name?: unknown;
    };

    const hasHtml = typeof payload.html === "string" && payload.html.length > 0;

    return NextResponse.json({
      embeddable: hasHtml,
      reason: hasHtml ? "ok" : "missing_html",
      html: hasHtml ? payload.html : null,
      authorName: typeof payload.author_name === "string" ? payload.author_name : null,
      providerName: typeof payload.provider_name === "string" ? payload.provider_name : null,
    });
  } catch {
    return NextResponse.json({
      embeddable: false,
      reason: "network_error",
    });
  }
}
