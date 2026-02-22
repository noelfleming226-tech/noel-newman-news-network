"use server";

import { compare } from "bcryptjs";
import { z } from "zod";

import { createStaffSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type LoginState = {
  success?: boolean;
  error?: string;
};

const loginSchema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(1),
});

export async function loginAction(_: LoginState, formData: FormData): Promise<LoginState> {
  const parsedResult = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });

  if (!parsedResult.success) {
    return {
      error: "Enter your username/email and password.",
    };
  }

  const { identifier, password } = parsedResult.data;

  const staffUser = await prisma.user.findFirst({
    where: {
      OR: [
        {
          email: identifier,
        },
        {
          username: identifier,
        },
      ],
    },
  });

  if (!staffUser) {
    return {
      error: "Invalid credentials.",
    };
  }

  const matches = await compare(password, staffUser.passwordHash);

  if (!matches) {
    return {
      error: "Invalid credentials.",
    };
  }

  await createStaffSession(staffUser.id);

  return { success: true };
}
