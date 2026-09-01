"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="narrow-page shell">
      <section className="status-card">
        <span className="eyebrow">Temporary interruption</span>
        <h1>We could not load this page.</h1>
        <p>Please try again. If the issue continues, the content service may be temporarily unavailable.</p>
        <button className="button button-primary" type="button" onClick={reset}>Try again</button>
      </section>
    </main>
  );
}
