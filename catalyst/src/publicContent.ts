import type { CanonicalPublishedDocument, PublishedPointer } from "./domain";
import { PublicationError } from "./errors";
import type { ImmutableObjectStore, PublicationStore } from "./ports";

export type PublicArticleSummary = {
  articleUuid: string;
  publicationId: string;
  revisionUuid: string;
  revisionNumber: number;
  title: string;
  slug: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  primaryCategory: string;
  tags: string[];
  publishedAt: string;
  readingTimeMinutes: number;
  featuredMedia: PublicMediaAsset | null;
};

export type PublicMediaAsset = Omit<CanonicalPublishedDocument["media"][number], "creatorRecordId">;

export type PublicArticleDetail = {
  schemaVersion: CanonicalPublishedDocument["schemaVersion"];
  publicationId: string;
  contentHash: string;
  publishedAt: string;
  article: {
    uuid: string;
    primaryCategory: string;
    tags: string[];
  };
  revision: {
    uuid: string;
    number: number;
    title: string;
    slug: string;
    excerpt: string;
    seoTitle: string;
    seoDescription: string;
    canonicalUrlOverride: string;
    robotsDirective: CanonicalPublishedDocument["revision"]["robotsDirective"];
    wordCount: number;
    readingTimeMinutes: number;
    featuredMediaId?: string | null;
    socialMediaId?: string | null;
    approvedAt: string;
  };
  media: PublicMediaAsset[];
  html: string;
};

export type PublicArticleRecord = {
  pointer: PublishedPointer;
  document: CanonicalPublishedDocument;
};

export type PublicArticleQuery = {
  page: number;
  limit: number;
  query?: string;
  category?: string;
  tag?: string;
};

function normalized(value: string | undefined): string {
  return (value ?? "").trim().toLocaleLowerCase();
}

function assertPointerDocument(pointer: PublishedPointer, document: CanonicalPublishedDocument): void {
  if (document.publicationId !== pointer.publicationId
    || document.contentHash !== pointer.contentHash
    || document.article.uuid !== pointer.articleUuid
    || document.revision.uuid !== pointer.revisionUuid
    || document.revision.number !== pointer.revisionNumber) {
    throw new PublicationError("Published pointer and immutable document identities do not match", "PUBLIC_CONTENT_IDENTITY_MISMATCH", false, 500);
  }
}

function publicMedia(asset: CanonicalPublishedDocument["media"][number]): PublicMediaAsset {
  const { creatorRecordId: _creatorRecordId, ...safe } = asset;
  return safe;
}

function detail(document: CanonicalPublishedDocument): PublicArticleDetail {
  return {
    schemaVersion: document.schemaVersion,
    publicationId: document.publicationId,
    contentHash: document.contentHash,
    publishedAt: document.publishedAt,
    article: {
      uuid: document.article.uuid,
      primaryCategory: document.article.primaryCategory,
      tags: [...document.article.tags]
    },
    revision: {
      uuid: document.revision.uuid,
      number: document.revision.number,
      title: document.revision.title,
      slug: document.revision.slug,
      excerpt: document.revision.excerpt,
      seoTitle: document.revision.seoTitle,
      seoDescription: document.revision.seoDescription,
      canonicalUrlOverride: document.revision.canonicalUrlOverride,
      robotsDirective: document.revision.robotsDirective,
      wordCount: document.revision.wordCount,
      readingTimeMinutes: document.revision.readingTimeMinutes,
      featuredMediaId: document.revision.featuredMediaId,
      socialMediaId: document.revision.socialMediaId,
      approvedAt: document.revision.approvedAt
    },
    media: document.media.map(publicMedia),
    html: document.html
  };
}

