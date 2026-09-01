import Link from "next/link";
import { categoryPath, formatPublishedDate } from "@/lib/format";
import type { ArticleSummary } from "@/lib/types";

export function ArticleCard({ article, featured = false }: { article: ArticleSummary; featured?: boolean }) {
  return (
    <article className={`article-card${featured ? " article-card-featured" : ""}`}>
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
          <span>GeneDrift</span>
        </div>
      )}
      <div className="card-body">
        <Link className="category-link" href={categoryPath(article.primaryCategory)}>
          {article.primaryCategory}
        </Link>
        <h2><Link href={`/insights/${article.slug}`}>{article.title}</Link></h2>
        {article.excerpt ? <p className="card-excerpt">{article.excerpt}</p> : null}
        <div className="article-meta">
          <time dateTime={article.publishedAt}>{formatPublishedDate(article.publishedAt)}</time>
          <span aria-hidden="true">·</span>
          <span>{article.readingTimeMinutes} min read</span>
        </div>
      </div>
    </article>
  );
}
