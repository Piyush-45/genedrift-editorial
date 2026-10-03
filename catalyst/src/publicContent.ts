import type { CanonicalPublishedDocument, PublicIndexRecord, PublishedPointer } from "./domain";
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
  firstPublishedAt: string;
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
    authors: Array<{ name: string; role: string }>;
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

export function assertPointerDocument(pointer: PublishedPointer, document: CanonicalPublishedDocument): void {
  if (document.publicationId !== pointer.publicationId
    || document.contentHash !== pointer.contentHash
    || document.article.uuid !== pointer.articleUuid
    || document.revision.uuid !== pointer.revisionUuid
    || document.revision.number !== pointer.revisionNumber) {
    throw new PublicationError("Published pointer and immutable document identities do not match", "PUBLIC_CONTENT_IDENTITY_MISMATCH", false, 500);
  }
}

export function buildPublicIndexRecord(pointer: PublishedPointer, document: CanonicalPublishedDocument): PublicIndexRecord {
  assertPointerDocument(pointer, document);
  const featuredMediaId = document.revision.featuredMediaId;
  const featuredMedia = featuredMediaId
    ? document.media.find((asset) => asset.mediaId === featuredMediaId)
    : undefined;
  const safeFeaturedMedia = featuredMedia ? publicMedia(featuredMedia) : null;
  return {
    articleUuid: pointer.articleUuid,
    publicationId: pointer.publicationId,
    revisionUuid: pointer.revisionUuid,
    revisionNumber: pointer.revisionNumber,
    contentHash: pointer.contentHash,
    objectId: pointer.objectId,
    publishedAt: pointer.publishedAt,
    pointerVersion: pointer.pointerVersion,
    servingStatus: pointer.servingStatus,
    slug: document.revision.slug,
    title: document.revision.title,
    excerpt: document.revision.excerpt,
    seoTitle: document.revision.seoTitle,
    seoDescription: document.revision.seoDescription,
    primaryCategory: document.article.primaryCategory,
    tags: [...document.article.tags],
    searchText: normalized([
      document.revision.title,
      document.revision.excerpt,
      document.article.primaryCategory,
      ...document.article.tags
    ].join(" ")),
    readingTimeMinutes: document.revision.readingTimeMinutes,
    featuredMedia: safeFeaturedMedia,
    robotsDirective: document.revision.robotsDirective,
    retractedAt: pointer.retractedAt,
    retractionReason: pointer.retractionReason,
    replacementPath: pointer.replacementPath,
    updatedAt: pointer.retractedAt ?? pointer.publishedAt
  };
}

function publicMedia(asset: CanonicalPublishedDocument["media"][number]): PublicMediaAsset {
  const { creatorRecordId: _creatorRecordId, ...safe } = asset;
  return safe;
}

function earliest(candidate: string | null | undefined, fallback: string): string {
  if (!candidate) return fallback;
  const candidateMs = Date.parse(candidate);
  if (!Number.isFinite(candidateMs)) return fallback;
  return candidateMs < Date.parse(fallback) ? new Date(candidateMs).toISOString() : fallback;
}

function detail(document: CanonicalPublishedDocument): PublicArticleDetail {
  return {
    schemaVersion: document.schemaVersion,
    publicationId: document.publicationId,
    contentHash: document.contentHash,
    publishedAt: document.publishedAt,
    // Older documents predate firstPublishedAt; their publish time is the best
    // available answer, and is exact for any article published only once.
    firstPublishedAt: earliest(document.article.firstPublishedAt, document.publishedAt),
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
      approvedAt: document.revision.approvedAt,
      authors: (document.revision.authors ?? []).map((author) => ({ name: author.name, role: author.role ?? "" }))
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

function indexSummary(record: PublicIndexRecord): PublicArticleSummary {
  return {
    articleUuid: record.articleUuid,
    publicationId: record.publicationId,
    revisionUuid: record.revisionUuid,
    revisionNumber: record.revisionNumber,
    title: record.title,
    slug: record.slug,
    excerpt: record.excerpt,
    seoTitle: record.seoTitle,
    seoDescription: record.seoDescription,
    primaryCategory: record.primaryCategory,
    tags: [...record.tags],
    publishedAt: record.publishedAt,
    readingTimeMinutes: record.readingTimeMinutes,
    featuredMedia: record.featuredMedia
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

  async rebuildIndex(): Promise<number> {
    const records = await this.records();
    for (const record of records) {
      await this.store.upsertPublicIndex(buildPublicIndexRecord(record.pointer, record.document));
    }
    return records.length;
  }

  async list(input: PublicArticleQuery) {
    const query = normalized(input.query);
    const category = normalized(input.category);
    const tag = normalized(input.tag);
    const index = await this.store.listPublicIndex();
    const indexByArticle = new Map(index.map((record) => [record.articleUuid, record]));
    const allPublished = index
      .filter((record) => record.servingStatus === "Published")
      .map(indexSummary)
      .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt) || a.articleUuid.localeCompare(b.articleUuid));
    const filtered = allPublished.filter((article) => {
      if (category && normalized(article.primaryCategory) !== category) return false;
      if (tag && !article.tags.some((value) => normalized(value) === tag)) return false;
      const indexed = indexByArticle.get(article.articleUuid);
      if (query && !indexed?.searchText.includes(query)) return false;
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
    const indexed = await this.store.getPublicIndexBySlug(slug);
    if (!indexed) return { status: "missing" };
    const current = await this.store.getPointer(indexed.articleUuid);
    if (!current
      || current.publicationId !== indexed.publicationId
      || current.revisionUuid !== indexed.revisionUuid
      || current.revisionNumber !== indexed.revisionNumber
      || current.contentHash !== indexed.contentHash
      || current.objectId !== indexed.objectId
      || current.pointerVersion !== indexed.pointerVersion
      || current.servingStatus !== indexed.servingStatus) {
      throw new PublicationError("Public index has not converged with the serving pointer", "PUBLIC_INDEX_STALE", true, 503);
    }
    if (indexed.servingStatus === "Retracted") {
      return {
        status: "retracted",
        articleUuid: indexed.articleUuid,
        retractedAt: indexed.retractedAt,
        reason: indexed.retractionReason,
        replacementPath: indexed.replacementPath
      };
    }
    const document = await this.objects.getPublicJson<CanonicalPublishedDocument>(indexed.objectId);
    assertPointerDocument(current, document);
    return { status: "published", article: detail(document), pointer: current };
  }

  async discoverableArticles(): Promise<Array<PublicArticleSummary & { robotsDirective: CanonicalPublishedDocument["revision"]["robotsDirective"] }>> {
    return (await this.store.listPublicIndex())
      .filter((record) => record.servingStatus === "Published")
      .map((record) => ({ ...indexSummary(record), robotsDirective: record.robotsDirective }))
      .filter((article) => article.robotsDirective === "Index Follow")
      .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt) || a.articleUuid.localeCompare(b.articleUuid));
  }

}
