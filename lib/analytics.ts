import { createHash, randomUUID } from "node:crypto";

import { addDays, format, startOfDay, subDays } from "date-fns";

import { prisma } from "@/lib/prisma";

const VIEW_DEDUPE_WINDOW_MINUTES = 30;
const ANALYTICS_SESSION_COOKIE = "nn2_anon_sid";
const ANALYTICS_SESSION_COOKIE_TTL_SECONDS = 60 * 60 * 24 * 365;

type RecordPostViewParams = {
  postId: string;
  sessionId: string;
  path: string;
  userAgent?: string | null;
  referrer?: string | null;
};

type RecordPostEngagementParams = {
  postId: string;
  sessionId: string;
  path: string;
  type: "LINK_CLICK" | "TIME_ON_PAGE";
  userAgent?: string | null;
  referrer?: string | null;
  targetUrl?: string | null;
  secondsOnPage?: number | null;
};

const TIME_ON_PAGE_DEDUPE_WINDOW_MINUTES = 10;

export type StaffAnalyticsSummary = {
  windowDays: number;
  generatedAt: Date;
  totals: {
    views: number;
    uniqueViews: number;
    linkClicks: number;
    timedSessions: number;
    avgSecondsOnPage: number;
  };
  daily: Array<{
    dateKey: string;
    label: string;
    views: number;
    uniqueViews: number;
    linkClicks: number;
    avgSecondsOnPage: number;
  }>;
  topPosts: Array<{
    postId: string;
    title: string;
    slug: string;
    views: number;
    uniqueViews: number;
    linkClicks: number;
    avgSecondsOnPage: number;
  }>;
  referrers: Array<{
    label: string;
    views: number;
    uniqueViews: number;
  }>;
  postWindowMetrics: Record<
    string,
    {
      views: number;
      uniqueViews: number;
      linkClicks: number;
      avgSecondsOnPage: number;
    }
  >;
  postLifetimeViews: Record<string, number>;
};

function normalizePath(path: string) {
  if (!path.startsWith("/")) {
    return "/";
  }

  return path.slice(0, 240);
}

function normalizeReferrerHost(referrer?: string | null) {
  if (!referrer) {
    return "direct";
  }

  try {
    const url = new URL(referrer);
    return (url.hostname || "direct").toLowerCase().slice(0, 120);
  } catch {
    return "unknown";
  }
}

function normalizeUrlForStorage(urlValue?: string | null) {
  if (!urlValue) {
    return null;
  }

  try {
    const parsed = new URL(urlValue);
    return parsed.toString().slice(0, 500);
  } catch {
    return null;
  }
}

function normalizeTargetHost(targetUrl?: string | null) {
  const normalizedUrl = normalizeUrlForStorage(targetUrl);
  if (!normalizedUrl) {
    return null;
  }

  try {
    return new URL(normalizedUrl).hostname.toLowerCase().slice(0, 120);
  } catch {
    return null;
  }
}

function hashValue(value: string) {
  const salt = process.env.ANALYTICS_SALT ?? "nn2-analytics-salt";

  return createHash("sha256").update(`${salt}:${value}`).digest("hex");
}

export function createAnalyticsSessionId() {
  return `nn2_${randomUUID()}`;
}

export function getAnalyticsSessionCookieConfig() {
  return {
    name: ANALYTICS_SESSION_COOKIE,
    maxAge: ANALYTICS_SESSION_COOKIE_TTL_SECONDS,
  };
}

export function getAnalyticsSessionCookieName() {
  return ANALYTICS_SESSION_COOKIE;
}

export async function recordPostView(params: RecordPostViewParams) {
  const now = new Date();
  const dedupeThreshold = new Date(now.getTime() - VIEW_DEDUPE_WINDOW_MINUTES * 60 * 1000);
  const sessionKeyHash = hashValue(params.sessionId);
  const userAgentHash = params.userAgent ? hashValue(params.userAgent) : null;
  const referrerHost = normalizeReferrerHost(params.referrer);
  const path = normalizePath(params.path);

  const post = await prisma.post.findFirst({
    where: {
      id: params.postId,
      OR: [
        {
          status: "PUBLISHED",
          publishedAt: {
            lte: now,
          },
        },
        {
          status: "SCHEDULED",
          publishedAt: {
            lte: now,
          },
        },
      ],
    },
    select: {
      id: true,
    },
  });

  if (!post) {
    return { recorded: false, reason: "post_not_visible" as const };
  }

  const existingRecentEvent = await prisma.postViewEvent.findFirst({
    where: {
      postId: params.postId,
      sessionKeyHash,
      occurredAt: {
        gte: dedupeThreshold,
      },
    },
    select: {
      id: true,
    },
    orderBy: {
      occurredAt: "desc",
    },
  });

  if (existingRecentEvent) {
    return { recorded: false, reason: "deduped" as const };
  }

  await prisma.postViewEvent.create({
    data: {
      postId: params.postId,
      sessionKeyHash,
      userAgentHash,
      referrerHost,
      path,
      occurredAt: now,
    },
  });

  return { recorded: true as const };
}

