import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { FounderBranding } from "@/components/founder-branding";
import { requireStaffUser } from "@/lib/auth";

import { logoutAction } from "./logout/actions";

export default async function StaffPrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const staffUser = await requireStaffUser();

  return (
    <div className="staff-shell">
      <aside className="staff-sidebar">
        <BrandMark />
        <p className="staff-sidebar__role">Staff Console</p>
        <div className="staff-sidebar__founders">
          <FounderBranding mode="chips" compact />
        </div>
        <nav>
          <Link href="/staff">Dashboard</Link>
          <Link href="/staff/posts/new">New Post</Link>
          <Link href="/" target="_blank" rel="noopener noreferrer">
            Open Public Site
          </Link>
        </nav>
        <div className="staff-sidebar__user">
          <p>{staffUser.name}</p>
          <p>@{staffUser.username}</p>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="button button--ghost">
            Sign Out
          </button>
        </form>
      </aside>

      <main className="staff-main">{children}</main>
    </div>
  );
}
