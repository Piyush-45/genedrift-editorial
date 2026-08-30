#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import http from "node:http";
import { resolve } from "node:path";

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const fixturePath = resolve(option("--fixture", "tools/catalog/generated/catalog-1800.json"));
const port = Number.parseInt(option("--port", "4100"), 10);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("--port is invalid");
const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
const records = fixture.records;
const pixel = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");

function origin(request) {
  return `http://${request.headers.host || `127.0.0.1:${port}`}`;
}

function materialize(value, base) {
  return JSON.parse(JSON.stringify(value).replaceAll("__MOCK_ORIGIN__", base));
}

function sendJson(request, response, status, body, cache = "public, max-age=5, must-revalidate") {
  const text = JSON.stringify(body);
  const etag = `\"${createHash("sha256").update(text).digest("hex")}\"`;
  response.setHeader("access-control-allow-origin", "*");
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", cache);
  response.setHeader("etag", etag);
  if (request.headers["if-none-match"] === etag) {
    response.writeHead(304).end();
    return;
  }
  response.writeHead(status).end(text);
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url || "/", origin(request));
  if (request.method !== "GET" && request.method !== "HEAD") {
    sendJson(request, response, 405, { ok: false, code: "METHOD_NOT_ALLOWED", message: "GET only" }, "no-store");
    return;
  }
  if (url.pathname === "/health") {
    sendJson(request, response, 200, { ok: true, service: "genedrift-fixture-api", visibleArticleCount: fixture.visibleArticleCount });
    return;
  }
  if (url.pathname.startsWith("/media/") && url.pathname.endsWith(".png")) {
    response.setHeader("content-type", "image/png");
    response.setHeader("cache-control", "public, max-age=31536000, immutable");
    response.writeHead(200).end(pixel);
    return;
  }
  const published = records.filter((record) => record.status === "Published");
  if (url.pathname === "/v1/public/articles") {
    const page = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(url.searchParams.get("limit") || "20", 10) || 20));
    const query = (url.searchParams.get("q") || "").trim().toLowerCase();
    const category = (url.searchParams.get("category") || "").trim().toLowerCase();
    const tag = (url.searchParams.get("tag") || "").trim().toLowerCase();
    const filtered = published.filter(({ summary }) => {
      if (category && summary.primaryCategory.toLowerCase() !== category) return false;
      if (tag && !summary.tags.some((value) => value.toLowerCase() === tag)) return false;
      const search = [summary.title, summary.excerpt, summary.primaryCategory, ...summary.tags].join(" ").toLowerCase();
      return !query || search.includes(query);
    });
    const start = (page - 1) * limit;
    const categories = [...new Set(published.map(({ summary }) => summary.primaryCategory))].sort();
    const tags = [...new Set(published.flatMap(({ summary }) => summary.tags))].sort();
    sendJson(request, response, 200, materialize({
      ok: true,
      articles: filtered.slice(start, start + limit).map(({ summary }) => summary),
      pagination: { page, limit, total: filtered.length, totalPages: Math.ceil(filtered.length / limit) },
      facets: { categories, tags }
    }, origin(request)));
    return;
  }
  if (url.pathname === "/v1/public/taxonomy") {
    const categories = [...new Set(published.map(({ summary }) => summary.primaryCategory))].sort();
    const tags = [...new Set(published.flatMap(({ summary }) => summary.tags))].sort();
    sendJson(request, response, 200, { ok: true, categories, tags });
    return;
  }
  if (url.pathname === "/v1/public/sitemap.xml" || url.pathname === "/v1/public/rss.xml") {
    response.setHeader("content-type", url.pathname.endsWith("rss.xml") ? "application/rss+xml" : "application/xml");
    response.writeHead(200).end("<?xml version=\"1.0\" encoding=\"UTF-8\"?><fixture>Use the frontend sitemap for catalog UX tests.</fixture>");
    return;
  }
  const match = url.pathname.match(/^\/v1\/public\/articles\/([a-z0-9-]+)$/);
  if (match) {
    const record = records.find(({ summary }) => summary.slug === match[1]);
    if (!record) {
      sendJson(request, response, 404, { ok: false, code: "PUBLIC_ARTICLE_NOT_FOUND", message: "Published article not found" }, "no-store");
      return;
    }
    if (record.status === "Retracted") {
      sendJson(request, response, 410, {
        ok: false,
        code: "PUBLIC_ARTICLE_RETRACTED",
        message: "This synthetic article has been retracted",
        articleUuid: record.summary.articleUuid,
        retractedAt: fixture.generatedAt,
        reason: "Synthetic retraction test",
        replacementPath: "/insights"
      }, "no-store");
      return;
    }
    sendJson(request, response, 200, materialize({ ok: true, article: record.detail, pointer: record.pointer }, origin(request)));
    return;
  }
  sendJson(request, response, 404, { ok: false, code: "NOT_FOUND", message: "Fixture route not found" }, "no-store");
});

server.listen(port, "127.0.0.1", () => {
  console.log(JSON.stringify({ ok: true, url: `http://127.0.0.1:${port}`, fixturePath, visibleArticleCount: fixture.visibleArticleCount }));
});