export async function recordPostEngagement(params: RecordPostEngagementParams) {
  const now = new Date();
  const sessionKeyHash = hashValue(params.sessionId);
  const userAgentHash = params.userAgent ? hashValue(params.userAgent) : null;
  const referrerHost = normalizeReferrerHost(params.referrer);
  const path = normalizePath(params.path);

  const post = await prisma.post.findFirst({
    where: {
      id: params.postId,
      OR: [
        {
          status: "PUBLISHED",
          publishedAt: {
            lte: now,
          },
        },
        {
          status: "SCHEDULED",
          publishedAt: {
            lte: now,
          },
        },
      ],
    },
    select: {
      id: true,
    },
  });

  if (!post) {
    return { recorded: false, reason: "post_not_visible" as const };
  }

  if (params.type === "TIME_ON_PAGE") {
    const seconds = Math.max(0, Math.min(Math.round(params.secondsOnPage ?? 0), 60 * 60));
    if (seconds < 3) {
      return { recorded: false, reason: "too_short" as const };
    }

    const dedupeThreshold = new Date(now.getTime() - TIME_ON_PAGE_DEDUPE_WINDOW_MINUTES * 60 * 1000);
    const recent = await prisma.postEngagementEvent.findFirst({
      where: {
        postId: params.postId,
        type: "TIME_ON_PAGE",
        sessionKeyHash,
        occurredAt: {
          gte: dedupeThreshold,
        },
      },
      select: {
        id: true,
      },
      orderBy: {
        occurredAt: "desc",
      },
    });

    if (recent) {
      return { recorded: false, reason: "deduped" as const };
    }

    await prisma.postEngagementEvent.create({
      data: {
        postId: params.postId,
        type: "TIME_ON_PAGE",
        sessionKeyHash,
        userAgentHash,
        referrerHost,
        path,
        secondsOnPage: seconds,
        occurredAt: now,
      },
    });

    return { recorded: true as const };
  }

  const targetUrl = normalizeUrlForStorage(params.targetUrl);
  const targetHost = normalizeTargetHost(targetUrl);

  if (!targetUrl) {
    return { recorded: false, reason: "missing_target" as const };
  }

  await prisma.postEngagementEvent.create({
    data: {
      postId: params.postId,
      type: "LINK_CLICK",
      sessionKeyHash,
      userAgentHash,
      referrerHost,
      path,
      targetUrl,
      targetHost,
      occurredAt: now,
    },
  });

  return { recorded: true as const };
}

