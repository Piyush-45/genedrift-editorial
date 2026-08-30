#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const count = Number.parseInt(option("--count", "1800"), 10);
if (!Number.isInteger(count) || count < 1 || count > 50_000) {
  throw new Error("--count must be an integer between 1 and 50000");
}

const output = resolve(option("--output", "tools/catalog/generated/catalog-1800.json"));
const categories = ["Science", "Society", "Markets", "Culture", "Regulatory Affairs", "Technology"];
const tagPool = ["Genomics", "Policy", "Health", "Climate", "AI", "Research", "Ethics", "Innovation", "Data", "Communities"];
const titleStarts = ["A clearer view of", "What changes when", "The evidence behind", "Rethinking", "A field guide to", "Signals from"];
const titleEnds = ["responsible innovation", "the next research cycle", "public trust", "emerging evidence", "complex systems", "long-term decisions"];

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function media(index) {
  if (index % 4 !== 0) return null;
  const mediaId = `fixture-media-${String(index).padStart(4, "0")}`;
  return {
    mediaId,
    objectKey: `fixture/media/${mediaId}.png`,
    publishedUrl: `__MOCK_ORIGIN__/media/${mediaId}.png`,
    originalFilename: `${mediaId}.png`,
    mimeType: "image/png",
    fileSizeBytes: 68,
    widthPixels: 1200,
    heightPixels: 675,
    checksum: hash(mediaId),
    altText: `Abstract GeneDrift catalog illustration ${index}`,
    caption: "Synthetic catalog-scale fixture image.",
    credit: "GeneDrift test fixture"
  };
}

function record(index, status = "Published") {
  const serial = String(index).padStart(4, "0");
  const articleUuid = `fixture-article-${serial}`;
  const publicationId = `fixture-publication-${serial}`;
  const revisionUuid = `fixture-revision-${serial}`;
  const category = categories[index % categories.length];
  const tags = [tagPool[index % tagPool.length], tagPool[(index * 3 + 1) % tagPool.length]].filter((value, position, all) => all.indexOf(value) === position);
  const longSuffix = index % 37 === 0 ? " across institutions, disciplines, and the decisions that shape public life" : "";
  const title = `${titleStarts[index % titleStarts.length]} ${titleEnds[(index * 5) % titleEnds.length]}${longSuffix}`;
  const slug = status === "Retracted" ? "fixture-retracted-article" : `fixture-insight-${serial}`;
  const publishedAt = new Date(Date.UTC(2026, 7, 30) - index * 3_600_000).toISOString();
  const featuredMedia = media(index);
  const excerpt = `Synthetic article ${index} explores ${category.toLowerCase()} through an evidence-led, deterministic catalog fixture for pagination, search, filters, and responsive layout testing.`;
  const summary = {
    articleUuid,
    publicationId,
    revisionUuid,
    revisionNumber: 1,
    title,
    slug,
    excerpt,
    seoTitle: title,
    seoDescription: excerpt,
    primaryCategory: category,
    tags,
    publishedAt,
    readingTimeMinutes: 2 + (index % 12),
    featuredMedia
  };
  return {
    status,
    summary,
    detail: {
      schemaVersion: 2,
      publicationId,
      contentHash: hash(`${articleUuid}:${revisionUuid}`),
      publishedAt,
      article: { uuid: articleUuid, primaryCategory: category, tags },
      revision: {
        uuid: revisionUuid,
        number: 1,
        title,
        slug,
        excerpt,
        seoTitle: title,
        seoDescription: excerpt,
        canonicalUrlOverride: "",
        robotsDirective: "Index Follow",
        wordCount: 420 + (index % 2400),
        readingTimeMinutes: summary.readingTimeMinutes,
        featuredMediaId: featuredMedia?.mediaId ?? null,
        socialMediaId: null,
        approvedAt: new Date(Date.parse(publishedAt) - 900_000).toISOString()
      },
      media: featuredMedia ? [featuredMedia] : [],
      html: `<h2>Catalog-scale insight ${index}</h2><p>${excerpt}</p><p>This content is synthetic and must never be presented as editorial or production data.</p>`
    },
    pointer: { articleUuid, publicationId, revisionUuid, revisionNumber: 1, publishedAt, pointerVersion: status === "Retracted" ? 2 : 1 }
  };
}

const records = Array.from({ length: count }, (_, index) => record(index + 1));
records.push(record(count + 1, "Retracted"));
const payload = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  visibleArticleCount: count,
  publishedSlug: records[0].summary.slug,
  retractedSlug: records.at(-1).summary.slug,
  records
};

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(payload)}\n`, "utf8");
console.log(JSON.stringify({ ok: true, output, visibleArticleCount: count, totalRecords: records.length }));
