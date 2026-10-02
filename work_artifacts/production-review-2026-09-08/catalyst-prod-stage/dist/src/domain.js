"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicationHandoffSchema = exports.tipTapDocumentSchema = exports.mediaAssetSchema = void 0;
const zod_1 = require("zod");
const nonEmpty = zod_1.z.string().trim().min(1);
const uuidLike = zod_1.z.string().trim().min(8).max(128);
exports.mediaAssetSchema = zod_1.z.object({
    creatorRecordId: nonEmpty,
    mediaId: uuidLike,
    originalFilename: zod_1.z.string().trim().min(1).max(255),
    mimeType: zod_1.z.enum(["image/jpeg", "image/png", "image/gif", "image/webp"]),
    fileSizeBytes: zod_1.z.number().int().positive(),
    widthPixels: zod_1.z.number().int().positive().max(20_000),
    heightPixels: zod_1.z.number().int().positive().max(20_000),
    checksum: zod_1.z.string().regex(/^[a-f0-9]{64}$/i),
    altText: zod_1.z.string().trim().min(1).max(250),
    caption: zod_1.z.string().max(2000).optional().default(""),
    credit: zod_1.z.string().max(250).optional().default("")
});
exports.tipTapDocumentSchema = zod_1.z.object({
    type: zod_1.z.literal("doc"),
    content: zod_1.z.array(zod_1.z.unknown()).default([])
});
const tipTapDocumentInputSchema = zod_1.z.preprocess((value) => {
    if (typeof value !== "string")
        return value;
    try {
        return JSON.parse(value);
    }
    catch {
        return value;
    }
}, exports.tipTapDocumentSchema);
exports.publicationHandoffSchema = zod_1.z.object({
    schemaVersion: zod_1.z.literal(2),
    action: zod_1.z.enum(["publish", "schedule", "retract"]),
    job: zod_1.z.object({
        creatorJobId: nonEmpty,
        idempotencyKey: zod_1.z.string().trim().min(8).max(150),
        requestedAt: zod_1.z.string().datetime({ offset: true }),
        scheduledAt: zod_1.z.string().datetime({ offset: true }).nullable().optional(),
        requestedByEmployeeId: nonEmpty
    }),
    article: zod_1.z.object({
        creatorRecordId: nonEmpty,
        uuid: uuidLike,
        workflowState: zod_1.z.enum(["Approved", "Scheduled", "Published"]),
        approvedRevisionId: nonEmpty,
        primaryCategory: zod_1.z.string().max(250).optional().default(""),
        tags: zod_1.z.array(zod_1.z.string().max(250)).max(100).default([])
    }),
    revision: zod_1.z.object({
        creatorRecordId: nonEmpty,
        uuid: uuidLike,
        number: zod_1.z.number().int().positive(),
        state: zod_1.z.enum(["Approved", "Published"]),
        title: zod_1.z.string().trim().min(1).max(250),
        slug: zod_1.z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),
        excerpt: zod_1.z.string().max(5000).default(""),
        // Creator file fields expose the approved JSON bytes as text. Accepting that
        // text directly avoids an unnecessary Deluge parse/reserialize cycle while
        // still producing a validated TipTap document at the boundary.
        editorDocument: tipTapDocumentInputSchema,
        documentChecksum: zod_1.z.string().regex(/^[a-f0-9]{64}$/i),
        seoTitle: zod_1.z.string().max(250).default(""),
        seoDescription: zod_1.z.string().max(1000).default(""),
        canonicalUrlOverride: zod_1.z.union([zod_1.z.literal(""), zod_1.z.string().url()]).default(""),
        robotsDirective: zod_1.z.enum(["Index Follow", "Noindex Follow", "Noindex Nofollow"]),
        wordCount: zod_1.z.number().int().nonnegative(),
        readingTimeMinutes: zod_1.z.number().int().nonnegative(),
        featuredMediaId: uuidLike.nullable().optional(),
        socialMediaId: uuidLike.nullable().optional(),
        approvedAt: zod_1.z.string().datetime({ offset: true })
    }),
    media: zod_1.z.array(exports.mediaAssetSchema).max(200).default([]),
    retraction: zod_1.z.object({
        reason: zod_1.z.string().trim().min(3).max(1000),
        replacementPath: zod_1.z.string().trim().max(255).default("")
    }).nullable().optional()
}).superRefine((value, ctx) => {
    if (value.article.approvedRevisionId !== value.revision.creatorRecordId) {
        ctx.addIssue({
            code: "custom",
            path: ["article", "approvedRevisionId"],
            message: "Approved revision pointer does not match the supplied revision"
        });
    }
    if (value.action === "schedule" && !value.job.scheduledAt) {
        ctx.addIssue({ code: "custom", path: ["job", "scheduledAt"], message: "Scheduled publication requires scheduledAt" });
    }
    if (value.action === "retract") {
        if (value.article.workflowState !== "Published" || value.revision.state !== "Published") {
            ctx.addIssue({ code: "custom", path: ["action"], message: "Retraction requires the current published article and revision" });
        }
        if (!value.retraction) {
            ctx.addIssue({ code: "custom", path: ["retraction"], message: "Retraction requires a reason" });
        }
    }
    else if (value.article.workflowState === "Published" || value.revision.state === "Published") {
        ctx.addIssue({ code: "custom", path: ["action"], message: "Publish and schedule require an approved revision" });
    }
    const seenMediaIds = new Set();
    const seenMediaRecords = new Set();
    value.media.forEach((asset, index) => {
        if (seenMediaIds.has(asset.mediaId)) {
            ctx.addIssue({ code: "custom", path: ["media", index, "mediaId"], message: "Media IDs must be unique" });
        }
        if (seenMediaRecords.has(asset.creatorRecordId)) {
            ctx.addIssue({ code: "custom", path: ["media", index, "creatorRecordId"], message: "Creator media record IDs must be unique" });
        }
        seenMediaIds.add(asset.mediaId);
        seenMediaRecords.add(asset.creatorRecordId);
    });
    for (const [field, mediaId] of [["featuredMediaId", value.revision.featuredMediaId], ["socialMediaId", value.revision.socialMediaId]]) {
        if (value.action === "retract")
            continue;
        if (mediaId && !seenMediaIds.has(mediaId)) {
            ctx.addIssue({ code: "custom", path: ["revision", field], message: `${field} must reference an included media source` });
        }
    }
});
//# sourceMappingURL=domain.js.map