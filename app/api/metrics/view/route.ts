import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import {
  createAnalyticsSessionId,
  getAnalyticsSessionCookieConfig,
  getAnalyticsSessionCookieName,
  recordPostView,
} from "@/lib/analytics";

const viewPayloadSchema = z.object({
  postId: z.string().min(1),
  path: z.string().min(1).max(240),
});

export async function POST(request: NextRequest) {
  let payload: z.infer<typeof viewPayloadSchema>;

  try {
    payload = viewPayloadSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const cookieName = getAnalyticsSessionCookieName();
  const existingSessionId = request.cookies.get(cookieName)?.value;
  const sessionId = existingSessionId ?? createAnalyticsSessionId();
  const userAgent = request.headers.get("user-agent");
  const referrer = request.headers.get("referer");

  const result = await recordPostView({
    postId: payload.postId,
    path: payload.path,
    sessionId,
    userAgent,
    referrer,
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