function summary(record: PublicArticleRecord): PublicArticleSummary {
  const { pointer, document } = record;
  const featuredMediaId = document.revision.featuredMediaId;
  const featuredMedia = featuredMediaId
    ? document.media.find((asset) => asset.mediaId === featuredMediaId)
    : undefined;
  return {
    articleUuid: pointer.articleUuid,
    publicationId: pointer.publicationId,
    revisionUuid: pointer.revisionUuid,
    revisionNumber: pointer.revisionNumber,
    title: document.revision.title,
    slug: document.revision.slug,
    excerpt: document.revision.excerpt,
    seoTitle: document.revision.seoTitle,
    seoDescription: document.revision.seoDescription,
    primaryCategory: document.article.primaryCategory,
    tags: [...document.article.tags],
    publishedAt: pointer.publishedAt,
    readingTimeMinutes: document.revision.readingTimeMinutes,
    featuredMedia: featuredMedia ? publicMedia(featuredMedia) : null
  };
}

export class PublicContentService {
  constructor(
    private readonly store: PublicationStore,
    private readonly objects: ImmutableObjectStore
  ) {}

  async records(): Promise<PublicArticleRecord[]> {
    const pointers = await this.store.listPointers();
    return Promise.all(pointers.map(async (pointer) => {
      const document = await this.objects.getPublicJson<CanonicalPublishedDocument>(pointer.objectId);
      assertPointerDocument(pointer, document);
      return { pointer, document };
    }));
  }

  async list(input: PublicArticleQuery) {
    const query = normalized(input.query);
    const category = normalized(input.category);
    const tag = normalized(input.tag);
    const allPublished = (await this.records())
      .filter((record) => record.pointer.servingStatus === "Published")
      .map(summary)
      .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt) || a.articleUuid.localeCompare(b.articleUuid));
    const filtered = allPublished.filter((article) => {
      if (category && normalized(article.primaryCategory) !== category) return false;
      if (tag && !article.tags.some((value) => normalized(value) === tag)) return false;
      if (query && !normalized([
        article.title,
        article.excerpt,
        article.primaryCategory,
        ...article.tags
      ].join(" ")).includes(query)) return false;
      return true;
    });
    const start = (input.page - 1) * input.limit;
    const categories = [...new Set(allPublished.map((article) => article.primaryCategory).filter(Boolean))].sort();
    const tags = [...new Set(allPublished.flatMap((article) => article.tags).filter(Boolean))].sort();
    return {
      articles: filtered.slice(start, start + input.limit),
      pagination: {
        page: input.page,
        limit: input.limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / input.limit)
      },
      facets: { categories, tags }
    };
  }

  async resolveSlug(slug: string): Promise<
    | { status: "published"; article: PublicArticleDetail; pointer: PublishedPointer }
    | { status: "retracted"; articleUuid: string; retractedAt: string | null; reason: string | null; replacementPath: string | null }
    | { status: "missing" }
  > {
    const matches = (await this.records()).filter((record) => record.document.revision.slug === slug);
    if (matches.length === 0) return { status: "missing" };
    if (matches.length > 1) {
      throw new PublicationError("Multiple current articles use the same public slug", "PUBLIC_SLUG_CONFLICT", false, 409);
    }
    const [{ pointer, document }] = matches;
    if (pointer.servingStatus === "Retracted") {
      return {
        status: "retracted",
        articleUuid: pointer.articleUuid,
        retractedAt: pointer.retractedAt,
        reason: pointer.retractionReason,
        replacementPath: pointer.replacementPath
      };
    }
    return { status: "published", article: detail(document), pointer };
  }

  async discoverableArticles(): Promise<Array<PublicArticleSummary & { robotsDirective: CanonicalPublishedDocument["revision"]["robotsDirective"] }>> {
    return (await this.records())
      .filter((record) => record.pointer.servingStatus === "Published")
      .map((record) => ({ ...summary(record), robotsDirective: record.document.revision.robotsDirective }))
      .filter((article) => article.robotsDirective === "Index Follow")
      .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt) || a.articleUuid.localeCompare(b.articleUuid));
  }

}
