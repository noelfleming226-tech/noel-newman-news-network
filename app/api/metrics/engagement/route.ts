import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import {
  createAnalyticsSessionId,
  getAnalyticsSessionCookieConfig,
  getAnalyticsSessionCookieName,
  recordPostEngagement,
} from "@/lib/analytics";

const engagementPayloadSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("LINK_CLICK"),
    postId: z.string().min(1),
    path: z.string().min(1).max(240),
    targetUrl: z.string().url().max(500),
  }),
  z.object({
    type: z.literal("TIME_ON_PAGE"),
    postId: z.string().min(1),
    path: z.string().min(1).max(240),
    secondsOnPage: z.number().int().min(0).max(60 * 60),
  }),
]);

export async function POST(request: NextRequest) {
  let payload: z.infer<typeof engagementPayloadSchema>;

  try {
    payload = engagementPayloadSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const cookieName = getAnalyticsSessionCookieName();
  const existingSessionId = request.cookies.get(cookieName)?.value;
  const sessionId = existingSessionId ?? createAnalyticsSessionId();
  const userAgent = request.headers.get("user-agent");
  const referrer = request.headers.get("referer");

  const result = await recordPostEngagement({
    postId: payload.postId,
    path: payload.path,
    type: payload.type,
    sessionId,
    userAgent,
    referrer,
    targetUrl: "targetUrl" in payload ? payload.targetUrl : null,
    secondsOnPage: "secondsOnPage" in payload ? payload.secondsOnPage : null,
  });

  const response = NextResponse.json({ ok: true, ...result });

  if (!existingSessionId) {
    const { name, maxAge } = getAnalyticsSessionCookieConfig();
    response.cookies.set({
      name,
      value: sessionId,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge,
    });
  }

  return response;
}

