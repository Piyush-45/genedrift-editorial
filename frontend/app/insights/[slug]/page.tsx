import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RetractionNotice } from "@/components/retraction-notice";
import { ArticleRetractedError, PublicApiError, getArticle } from "@/lib/api";
import { categoryPath, formatPublishedDate } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

async function resolveArticle(slug: string) {
  try {
    return { detail: await getArticle(slug), retraction: null };
  } catch (error) {
    if (error instanceof ArticleRetractedError) return { detail: null, retraction: error.retraction };
    if (error instanceof PublicApiError && error.status === 404) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await resolveArticle(slug);
  if (result.retraction) return { title: "Article retracted", robots: { index: false, follow: false } };
  const article = result.detail!.article;
  const canonical = article.revision.canonicalUrlOverride || `/insights/${article.revision.slug}`;
  return {
    title: article.revision.seoTitle || article.revision.title,
    description: article.revision.seoDescription || article.revision.excerpt || undefined,
    alternates: { canonical },
    robots: article.revision.robotsDirective === "Index Follow" ? { index: true, follow: true } : {
      index: false,
      follow: article.revision.robotsDirective === "Noindex Follow"
    },
    openGraph: {
      type: "article",
      title: article.revision.seoTitle || article.revision.title,
      description: article.revision.seoDescription || article.revision.excerpt || undefined,
      publishedTime: article.publishedAt,
      tags: article.article.tags
    }
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const result = await resolveArticle(slug);
  if (result.retraction) return <RetractionNotice retraction={result.retraction} />;
  const article = result.detail!.article;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.revision.title,
    description: article.revision.seoDescription || article.revision.excerpt,
    datePublished: article.publishedAt,
    articleSection: article.article.primaryCategory,
    keywords: article.article.tags.join(", "),
    wordCount: article.revision.wordCount,
    publisher: { "@type": "Organization", name: "GeneDrift" }
  };

  return (
    <main className="article-page">
      <article>
        <header className="article-hero shell article-shell">
          <Link className="category-link" href={categoryPath(article.article.primaryCategory)}>{article.article.primaryCategory}</Link>
          <h1>{article.revision.title}</h1>
          {article.revision.excerpt ? <p className="article-deck">{article.revision.excerpt}</p> : null}
          <div className="article-meta">
            <time dateTime={article.publishedAt}>{formatPublishedDate(article.publishedAt)}</time>
            <span aria-hidden="true">·</span>
            <span>{article.revision.readingTimeMinutes} min read</span>
          </div>
        </header>
        <div className="article-content shell article-shell" dangerouslySetInnerHTML={{ __html: article.html }} />
        {article.article.tags.length ? (
          <footer className="article-tags shell article-shell" aria-label="Article tags">
            {article.article.tags.map((tag) => <Link key={tag} href={`/insights?tag=${encodeURIComponent(tag)}`}>{tag}</Link>)}
          </footer>
        ) : null}
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </main>
  );
}
