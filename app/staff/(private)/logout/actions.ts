"use server";

import { redirect } from "next/navigation";

import { clearStaffSession } from "@/lib/auth";

export async function logoutAction() {
  await clearStaffSession();
  redirect("/staff/login");
}
