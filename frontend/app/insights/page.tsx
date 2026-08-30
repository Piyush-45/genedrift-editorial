import type { Metadata } from "next";
import { ArticleCard } from "@/components/article-card";
import { ArticleFilters } from "@/components/article-filters";
import { Pagination } from "@/components/pagination";
import { getArticles } from "@/lib/api";

export const metadata: Metadata = {
  title: "Insights",
  description: "Explore published ideas and analysis from GeneDrift."
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function value(input: string | string[] | undefined) {
  return typeof input === "string" ? input.trim().slice(0, 100) : "";
}

export default async function InsightsPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = value(params.q);
  const category = value(params.category);
  const tag = value(params.tag);
  const requestedPage = Number.parseInt(value(params.page), 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const data = await getArticles({ page, limit: 12, query, category, tag });

  return (
    <main className="shell archive-page">
      <div className="archive-heading">
        <span className="eyebrow">The GeneDrift archive</span>
        <h1>Insights</h1>
        <p>Browse independent perspectives across science, society, markets, and culture.</p>
      </div>
      <ArticleFilters query={query} category={category} tag={tag} categories={data.facets.categories} />
      {tag ? <div className="active-filter">Tag: <strong>{tag}</strong></div> : null}
      <div className="results-summary" aria-live="polite">
        {data.pagination.total} {data.pagination.total === 1 ? "insight" : "insights"}
      </div>
      {data.articles.length ? (
        <div className="article-grid archive-grid">
          {data.articles.map((article) => <ArticleCard key={article.publicationId} article={article} />)}
        </div>
      ) : (
        <div className="empty-state"><h2>No matching insights</h2><p>Try a broader search or clear the current filters.</p></div>
      )}
      <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} query={query} category={category} tag={tag} />
    </main>
  );
}
