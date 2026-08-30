import Link from "next/link";
import { ArticleCard } from "@/components/article-card";
import { getArticles } from "@/lib/api";

export default async function HomePage() {
  const data = await getArticles({ limit: 7 });
  const [lead, ...latest] = data.articles;

  return (
    <main>
      <section className="hero shell">
        <span className="eyebrow">Ideas worth understanding</span>
        <h1>Clear thinking for a changing world.</h1>
        <p>Evidence-led stories and independent perspectives from GeneDrift’s editorial community.</p>
        <Link className="button button-primary" href="/insights">Explore all insights</Link>
      </section>

      <section className="shell section-block" aria-labelledby="featured-heading">
        <div className="section-heading">
          <div><span className="eyebrow">Editor’s desk</span><h2 id="featured-heading">Latest insights</h2></div>
          <Link href="/insights">View all <span aria-hidden="true">→</span></Link>
        </div>
        {lead ? (
          <>
            <ArticleCard article={lead} featured />
            {latest.length ? <div className="article-grid">{latest.map((article) => <ArticleCard key={article.publicationId} article={article} />)}</div> : null}
          </>
        ) : (
          <div className="empty-state"><h2>New stories are on the way</h2><p>Check back soon for the latest GeneDrift insights.</p></div>
        )}
      </section>
    </main>
  );
}
