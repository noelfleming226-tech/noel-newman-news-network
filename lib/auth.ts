import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

const STAFF_SESSION_COOKIE = "nnn_staff_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;

function hashSessionToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export async function createStaffSession(userId: string): Promise<void> {
  const rawToken = randomBytes(32).toString("hex");
  const token = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set({
    name: STAFF_SESSION_COOKIE,
    value: rawToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function clearStaffSession(): Promise<void> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(STAFF_SESSION_COOKIE)?.value;

  if (rawToken) {
    await prisma.session.deleteMany({
      where: {
        token: hashSessionToken(rawToken),
      },
    });
  }

  cookieStore.delete(STAFF_SESSION_COOKIE);
}

export async function getCurrentStaffUser() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(STAFF_SESSION_COOKIE)?.value;

  if (!rawToken) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: {
      token: hashSessionToken(rawToken),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!session) {
    cookieStore.delete(STAFF_SESSION_COOKIE);
    return null;
  }

  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({
      where: {
        id: session.id,
      },
    });
    cookieStore.delete(STAFF_SESSION_COOKIE);
    return null;
  }

  return session.user;
}

export async function requireStaffUser() {
  const user = await getCurrentStaffUser();

  if (!user || (user.role !== UserRole.STAFF && user.role !== UserRole.ADMIN)) {
    redirect("/staff/login");
  }

  return user;
}
