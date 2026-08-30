import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell narrow-page">
      <div className="status-card">
        <span className="eyebrow">404</span>
        <h1>We couldn’t find that page</h1>
        <p>The address may have changed, or the article may no longer exist.</p>
        <Link className="button button-primary" href="/insights">Browse insights</Link>
      </div>
    </main>
  );
}
