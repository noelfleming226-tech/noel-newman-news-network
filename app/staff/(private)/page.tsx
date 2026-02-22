import Link from "next/link";

import { format } from "date-fns";

import { getStaffPostIndex } from "@/lib/posts";

export const metadata = {
  title: "Staff Dashboard | Noel Newman News Network",
};

export default async function StaffDashboardPage() {
  const posts = await getStaffPostIndex();

  return (
    <section className="staff-panel">
      <div className="staff-panel__head">
        <h1>NN^2 Publishing Dashboard</h1>
        <p>Manage drafts, scheduled stories, and live posts in one place.</p>
      </div>

      <div className="staff-panel__actions">
        <Link href="/staff/posts/new" className="button button--primary">
          Create New Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="staff-empty">No posts yet. Start by creating your first article.</p>
      ) : (
        <div className="staff-table-wrap">
          <table className="staff-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Author</th>
                <th>Publish Date</th>
                <th>Media Blocks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>
                    <strong>{post.title}</strong>
                    <p className="staff-table__slug">/{post.slug}</p>
                  </td>
                  <td>
                    <span className={`pill pill--${post.status.toLowerCase()}`}>{post.status}</span>
                  </td>
                  <td>{post.author.name}</td>
                  <td>{post.publishedAt ? format(post.publishedAt, "PPp") : "Not set"}</td>
                  <td>{post.media.length}</td>
                  <td>
                    <div className="staff-table__actions">
                      <Link href={`/staff/posts/${post.id}/edit`}>Edit</Link>
                      <Link href={`/articles/${post.slug}`} target="_blank" rel="noopener noreferrer">
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
