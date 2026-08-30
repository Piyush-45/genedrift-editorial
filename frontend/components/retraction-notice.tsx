import Link from "next/link";
import type { RetractionResponse } from "@/lib/types";

export function RetractionNotice({ retraction }: { retraction: RetractionResponse }) {
  return (
    <main className="shell narrow-page">
      <div className="status-card status-card-warning">
        <span className="eyebrow">Publication update</span>
        <h1>This article has been retracted</h1>
        <p>{retraction.reason || "This article is no longer available for public reading."}</p>
        {retraction.replacementPath ? (
          <Link className="button button-primary" href={retraction.replacementPath}>Read the replacement</Link>
        ) : (
          <Link className="button button-primary" href="/insights">Browse current insights</Link>
        )}
      </div>
    </main>
  );
}
