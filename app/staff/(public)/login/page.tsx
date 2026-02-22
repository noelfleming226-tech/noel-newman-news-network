import { redirect } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { getCurrentStaffUser } from "@/lib/auth";

import { LoginForm } from "./login-form";

export const metadata = {
  title: "Staff Login | Noel Newman News Network",
};

export default async function StaffLoginPage() {
  const existingStaffUser = await getCurrentStaffUser();

  if (existingStaffUser) {
    redirect("/staff");
  }

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="auth-page">
        <section className="auth-card">
          <p className="auth-card__eyebrow">Staff Access</p>
          <h1>Sign in to the Noel Newman News Network portal</h1>
          <p>
            Manage article publishing, mixed-media embeds, and future scheduling from this private staff console.
          </p>
          <LoginForm />
          <p className="auth-note">Only authorized staff should access this area.</p>
        </section>
      </main>
    </div>
  );
}
