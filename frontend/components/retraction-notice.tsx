import Link from "next/link";
import type { RetractionResponse } from "@/lib/types";

export function RetractionNotice({ retraction }: { retraction: RetractionResponse }) {
  return (
    <main className="narrow-page shell">
      <section className="status-card status-card-warning" aria-labelledby="retracted-heading">
        <span className="eyebrow">Publication update</span>
        <h1 id="retracted-heading">This article has been retracted</h1>
        {retraction.reason ? <p>{retraction.reason}</p> : <p>This article is no longer available in the public archive.</p>}
        {retraction.replacementPath ? (
          <Link className="button button-primary" href={retraction.replacementPath}>View replacement</Link>
        ) : (
          <Link className="button button-primary" href="/insights">Browse current insights</Link>
        )}
      </section>
    </main>
  );
}
