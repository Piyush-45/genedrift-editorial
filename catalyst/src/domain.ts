import { z } from "zod";

const nonEmpty = z.string().trim().min(1);
const uuidLike = z.string().trim().min(8).max(128);

export const mediaAssetSchema = z.object({
  creatorRecordId: nonEmpty,
  mediaId: uuidLike,
  originalFilename: z.string().trim().min(1).max(255),
  mimeType: z.enum(["image/jpeg", "image/png", "image/gif", "image/webp"]),
  fileSizeBytes: z.number().int().positive(),
  widthPixels: z.number().int().positive().max(20_000),
  heightPixels: z.number().int().positive().max(20_000),
  checksum: z.string().regex(/^[a-f0-9]{64}$/i),
  altText: z.string().trim().min(1).max(250),
  caption: z.string().max(2000).optional().default(""),
  credit: z.string().max(250).optional().default("")
});

export const tipTapDocumentSchema = z.object({
  type: z.literal("doc"),
  content: z.array(z.unknown()).default([])
});

const tipTapDocumentInputSchema = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}, tipTapDocumentSchema);

export const publicationHandoffSchema = z.object({
  schemaVersion: z.literal(2),
  action: z.enum(["publish", "schedule", "retract"]),
  job: z.object({
    creatorJobId: nonEmpty,
    idempotencyKey: z.string().trim().min(8).max(150),
    requestedAt: z.string().datetime({ offset: true }),
    scheduledAt: z.string().datetime({ offset: true }).nullable().optional(),
    requestedByEmployeeId: nonEmpty
  }),
  article: z.object({
    creatorRecordId: nonEmpty,
    uuid: uuidLike,
    workflowState: z.enum(["Approved", "Scheduled", "Published"]),
    approvedRevisionId: nonEmpty,
    primaryCategory: z.string().max(250).optional().default(""),
    tags: z.array(z.string().max(250)).max(100).default([])
  }),
  revision: z.object({
    creatorRecordId: nonEmpty,
    uuid: uuidLike,
    number: z.number().int().positive(),
    state: z.enum(["Approved", "Published"]),
    title: z.string().trim().min(1).max(250),
    slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),
    excerpt: z.string().max(5000).default(""),
    // Creator file fields expose the approved JSON bytes as text. Accepting that
    // text directly avoids an unnecessary Deluge parse/reserialize cycle while
    // still producing a validated TipTap document at the boundary.
    editorDocument: tipTapDocumentInputSchema,
    documentChecksum: z.string().regex(/^[a-f0-9]{64}$/i),
    seoTitle: z.string().max(250).default(""),
    seoDescription: z.string().max(1000).default(""),
    canonicalUrlOverride: z.union([z.literal(""), z.string().url()]).default(""),
    robotsDirective: z.enum(["Index Follow", "Noindex Follow", "Noindex Nofollow"]),
    wordCount: z.number().int().nonnegative(),
    readingTimeMinutes: z.number().int().nonnegative(),
    featuredMediaId: uuidLike.nullable().optional(),
    socialMediaId: uuidLike.nullable().optional(),
    approvedAt: z.string().datetime({ offset: true })
  }),
  media: z.array(mediaAssetSchema).max(200).default([]),
  retraction: z.object({
    reason: z.string().trim().min(3).max(1000),
    replacementPath: z.string().trim().max(255).default("")
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
  } else if (value.article.workflowState === "Published" || value.revision.state === "Published") {
    ctx.addIssue({ code: "custom", path: ["action"], message: "Publish and schedule require an approved revision" });
  }
  const seenMediaIds = new Set<string>();
  const seenMediaRecords = new Set<string>();
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
  for (const [field, mediaId] of [["featuredMediaId", value.revision.featuredMediaId], ["socialMediaId", value.revision.socialMediaId]] as const) {
    if (value.action === "retract") continue;
    if (mediaId && !seenMediaIds.has(mediaId)) {
      ctx.addIssue({ code: "custom", path: ["revision", field], message: `${field} must reference an included media source` });
    }
  }
});

export type PublicationHandoff = z.infer<typeof publicationHandoffSchema>;

export type RequestStatus =
  | "Received"
  | "Scheduled"
  | "Queued"
  | "Processing"
  | "RetryScheduled"
  | "Succeeded"
  | "Failed";

export interface PublicationRequestRecord {
  requestId: string;
  idempotencyKey: string;
  action: PublicationHandoff["action"];
  status: RequestStatus;
  articleUuid: string;
  revisionUuid: string;
  revisionNumber: number;
  creatorJobId: string;
  scheduledAt: string | null;
  attemptCount: number;
  nextAttemptAt: string | null;
  snapshotObjectId: string | null;
  contentHash: string;
  leaseToken: string | null;
  leaseUntilEpochMs: number | null;
  publicationId: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublishedVersion {
  publicationId: string;
  requestId: string;
  articleUuid: string;
  revisionUuid: string;
  revisionNumber: number;
  contentHash: string;
  objectId: string;
  publishedAt: string;
}

export interface PublishedPointer {
  articleUuid: string;
  publicationId: string;
  revisionUuid: string;
  revisionNumber: number;
  contentHash: string;
  objectId: string;
  publishedAt: string;
  pointerVersion: number;
  servingStatus: "Published" | "Retracted";
  retractedAt: string | null;
  retractionReason: string | null;
  retractionEventId: string | null;
  replacementPath: string | null;
}

export interface PublicIndexRecord {
  articleUuid: string;
  publicationId: string;
  revisionUuid: string;
  revisionNumber: number;
  contentHash: string;
  objectId: string;
  publishedAt: string;
  pointerVersion: number;
  servingStatus: PublishedPointer["servingStatus"];
  slug: string;
  title: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  primaryCategory: string;
  tags: string[];
  searchText: string;
  readingTimeMinutes: number;
  featuredMedia: Omit<PublishedMediaAsset, "creatorRecordId"> | null;
  robotsDirective: PublicationHandoff["revision"]["robotsDirective"];
  retractedAt: string | null;
  retractionReason: string | null;
  replacementPath: string | null;
  updatedAt: string;
}

export type CallbackStatus = "Processing" | "Retrying" | "Succeeded" | "Failed";

export interface CreatorCallbackEvent {
  eventId: string;
  requestId: string;
  creatorJobId: string;
  idempotencyKey: string;
  status: CallbackStatus;
  attemptCount: number;
  publicationId: string | null;
  objectId: string | null;
  publishedAt: string | null;
  nextRetryAt: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  media: PublishedMediaAsset[];
}

export interface CallbackOutboxRecord extends CreatorCallbackEvent {
  deliveryStatus: "Pending" | "Delivered" | "RetryScheduled" | "DeadLetter";
  deliveryAttemptCount: number;
  nextDeliveryAt: string | null;
  lastDeliveryError: string | null;
}

export interface CanonicalPublishedDocument {
  schemaVersion: 2;
  publicationId: string;
  contentHash: string;
  publishedAt: string;
  article: PublicationHandoff["article"];
  revision: PublicationHandoff["revision"];
  media: PublishedMediaAsset[];
  html: string;
}

export interface PublishedMediaAsset {
  creatorRecordId: string;
  mediaId: string;
  objectKey: string;
  publishedUrl: string;
  originalFilename: string;
  mimeType: PublicationHandoff["media"][number]["mimeType"];
  fileSizeBytes: number;
  widthPixels: number;
  heightPixels: number;
  checksum: string;
  altText: string;
  caption: string;
  credit: string;
}

export interface RetryPolicy {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}
