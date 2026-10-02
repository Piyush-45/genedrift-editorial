import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarDays, Layers3 } from "lucide-react";
import { ArticleCard } from "@/components/article-card";
import { ArticleFilters } from "@/components/article-filters";
import { Pagination } from "@/components/pagination";
import { getArticles } from "@/lib/api";

export const metadata: Metadata = {
  title: "Regulatory Insights",
  description: "Explore published regulatory intelligence, market updates and editorial analysis from Genedrift."
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
  const emptyData = {
    ok: true as const,
    articles: [],
    pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
    facets: { categories: [], tags: [] }
  };
  const [data, overview] = await Promise.all([
    getArticles({ page, limit: 12, query, category, tag }).catch(() => emptyData),
    getArticles({ page: 1, limit: 1 }).catch(() => emptyData)
  ]);

  if (data.pagination.totalPages > 0 && page > data.pagination.totalPages) {
    const corrected = new URLSearchParams();
    corrected.set("page", String(data.pagination.totalPages));
    if (query) corrected.set("q", query);
    if (category) corrected.set("category", category);
    if (tag) corrected.set("tag", tag);
    redirect(`/insights?${corrected}`);
  }

  const hasActiveFilters = Boolean(query || category || tag);
  const featured = !hasActiveFilters && page === 1 ? data.articles[0] : null;
  const articles = featured ? data.articles.slice(1) : data.articles;
  const latestPublication = overview.articles[0]?.publishedAt;
  const resultLabel = query
    ? `Search results for “${query}”`
    : category
      ? category
      : tag
        ? `Topic: ${tag}`
        : page > 1
          ? "More regulatory intelligence"
          : "Latest intelligence";

  return (
    <main className="archive-page">
      <section className="archive-hero">
        <div className="shell archive-hero-layout">
          <div className="archive-heading">
            <span className="eyebrow">The Genedrift intelligence desk</span>
            <h1>Regulatory intelligence, carefully reviewed.</h1>
            <p>Decision-ready analysis, authority updates and market guidance for teams operating across complex regulatory environments.</p>
          </div>
          <dl className="archive-overview" aria-label="Insights archive overview">
            <div>
              <dt>Published insights</dt>
              <dd>{overview.pagination.total}</dd>
            </div>
            <div>
              <dt>Subject areas</dt>
              <dd>{overview.facets.categories.length}</dd>
            </div>
            {latestPublication ? (
              <div>
                <dt>Latest publication</dt>
                <dd><CalendarDays aria-hidden="true" size={16} />{new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(latestPublication))}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </section>

      {overview.facets.categories.length ? (
        <nav className="archive-subjects" aria-label="Browse insights by subject">
          <div className="shell archive-subjects-inner">
            <span><Layers3 aria-hidden="true" size={15} />Browse by subject</span>
            <div>
              <Link
                aria-current={!hasActiveFilters ? "page" : undefined}
                className={!hasActiveFilters ? "is-active" : undefined}
                href="/insights"
              >
                All insights
              </Link>
              {overview.facets.categories.map((item) => (
                <Link
                  aria-current={category === item ? "page" : undefined}
                  className={category === item ? "is-active" : undefined}
                  key={item}
                  href={`/insights?category=${encodeURIComponent(item)}`}
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      ) : null}

      <section className="shell archive-content">
        <div className="archive-filter-panel">
          <div className="archive-filter-intro">
            <span className="section-eyebrow">Find an insight</span>
            <p>Search by keyword or narrow the archive to a specific regulatory subject.</p>
          </div>
          <ArticleFilters query={query} category={category} tag={tag} categories={overview.facets.categories} />
        </div>

        {featured ? (
          <section className="archive-featured" aria-labelledby="featured-insight-heading">
            <div className="archive-section-heading">
              <div>
                <span className="section-eyebrow">Editor’s lead</span>
                <h2 id="featured-insight-heading">Featured insight</h2>
              </div>
              <span>Current analysis from the Genedrift intelligence desk</span>
            </div>
            <ArticleCard article={featured} featured />
          </section>
        ) : null}

        <section className="archive-results" aria-labelledby="archive-results-heading">
          <div className="archive-section-heading archive-results-heading">
            <div>
              <span className="section-eyebrow">Archive</span>
              <h2 id="archive-results-heading">{resultLabel}</h2>
            </div>
            <p className="results-summary" aria-live="polite">
              {data.pagination.total} {data.pagination.total === 1 ? "published insight" : "published insights"}
            </p>
          </div>
          {hasActiveFilters ? (
            <div className="active-filter-summary">
              <span>Active view</span>
              <div>
                {query ? <span>Keyword: <strong>{query}</strong></span> : null}
                {category ? <span>Subject: <strong>{category}</strong></span> : null}
                {tag ? <span>Topic: <strong>{tag}</strong></span> : null}
              </div>
              <Link href="/insights">Reset archive <ArrowRight aria-hidden="true" size={14} /></Link>
            </div>
          ) : null}
          {articles.length ? (
            <div className="article-grid archive-grid">
              {articles.map((article) => <ArticleCard key={article.publicationId} article={article} />)}
            </div>
          ) : featured ? (
            <p className="archive-single-note">More intelligence will appear here as it is published.</p>
          ) : (
            <div className="empty-state">
              <span className="section-eyebrow">No results</span>
              <h2>No matching insights</h2>
              <p>Try a broader keyword, choose another subject, or return to the full archive.</p>
              <Link className="gd-button gd-button-primary" href="/insights">View all insights</Link>
            </div>
          )}
          <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} query={query} category={category} tag={tag} />
        </section>
      </section>
    </main>
  );
}
