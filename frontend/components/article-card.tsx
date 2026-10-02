import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { categoryPath, formatPublishedDate } from "@/lib/format";
import type { ArticleSummary } from "@/lib/types";

export function ArticleCard({ article, featured = false }: { article: ArticleSummary; featured?: boolean }) {
  return (
    <article className={`article-card${featured ? " article-card-featured" : ""}`}>
      <Link className="card-media-link" href={`/insights/${article.slug}`} aria-label={`Read ${article.title}`}>
        {article.featuredMedia ? (
          <div className="card-media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.featuredMedia.publishedUrl}
              alt={article.featuredMedia.altText}
              width={article.featuredMedia.widthPixels}
              height={article.featuredMedia.heightPixels}
            />
          </div>
        ) : (
          <div className="card-media card-media-placeholder" aria-hidden="true">
            <span>Genedrift</span>
            <small>Regulatory intelligence</small>
          </div>
        )}
      </Link>
      <div className="card-body">
        <div className="card-kicker-row">
          <Link className="category-link" href={categoryPath(article.primaryCategory)}>
            {article.primaryCategory}
          </Link>
          {featured ? <span className="featured-label">Featured insight</span> : null}
        </div>
        <h2><Link href={`/insights/${article.slug}`}>{article.title}</Link></h2>
        {article.excerpt ? <p className="card-excerpt">{article.excerpt}</p> : null}
        {article.tags.length ? (
          <div className="card-topics" aria-label="Article topics">
            {article.tags.slice(0, 2).map((tag) => (
              <Link key={tag} href={`/insights?tag=${encodeURIComponent(tag)}`}>{tag}</Link>
            ))}
          </div>
        ) : null}
        <footer className="card-footer">
          <div className="article-meta">
            <time dateTime={article.publishedAt}>{formatPublishedDate(article.publishedAt)}</time>
            <span aria-hidden="true">·</span>
            <span>{article.readingTimeMinutes} min read</span>
          </div>
          <Link className="card-read-link" href={`/insights/${article.slug}`} aria-label={`Read ${article.title}`}>
            Read insight <ArrowUpRight aria-hidden="true" size={15} />
          </Link>
        </footer>
      </div>
    </article>
  );
}
