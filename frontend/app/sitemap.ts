import type { MetadataRoute } from "next";
import { getArticles } from "@/lib/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const first = await getArticles({ page: 1, limit: 50 });
  const articles = [...first.articles];
  for (let page = 2; page <= first.pagination.totalPages; page += 1) {
    const response = await getArticles({ page, limit: 50 });
    articles.push(...response.articles);
  }
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/insights`, changeFrequency: "daily", priority: 0.9 },
    ...articles.map((article) => ({
      url: `${base}/insights/${article.slug}`,
      lastModified: new Date(article.publishedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7
    }))
  ];
}
