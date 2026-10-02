import { z } from "zod";
export declare const mediaAssetSchema: z.ZodObject<{
    creatorRecordId: z.ZodString;
    mediaId: z.ZodString;
    originalFilename: z.ZodString;
    mimeType: z.ZodEnum<{
        "image/jpeg": "image/jpeg";
        "image/png": "image/png";
        "image/gif": "image/gif";
        "image/webp": "image/webp";
    }>;
    fileSizeBytes: z.ZodNumber;
    widthPixels: z.ZodNumber;
    heightPixels: z.ZodNumber;
    checksum: z.ZodString;
    altText: z.ZodString;
    caption: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    credit: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const tipTapDocumentSchema: z.ZodObject<{
    type: z.ZodLiteral<"doc">;
    content: z.ZodDefault<z.ZodArray<z.ZodUnknown>>;
}, z.core.$strip>;
export declare const publicationHandoffSchema: z.ZodObject<{
    schemaVersion: z.ZodLiteral<2>;
    action: z.ZodEnum<{
        publish: "publish";
        schedule: "schedule";
        retract: "retract";
    }>;
    job: z.ZodObject<{
        creatorJobId: z.ZodString;
        idempotencyKey: z.ZodString;
        requestedAt: z.ZodString;
        scheduledAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        requestedByEmployeeId: z.ZodString;
    }, z.core.$strip>;
    article: z.ZodObject<{
        creatorRecordId: z.ZodString;
        uuid: z.ZodString;
        workflowState: z.ZodEnum<{
            Approved: "Approved";
            Scheduled: "Scheduled";
            Published: "Published";
        }>;
        approvedRevisionId: z.ZodString;
        primaryCategory: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        tags: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
    revision: z.ZodObject<{
        creatorRecordId: z.ZodString;
        uuid: z.ZodString;
        number: z.ZodNumber;
        state: z.ZodEnum<{
            Approved: "Approved";
            Published: "Published";
        }>;
        title: z.ZodString;
        slug: z.ZodString;
        excerpt: z.ZodDefault<z.ZodString>;
        editorDocument: z.ZodPreprocess<z.ZodObject<{
            type: z.ZodLiteral<"doc">;
            content: z.ZodDefault<z.ZodArray<z.ZodUnknown>>;
        }, z.core.$strip>>;
        documentChecksum: z.ZodString;
        seoTitle: z.ZodDefault<z.ZodString>;
        seoDescription: z.ZodDefault<z.ZodString>;
        canonicalUrlOverride: z.ZodDefault<z.ZodUnion<readonly [z.ZodLiteral<"">, z.ZodString]>>;
        robotsDirective: z.ZodEnum<{
            "Index Follow": "Index Follow";
            "Noindex Follow": "Noindex Follow";
            "Noindex Nofollow": "Noindex Nofollow";
        }>;
        wordCount: z.ZodNumber;
        readingTimeMinutes: z.ZodNumber;
        featuredMediaId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        socialMediaId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        approvedAt: z.ZodString;
    }, z.core.$strip>;
    media: z.ZodDefault<z.ZodArray<z.ZodObject<{
        creatorRecordId: z.ZodString;
        mediaId: z.ZodString;
        originalFilename: z.ZodString;
        mimeType: z.ZodEnum<{
            "image/jpeg": "image/jpeg";
            "image/png": "image/png";
            "image/gif": "image/gif";
            "image/webp": "image/webp";
        }>;
        fileSizeBytes: z.ZodNumber;
        widthPixels: z.ZodNumber;
        heightPixels: z.ZodNumber;
        checksum: z.ZodString;
        altText: z.ZodString;
        caption: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        credit: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>>>;
    retraction: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        reason: z.ZodString;
        replacementPath: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type PublicationHandoff = z.infer<typeof publicationHandoffSchema>;
export type RequestStatus = "Received" | "Scheduled" | "Queued" | "Processing" | "RetryScheduled" | "Succeeded" | "Failed";
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
