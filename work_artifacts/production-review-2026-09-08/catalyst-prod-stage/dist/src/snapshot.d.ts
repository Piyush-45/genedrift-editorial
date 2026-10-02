import type { CanonicalPublishedDocument, PublicationHandoff, PublishedMediaAsset } from "./domain";
export declare function renderAndSanitizeDocument(handoff: PublicationHandoff, media: PublishedMediaAsset[]): string;
export declare function validateDocumentChecksum(handoff: PublicationHandoff): void;
export declare function contentHashForHandoff(handoff: PublicationHandoff): string;
export declare function buildPublishedDocument(handoff: PublicationHandoff, publicationId: string, contentHash: string, publishedAt: string, media: PublishedMediaAsset[]): CanonicalPublishedDocument;
export declare function validateMediaReferences(handoff: PublicationHandoff): void;
