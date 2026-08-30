"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <main className="shell narrow-page">
      <div className="status-card">
        <span className="eyebrow">Temporary interruption</span>
        <h1>We couldn’t load this content</h1>
        <p>Please try again. If the problem continues, the publishing service may be briefly unavailable.</p>
        <button className="button button-primary" onClick={reset}>Try again</button>
      </div>
    </main>
  );
}
