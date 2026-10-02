"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicContentService = void 0;
exports.assertPointerDocument = assertPointerDocument;
exports.buildPublicIndexRecord = buildPublicIndexRecord;
const errors_1 = require("./errors");
function normalized(value) {
    return (value ?? "").trim().toLocaleLowerCase();
}
function assertPointerDocument(pointer, document) {
    if (document.publicationId !== pointer.publicationId
        || document.contentHash !== pointer.contentHash
        || document.article.uuid !== pointer.articleUuid
        || document.revision.uuid !== pointer.revisionUuid
        || document.revision.number !== pointer.revisionNumber) {
        throw new errors_1.PublicationError("Published pointer and immutable document identities do not match", "PUBLIC_CONTENT_IDENTITY_MISMATCH", false, 500);
    }
}
function buildPublicIndexRecord(pointer, document) {
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
function publicMedia(asset) {
    const { creatorRecordId: _creatorRecordId, ...safe } = asset;
    return safe;
}
function detail(document) {
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
function summary(record) {
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
function indexSummary(record) {
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
class PublicContentService {
    store;
    objects;
    constructor(store, objects) {
        this.store = store;
        this.objects = objects;
    }
    async records() {
        const pointers = await this.store.listPointers();
        return Promise.all(pointers.map(async (pointer) => {
            const document = await this.objects.getPublicJson(pointer.objectId);
            assertPointerDocument(pointer, document);
            return { pointer, document };
        }));
    }
    async rebuildIndex() {
        const records = await this.records();
        for (const record of records) {
            await this.store.upsertPublicIndex(buildPublicIndexRecord(record.pointer, record.document));
        }
        return records.length;
    }
    async list(input) {
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
            if (category && normalized(article.primaryCategory) !== category)
                return false;
            if (tag && !article.tags.some((value) => normalized(value) === tag))
                return false;
            const indexed = indexByArticle.get(article.articleUuid);
            if (query && !indexed?.searchText.includes(query))
                return false;
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
    async resolveSlug(slug) {
        const indexed = await this.store.getPublicIndexBySlug(slug);
        if (!indexed)
            return { status: "missing" };
        const current = await this.store.getPointer(indexed.articleUuid);
        if (!current
            || current.publicationId !== indexed.publicationId
            || current.revisionUuid !== indexed.revisionUuid
            || current.revisionNumber !== indexed.revisionNumber
            || current.contentHash !== indexed.contentHash
            || current.objectId !== indexed.objectId
            || current.pointerVersion !== indexed.pointerVersion
            || current.servingStatus !== indexed.servingStatus) {
            throw new errors_1.PublicationError("Public index has not converged with the serving pointer", "PUBLIC_INDEX_STALE", true, 503);
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
        const document = await this.objects.getPublicJson(indexed.objectId);
        assertPointerDocument(current, document);
        return { status: "published", article: detail(document), pointer: current };
    }
    async discoverableArticles() {
        return (await this.store.listPublicIndex())
            .filter((record) => record.servingStatus === "Published")
            .map((record) => ({ ...indexSummary(record), robotsDirective: record.robotsDirective }))
            .filter((article) => article.robotsDirective === "Index Follow")
            .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt) || a.articleUuid.localeCompare(b.articleUuid));
    }
}
exports.PublicContentService = PublicContentService;
//# sourceMappingURL=publicContent.js.map