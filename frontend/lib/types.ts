export type PublicMedia = {
  mediaId: string;
  objectKey: string;
  publishedUrl: string;
  originalFilename: string;
  mimeType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  fileSizeBytes: number;
  widthPixels: number;
  heightPixels: number;
  checksum: string;
  altText: string;
  caption: string;
  credit: string;
};

export type ArticleSummary = {
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
  featuredMedia: PublicMedia | null;
};

export type ArticleListResponse = {
  ok: true;
  articles: ArticleSummary[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  facets: { categories: string[]; tags: string[] };
};

export type PublicArticle = {
  schemaVersion: 2;
  publicationId: string;
  contentHash: string;
  publishedAt: string;
  article: { uuid: string; primaryCategory: string; tags: string[] };
  revision: {
    uuid: string;
    number: number;
    title: string;
    slug: string;
    excerpt: string;
    seoTitle: string;
    seoDescription: string;
    canonicalUrlOverride: string;
    robotsDirective: "Index Follow" | "Noindex Follow" | "Noindex Nofollow";
    wordCount: number;
    readingTimeMinutes: number;
    featuredMediaId?: string | null;
    socialMediaId?: string | null;
    approvedAt: string;
  };
  media: PublicMedia[];
  html: string;
};

export type ArticleDetailResponse = {
  ok: true;
  article: PublicArticle;
  pointer: {
    articleUuid: string;
    publicationId: string;
    revisionUuid: string;
    revisionNumber: number;
    publishedAt: string;
    pointerVersion: number;
  };
};

export type RetractionResponse = {
  ok: false;
  code: "PUBLIC_ARTICLE_RETRACTED";
  message: string;
  articleUuid: string;
  retractedAt: string | null;
  reason: string | null;
  replacementPath: string | null;
};