export async function getStaffAnalyticsSummary(windowDays = 14): Promise<StaffAnalyticsSummary> {
  const today = startOfDay(new Date());
  const start = subDays(today, Math.max(windowDays - 1, 0));
  const endExclusive = addDays(today, 1);

  const events = await prisma.postViewEvent.findMany({
    where: {
      occurredAt: {
        gte: start,
        lt: endExclusive,
      },
    },
    select: {
      postId: true,
      sessionKeyHash: true,
      referrerHost: true,
      occurredAt: true,
      post: {
        select: {
          title: true,
          slug: true,
        },
      },
    },
    orderBy: {
      occurredAt: "asc",
    },
  });

  const lifetimeCounts = await prisma.postViewEvent.groupBy({
    by: ["postId"],
    _count: {
      _all: true,
    },
  });

  const engagementEvents = await prisma.postEngagementEvent.findMany({
    where: {
      occurredAt: {
        gte: start,
        lt: endExclusive,
      },
    },
    select: {
      postId: true,
      type: true,
      sessionKeyHash: true,
      secondsOnPage: true,
      targetHost: true,
      occurredAt: true,
    },
    orderBy: {
      occurredAt: "asc",
    },
  });

  const dailyMap = new Map<
    string,
    { views: number; sessions: Set<string>; linkClicks: number; timeTotalSeconds: number; timeSamples: number }
  >();
  const postMap = new Map<
    string,
    {
      title: string;
      slug: string;
      views: number;
      sessions: Set<string>;
      linkClicks: number;
      timeTotalSeconds: number;
      timeSamples: number;
    }
  >();
  const referrerMap = new Map<string, { views: number; sessions: Set<string> }>();
  const totalSessions = new Set<string>();

  for (const event of events) {
    const dateKey = format(event.occurredAt, "yyyy-MM-dd");
    const dailyEntry =
      dailyMap.get(dateKey) ??
      { views: 0, sessions: new Set<string>(), linkClicks: 0, timeTotalSeconds: 0, timeSamples: 0 };
    dailyEntry.views += 1;
    dailyEntry.sessions.add(event.sessionKeyHash);
    dailyMap.set(dateKey, dailyEntry);

    const postEntry =
      postMap.get(event.postId) ??
      ({
        title: event.post.title,
        slug: event.post.slug,
        views: 0,
        sessions: new Set<string>(),
        linkClicks: 0,
        timeTotalSeconds: 0,
        timeSamples: 0,
      } as const);

    const mutablePostEntry = {
      ...postEntry,
      sessions: new Set(postEntry.sessions),
    };
    mutablePostEntry.views += 1;
    mutablePostEntry.sessions.add(event.sessionKeyHash);
    postMap.set(event.postId, mutablePostEntry);

    const referrerLabel = event.referrerHost || "direct";
    const refEntry = referrerMap.get(referrerLabel) ?? { views: 0, sessions: new Set<string>() };
    refEntry.views += 1;
    refEntry.sessions.add(event.sessionKeyHash);
    referrerMap.set(referrerLabel, refEntry);

    totalSessions.add(event.sessionKeyHash);
  }

  let totalLinkClicks = 0;
  let totalTimedSessions = 0;
  let totalSecondsOnPage = 0;

  for (const event of engagementEvents) {
    const dateKey = format(event.occurredAt, "yyyy-MM-dd");
    const dailyEntry =
      dailyMap.get(dateKey) ??
      { views: 0, sessions: new Set<string>(), linkClicks: 0, timeTotalSeconds: 0, timeSamples: 0 };

    const postEntry = postMap.get(event.postId);
    if (!postEntry) {
      continue;
    }

    if (event.type === "LINK_CLICK") {
      dailyEntry.linkClicks += 1;
      postEntry.linkClicks += 1;
      totalLinkClicks += 1;
    }

    if (event.type === "TIME_ON_PAGE" && typeof event.secondsOnPage === "number") {
      dailyEntry.timeTotalSeconds += event.secondsOnPage;
      dailyEntry.timeSamples += 1;
      postEntry.timeTotalSeconds += event.secondsOnPage;
      postEntry.timeSamples += 1;
      totalTimedSessions += 1;
      totalSecondsOnPage += event.secondsOnPage;
    }

    dailyMap.set(dateKey, dailyEntry);
    postMap.set(event.postId, postEntry);
  }

  const daily: StaffAnalyticsSummary["daily"] = [];
  for (let i = 0; i < windowDays; i += 1) {
    const date = addDays(start, i);
    const dateKey = format(date, "yyyy-MM-dd");
    const entry = dailyMap.get(dateKey);
    daily.push({
      dateKey,
      label: format(date, windowDays > 10 ? "MMM d" : "EEE"),
      views: entry?.views ?? 0,
      uniqueViews: entry?.sessions.size ?? 0,
      linkClicks: entry?.linkClicks ?? 0,
      avgSecondsOnPage:
        entry && entry.timeSamples > 0 ? Math.round(entry.timeTotalSeconds / entry.timeSamples) : 0,
    });
  }

  const postWindowMetrics = Object.fromEntries(
    Array.from(postMap.entries()).map(([postId, entry]) => [
      postId,
      {
        views: entry.views,
        uniqueViews: entry.sessions.size,
        linkClicks: entry.linkClicks,
        avgSecondsOnPage:
          entry.timeSamples > 0 ? Math.round(entry.timeTotalSeconds / entry.timeSamples) : 0,
      },
    ]),
  );

  const topPosts = Array.from(postMap.entries())
    .map(([postId, entry]) => ({
      postId,
      title: entry.title,
      slug: entry.slug,
      views: entry.views,
      uniqueViews: entry.sessions.size,
      linkClicks: entry.linkClicks,
      avgSecondsOnPage:
        entry.timeSamples > 0 ? Math.round(entry.timeTotalSeconds / entry.timeSamples) : 0,
    }))
    .sort((a, b) => b.views - a.views || b.uniqueViews - a.uniqueViews || a.title.localeCompare(b.title))
    .slice(0, 8);

  const referrers = Array.from(referrerMap.entries())
    .map(([label, entry]) => ({
      label,
      views: entry.views,
      uniqueViews: entry.sessions.size,
    }))
    .sort((a, b) => b.views - a.views || b.uniqueViews - a.uniqueViews || a.label.localeCompare(b.label))
    .slice(0, 8);

  const postLifetimeViews = Object.fromEntries(
    lifetimeCounts.map((item) => [item.postId, item._count._all]),
  );

  return {
    windowDays,
    generatedAt: new Date(),
    totals: {
      views: events.length,
      uniqueViews: totalSessions.size,
      linkClicks: totalLinkClicks,
      timedSessions: totalTimedSessions,
      avgSecondsOnPage: totalTimedSessions > 0 ? Math.round(totalSecondsOnPage / totalTimedSessions) : 0,
    },
    daily,
    topPosts,
    referrers,
    postWindowMetrics,
    postLifetimeViews,
  };
}
