import type { CanonicalPublishedDocument, PublicIndexRecord, PublishedPointer } from "./domain";
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
export declare function assertPointerDocument(pointer: PublishedPointer, document: CanonicalPublishedDocument): void;
export declare function buildPublicIndexRecord(pointer: PublishedPointer, document: CanonicalPublishedDocument): PublicIndexRecord;
export declare class PublicContentService {
    private readonly store;
    private readonly objects;
    constructor(store: PublicationStore, objects: ImmutableObjectStore);
    records(): Promise<PublicArticleRecord[]>;
    rebuildIndex(): Promise<number>;
    list(input: PublicArticleQuery): Promise<{
        articles: PublicArticleSummary[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
        facets: {
            categories: string[];
            tags: string[];
        };
    }>;
    resolveSlug(slug: string): Promise<{
        status: "published";
        article: PublicArticleDetail;
        pointer: PublishedPointer;
    } | {
        status: "retracted";
        articleUuid: string;
        retractedAt: string | null;
        reason: string | null;
        replacementPath: string | null;
    } | {
        status: "missing";
    }>;
    discoverableArticles(): Promise<Array<PublicArticleSummary & {
        robotsDirective: CanonicalPublishedDocument["revision"]["robotsDirective"];
    }>>;
}
