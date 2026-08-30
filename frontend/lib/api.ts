import type { ArticleDetailResponse, ArticleListResponse, RetractionResponse } from "./types";

const fallbackApi = "https://gd-genedrift-publishing-50045349268.development.catalystappsail.in";

function apiBase(): string {
  return (process.env.GENEDRIFT_PUBLIC_API_BASE_URL || fallbackApi).replace(/\/$/, "");
}

export class PublicApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message);
  }
}

export class ArticleRetractedError extends Error {
  constructor(readonly retraction: RetractionResponse) {
    super(retraction.message);
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null) as ({ code?: string; message?: string } | null);
  if (!response.ok) {
    throw new PublicApiError(response.status, payload?.code || "PUBLIC_API_ERROR", payload?.message || "The public content service is unavailable.");
  }
  return payload as T;
}

export async function getArticles(input: {
  page?: number;
  limit?: number;
  query?: string;
  category?: string;
  tag?: string;
} = {}): Promise<ArticleListResponse> {
  const search = new URLSearchParams();
  if (input.page) search.set("page", String(input.page));
  if (input.limit) search.set("limit", String(input.limit));
  if (input.query) search.set("q", input.query);
  if (input.category) search.set("category", input.category);
  if (input.tag) search.set("tag", input.tag);
  const response = await fetch(`${apiBase()}/v1/public/articles?${search}`, {
    next: { revalidate: 15, tags: ["articles"] }
  });
  return parseJson<ArticleListResponse>(response);
}

export async function getArticle(slug: string): Promise<ArticleDetailResponse> {
  const response = await fetch(`${apiBase()}/v1/public/articles/${encodeURIComponent(slug)}`, {
    cache: "no-store"
  });
  if (response.status === 410) {
    throw new ArticleRetractedError(await response.json() as RetractionResponse);
  }
  return parseJson<ArticleDetailResponse>(response);
}
