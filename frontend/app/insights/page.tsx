import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArticleCard } from "@/components/article-card";
import { ArticleFilters } from "@/components/article-filters";
import { Pagination } from "@/components/pagination";
import { getArticles } from "@/lib/api";

export const metadata: Metadata = {
  title: "Regulatory Insights",
  description: "Explore published regulatory intelligence, market updates and editorial analysis from GeneDrift."
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
  const data = await getArticles({ page, limit: 12, query, category, tag }).catch(() => ({
    ok: true as const,
    articles: [],
    pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
    facets: { categories: [], tags: [] }
  }));

  if (data.pagination.totalPages > 0 && page > data.pagination.totalPages) {
    const corrected = new URLSearchParams();
    corrected.set("page", String(data.pagination.totalPages));
    if (query) corrected.set("q", query);
    if (category) corrected.set("category", category);
    if (tag) corrected.set("tag", tag);
    redirect(`/insights?${corrected}`);
  }

  return (
    <main className="archive-page">
      <section className="archive-hero">
        <div className="shell archive-heading">
          <span className="eyebrow">The GeneDrift archive</span>
          <h1>Regulatory intelligence, carefully reviewed.</h1>
          <p>Browse market updates, operating notes and published analysis from GeneDrift’s editorial workflow.</p>
        </div>
      </section>
      <section className="shell section-block">
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
      </section>
    </main>
  );
}
