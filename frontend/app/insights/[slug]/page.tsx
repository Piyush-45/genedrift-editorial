import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileCheck2
} from "lucide-react";
import { ArticleCard } from "@/components/article-card";
import {
  ArticleProgress,
  ArticleShare,
  ArticleToc,
  type ArticleHeading
} from "@/components/article-reading-tools";
import { RetractionNotice } from "@/components/retraction-notice";
import { ArticleRetractedError, PublicApiError, getArticle, getArticles } from "@/lib/api";
import { categoryPath, formatPublishedDate } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

type PreparedArticle = {
  html: string;
  headings: ArticleHeading[];
  keyTakeaways: string | null;
};

async function resolveArticle(slug: string) {
  try {
    return { detail: await getArticle(slug), retraction: null };
  } catch (error) {
    if (error instanceof ArticleRetractedError) return { detail: null, retraction: error.retraction };
    if (error instanceof PublicApiError && error.status === 404) notFound();
    throw error;
  }
}

function plainText(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function headingId(value: string): string {
  return value
    .toLowerCase()
    .replace(/&[a-z0-9#]+;/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";
}

function prepareArticleHtml(input: string): PreparedArticle {
  let html = input;
  let keyTakeaways: string | null = null;
  const takeawayPattern = /<h2>\s*Key Takeaways\s*<\/h2>\s*(<ul>[\s\S]*?<\/ul>)/i;
  const takeawayMatch = html.match(takeawayPattern);

  if (takeawayMatch) {
    keyTakeaways = takeawayMatch[1];
    html = html.replace(takeawayMatch[0], "");
  }

  const headings: ArticleHeading[] = [];
  const usedIds = new Map<string, number>();
  html = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/gi, (match, levelValue: string, content: string) => {
    const label = plainText(content);
    if (!label) return "";
    const base = headingId(label);
    const occurrence = usedIds.get(base) ?? 0;
    usedIds.set(base, occurrence + 1);
    const id = occurrence ? `${base}-${occurrence + 1}` : base;
    const level = Number(levelValue) as 2 | 3;
    headings.push({ id, label, level });
    return `<h${level} id="${id}">${content}</h${level}>`;
  });

  return { html, headings, keyTakeaways };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await resolveArticle(slug);
  if (result.retraction) return { title: "Article retracted", robots: { index: false, follow: false } };
  const article = result.detail!.article;
  const canonical = article.revision.canonicalUrlOverride || `/insights/${article.revision.slug}`;
  const featuredMedia = article.media.find((media) => media.mediaId === article.revision.featuredMediaId);
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
      modifiedTime: article.revision.approvedAt,
      tags: article.article.tags,
      images: featuredMedia ? [{ url: featuredMedia.publishedUrl, alt: featuredMedia.altText }] : undefined
    }
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const result = await resolveArticle(slug);
  if (result.retraction) return <RetractionNotice retraction={result.retraction} />;

  const article = result.detail!.article;
  const prepared = prepareArticleHtml(article.html);
  const featuredMedia = article.media.find((media) => media.mediaId === article.revision.featuredMediaId) ?? null;
  const relatedData = await getArticles({
    page: 1,
    limit: 8,
    category: article.article.primaryCategory
  }).catch(() => null);
  const related = relatedData?.articles
    .filter((item) => item.slug !== article.revision.slug)
    .slice(0, 3) ?? [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.revision.title,
    description: article.revision.seoDescription || article.revision.excerpt,
    datePublished: article.publishedAt,
    dateModified: article.revision.approvedAt,
    articleSection: article.article.primaryCategory,
    keywords: article.article.tags.join(", "),
    wordCount: article.revision.wordCount,
    image: featuredMedia?.publishedUrl,
    author: { "@type": "Organization", name: "GeneDrift Insights" },
    publisher: { "@type": "Organization", name: "GeneDrift" }
  };

  return (
    <main className="article-page">
      <ArticleProgress />
      <article>
        <header className={`article-hero${featuredMedia ? " article-hero-with-media" : ""}`}>
          <div className="shell article-hero-layout">
            <div className="article-hero-copy">
              <nav className="article-breadcrumbs" aria-label="Breadcrumb">
                <Link href="/insights">Insights</Link>
                <ChevronRight aria-hidden="true" size={14} />
                <Link href={categoryPath(article.article.primaryCategory)}>{article.article.primaryCategory}</Link>
              </nav>
              <Link className="category-link" href={categoryPath(article.article.primaryCategory)}>
                {article.article.primaryCategory}
              </Link>
              <h1>{article.revision.title}</h1>
              {article.revision.excerpt ? <p className="article-deck">{article.revision.excerpt}</p> : null}
              <div className="article-byline">
                <div className="article-author-mark" aria-hidden="true">GD</div>
                <div>
                  <strong>GeneDrift Insights</strong>
                  <span>Editorial analysis and industry intelligence</span>
                </div>
              </div>
              <div className="article-meta article-meta-primary">
                <span><CalendarDays aria-hidden="true" size={15} /><time dateTime={article.publishedAt}>{formatPublishedDate(article.publishedAt)}</time></span>
                <span><Clock3 aria-hidden="true" size={15} />{article.revision.readingTimeMinutes} min read</span>
                <span><FileCheck2 aria-hidden="true" size={15} />Editorially approved</span>
              </div>
            </div>

            {featuredMedia ? (
              <figure className="article-cover">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featuredMedia.publishedUrl}
                  alt={featuredMedia.altText}
                  width={featuredMedia.widthPixels}
                  height={featuredMedia.heightPixels}
                />
                {(featuredMedia.caption || featuredMedia.credit) ? (
                  <figcaption>{[featuredMedia.caption, featuredMedia.credit].filter(Boolean).join(" · ")}</figcaption>
                ) : null}
              </figure>
            ) : (
              <div className="article-cover article-cover-placeholder" aria-hidden="true">
                <span>GENEDRIFT / INSIGHT</span>
                <strong>{article.article.primaryCategory}</strong>
              </div>
            )}
          </div>
        </header>

        <div className="shell article-reading-layout" data-article-body>
          <aside className="article-aside article-aside-left">
            <ArticleToc headings={prepared.headings} />
          </aside>

          <div className="article-main-column">
            {prepared.keyTakeaways ? (
              <section className="article-brief" aria-labelledby="article-brief-title">
                <div>
                  <span>Executive brief</span>
                  <h2 id="article-brief-title">Key takeaways</h2>
                </div>
                <div dangerouslySetInnerHTML={{ __html: prepared.keyTakeaways }} />
              </section>
            ) : null}

            <div className="article-content" dangerouslySetInnerHTML={{ __html: prepared.html }} />

            <section className="article-publication-standard" aria-label="Publication information">
              <div className="publication-standard-icon"><CheckCircle2 aria-hidden="true" size={22} /></div>
              <div>
                <span>GeneDrift editorial standard</span>
                <h2>Carefully reviewed. Responsibly published.</h2>
                <p>
                  This insight was approved through GeneDrift’s controlled editorial workflow. Public author and reviewer
                  credentials are displayed when verified attribution is supplied with the publication.
                </p>
              </div>
              <dl>
                <div><dt>Published</dt><dd>{formatPublishedDate(article.publishedAt)}</dd></div>
                <div><dt>Revision</dt><dd>{article.revision.number}</dd></div>
                <div><dt>Content ID</dt><dd>{article.publicationId.slice(0, 12)}</dd></div>
              </dl>
            </section>

            {article.article.tags.length ? (
              <footer className="article-tags" aria-label="Article topics">
                <span>Topics</span>
                <div>
                  {article.article.tags.map((tag) => (
                    <Link key={tag} href={`/insights?tag=${encodeURIComponent(tag)}`}>{tag}</Link>
                  ))}
                </div>
              </footer>
            ) : null}
          </div>

          <aside className="article-aside article-aside-right">
            <ArticleShare title={article.revision.title} />
          </aside>
        </div>
      </article>

      <section className="article-expert-cta">
        <div className="shell article-expert-cta-layout">
          <div>
            <span className="section-eyebrow">Move from insight to action</span>
            <h2>Need clarity on a regulatory or market question?</h2>
          </div>
          <div>
            <p>Connect with GeneDrift for practical guidance shaped around your product, market and operating context.</p>
            <a className="gd-button gd-button-secondary gd-button-lg" href="mailto:cs@genedrift.com?subject=Regulatory%20consultation">
              Speak to an expert <ArrowUpRight aria-hidden="true" size={17} />
            </a>
          </div>
        </div>
      </section>

      {related.length ? (
        <section className="article-related">
          <div className="shell">
            <div className="article-related-heading">
              <div>
                <span className="section-eyebrow">Continue exploring</span>
                <h2>Related insights</h2>
              </div>
              <Link href={categoryPath(article.article.primaryCategory)}>
                View all in {article.article.primaryCategory} <ArrowRight aria-hidden="true" size={17} />
              </Link>
            </div>
            <div className="article-grid">
              {related.map((item) => <ArticleCard key={item.publicationId} article={item} />)}
            </div>
          </div>
        </section>
      ) : null}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </main>
  );
}
