import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="narrow-page shell">
      <section className="status-card">
        <span className="eyebrow">Not found</span>
        <h1>This page is not available.</h1>
        <p>The page may have moved, or it may not have been published yet.</p>
        <Link className="button button-primary" href="/">Return home</Link>
      </section>
    </main>
  );
}
