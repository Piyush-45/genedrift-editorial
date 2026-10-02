import { timingSafeEqual } from "node:crypto";
import express, { type NextFunction, type Request, type Response } from "express";
import catalyst from "zcatalyst-sdk-node";
import { ZodError } from "zod";
import { CatalystPublicationStore, CatalystScheduler, CatalystStratusObjectStore, ZohoCreatorCallbackClient, ZohoCreatorMediaSource, ZohoCreatorPublicationAuthority } from "./adapters/catalyst";
import { loadEnvironment } from "./config";
import { asPublicationError, PublicationError } from "./errors";
import { PublishingService } from "./service";
import { PublicContentService } from "./publicContent";
import { sha256Hex, verifyRequestSignature } from "./security";

type RawRequest = Request & { rawBody?: Buffer };

const SERVICE_VERSION = "0.4.2";
const SCHEDULER_PAYLOAD_VERSION = 4;
const app = express();
app.disable("x-powered-by");
app.use(express.json({
  limit: "6mb",
  verify: (req, _res, buffer) => {
    (req as RawRequest).rawBody = Buffer.from(buffer);
  }
}));

function secureEquals(actual: string | undefined, expected: string): boolean {
  if (!actual) return false;
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function createService(req: Request): { service: PublishingService; publicContent: PublicContentService; store: CatalystPublicationStore; env: ReturnType<typeof loadEnvironment> } {
  const env = loadEnvironment();
  const catalystApp = catalyst.initialize(req as any, { scope: "admin" });
  const store = new CatalystPublicationStore(catalystApp);
  const objects = new CatalystStratusObjectStore(
    catalystApp,
    env.CATALYST_STRATUS_PRIVATE_BUCKET,
    env.CATALYST_STRATUS_PUBLIC_BUCKET,
    env.CATALYST_STRATUS_PUBLIC_BASE_URL
  );
  const scheduler = new CatalystScheduler(catalystApp, {
    jobPoolName: env.CATALYST_JOBPOOL_NAME,
    appSailName: env.CATALYST_APPSAIL_NAME,
    appSailBaseUrl: env.CATALYST_APPSAIL_BASE_URL,
    publicationPath: env.CATALYST_APPSAIL_JOB_PATH,
    callbackPath: env.CATALYST_APPSAIL_CALLBACK_PATH,
    internalSecret: env.INTERNAL_JOB_SECRET
  });
  const callbacks = new ZohoCreatorCallbackClient(
    catalystApp,
    env.CREATOR_CALLBACK_URL,
    env.PUBLISHING_HMAC_SECRET,
    {
      connectorName: env.CREATOR_CONNECTION_NAME,
      clientId: env.CREATOR_OAUTH_CLIENT_ID,
      clientSecret: env.CREATOR_OAUTH_CLIENT_SECRET,
      refreshToken: env.CREATOR_OAUTH_REFRESH_TOKEN,
      tokenUrl: env.CREATOR_OAUTH_TOKEN_URL,
      staticToken: env.CREATOR_OAUTH_TOKEN
    }
  );
  const authority = new ZohoCreatorPublicationAuthority(
    catalystApp,
    env.CREATOR_VALIDATE_URL,
    {
      connectorName: env.CREATOR_CONNECTION_NAME,
      clientId: env.CREATOR_OAUTH_CLIENT_ID,
      clientSecret: env.CREATOR_OAUTH_CLIENT_SECRET,
      refreshToken: env.CREATOR_OAUTH_REFRESH_TOKEN,
      tokenUrl: env.CREATOR_OAUTH_TOKEN_URL,
      staticToken: env.CREATOR_OAUTH_TOKEN
    }
  );
  const mediaSource = new ZohoCreatorMediaSource(
    catalystApp,
    {
      connectorName: env.CREATOR_CONNECTION_NAME,
      clientId: env.CREATOR_OAUTH_CLIENT_ID,
      clientSecret: env.CREATOR_OAUTH_CLIENT_SECRET,
      refreshToken: env.CREATOR_OAUTH_REFRESH_TOKEN,
      tokenUrl: env.CREATOR_OAUTH_TOKEN_URL,
      staticToken: env.CREATOR_OAUTH_TOKEN
    },
    {
      apiBaseUrl: env.CREATOR_API_BASE_URL,
      accountOwner: env.CREATOR_ACCOUNT_OWNER,
      appLinkName: env.CREATOR_APP_LINK_NAME,
      reportLinkName: env.CREATOR_MEDIA_REPORT_LINK_NAME,
      fileFieldLinkName: env.CREATOR_MEDIA_FILE_FIELD_LINK_NAME,
      environment: env.CREATOR_ENVIRONMENT,
      maxBytes: env.MAX_MEDIA_BYTES
    }
  );
  return {
    env,
    store,
    publicContent: new PublicContentService(store, objects),
    service: new PublishingService(store, objects, scheduler, callbacks, authority, mediaSource, {
      publishRetry: { maxAttempts: env.PUBLISH_MAX_ATTEMPTS, baseDelayMs: env.PUBLISH_BASE_DELAY_MS, maxDelayMs: env.PUBLISH_MAX_DELAY_MS },
      callbackRetry: { maxAttempts: env.CALLBACK_MAX_ATTEMPTS, baseDelayMs: env.CALLBACK_BASE_DELAY_MS, maxDelayMs: env.CALLBACK_MAX_DELAY_MS },
      leaseDurationMs: env.LEASE_DURATION_MS,
      pointerCasAttempts: env.POINTER_CAS_ATTEMPTS,
      maxMediaBytes: env.MAX_MEDIA_BYTES
    })
  };
}

function boundedInteger(value: unknown, fallback: number, minimum: number, maximum: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, parsed));
}

function sendCacheableJson(req: Request, res: Response, payload: unknown, maxAgeSeconds = 30): void {
  const body = JSON.stringify(payload);
  const etag = `\"${sha256Hex(body)}\"`;
  res.setHeader("Cache-Control", `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds}, must-revalidate`);
  res.setHeader("ETag", etag);
  if (req.header("if-none-match") === etag) {
    res.status(304).end();
    return;
  }
  res.type("application/json").send(body);
}

function escapeXml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function siteArticleUrl(baseUrl: string, slug: string): string {
  return `${baseUrl.replace(/\/$/, "")}/insights/${encodeURIComponent(slug)}`;
}

async function authenticateCreatorRequest(req: RawRequest, store: CatalystPublicationStore, secret: string, skew: number): Promise<void> {
  const rawBody = req.rawBody ?? Buffer.alloc(0);
  const timestamp = String(req.header("x-genedrift-timestamp") ?? "");
  const nonce = String(req.header("x-genedrift-nonce") ?? "");
  const signature = String(req.header("x-genedrift-signature") ?? "");
  verifyRequestSignature(secret, req.method, req.path, rawBody, { timestamp, nonce, signature }, new Date(), skew);
  const expiresAt = new Date((Number(timestamp) + skew) * 1000).toISOString();
  if (!(await store.claimNonce(nonce, expiresAt))) {
    throw new PublicationError("Request nonce has already been used", "AUTH_REPLAY_DETECTED", false, 409);
  }
}

app.get("/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "genedrift-publishing",
    version: SERVICE_VERSION,
    schedulerPayloadVersion: SCHEDULER_PAYLOAD_VERSION
  });
});

app.get("/health/config", (_req, res, next) => {
  try {
    const env = loadEnvironment();
    res.status(200).json({
      ok: true,
      stratus: {
        privateBucket: env.CATALYST_STRATUS_PRIVATE_BUCKET,
        publicBucket: env.CATALYST_STRATUS_PUBLIC_BUCKET,
        publicBaseUrl: env.CATALYST_STRATUS_PUBLIC_BASE_URL
      },
      publicSite: {
        baseUrl: env.PUBLIC_SITE_BASE_URL ?? null
      },
      appsail: {
        jobPoolName: env.CATALYST_JOBPOOL_NAME,
        appSailName: env.CATALYST_APPSAIL_NAME,
        baseUrl: env.CATALYST_APPSAIL_BASE_URL,
        jobPath: env.CATALYST_APPSAIL_JOB_PATH,
        callbackPath: env.CATALYST_APPSAIL_CALLBACK_PATH
      },
      creator: {
        apiBaseUrl: env.CREATOR_API_BASE_URL,
        accountOwner: env.CREATOR_ACCOUNT_OWNER,
        appLinkName: env.CREATOR_APP_LINK_NAME,
        validateUrl: env.CREATOR_VALIDATE_URL,
        callbackUrl: env.CREATOR_CALLBACK_URL,
        mediaReportLinkName: env.CREATOR_MEDIA_REPORT_LINK_NAME,
        mediaFileFieldLinkName: env.CREATOR_MEDIA_FILE_FIELD_LINK_NAME,
        environment: env.CREATOR_ENVIRONMENT
      },
      secrets: {
        publishingHmacSecretPresent: Boolean(env.PUBLISHING_HMAC_SECRET),
        internalJobSecretPresent: Boolean(env.INTERNAL_JOB_SECRET),
        creatorOAuthClientIdPresent: Boolean(env.CREATOR_OAUTH_CLIENT_ID),
        creatorOAuthClientSecretPresent: Boolean(env.CREATOR_OAUTH_CLIENT_SECRET),
        creatorOAuthRefreshTokenPresent: Boolean(env.CREATOR_OAUTH_REFRESH_TOKEN),
        creatorOAuthTokenUrl: env.CREATOR_OAUTH_TOKEN_URL,
        creatorStaticOAuthTokenPresent: Boolean(env.CREATOR_OAUTH_TOKEN)
      },
      retry: {
        callbackMaxAttempts: env.CALLBACK_MAX_ATTEMPTS,
        publishMaxAttempts: env.PUBLISH_MAX_ATTEMPTS,
        requestClockSkewSeconds: env.REQUEST_CLOCK_SKEW_SECONDS,
        leaseDurationMs: env.LEASE_DURATION_MS,
        pointerCasAttempts: env.POINTER_CAS_ATTEMPTS,
        maxMediaBytes: env.MAX_MEDIA_BYTES
      }
    });
  } catch (error) {
    next(error);
  }
});

app.use("/v1/public", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, If-None-Match");
  res.setHeader("Vary", "Origin");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

app.get("/v1/public/articles", async (req, res, next) => {
  try {
    const { publicContent } = createService(req);
    const result = await publicContent.list({
      page: boundedInteger(req.query.page, 1, 1, 100_000),
      limit: boundedInteger(req.query.limit, 20, 1, 50),
      query: typeof req.query.q === "string" ? req.query.q.slice(0, 200) : undefined,
      category: typeof req.query.category === "string" ? req.query.category.slice(0, 250) : undefined,
      tag: typeof req.query.tag === "string" ? req.query.tag.slice(0, 250) : undefined
    });
    sendCacheableJson(req, res, { ok: true, ...result });
  } catch (error) {
    next(error);
  }
});

app.get("/v1/public/articles/:slug", async (req, res, next) => {
  try {
    const slug = String(req.params.slug ?? "").trim();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 180) {
      throw new PublicationError("Public article slug is invalid", "PUBLIC_SLUG_INVALID", false, 400);
    }
    const { publicContent } = createService(req);
    const result = await publicContent.resolveSlug(slug);
    if (result.status === "missing") {
      res.status(404).json({ ok: false, code: "PUBLIC_ARTICLE_NOT_FOUND", message: "Published article not found" });
      return;
    }
    if (result.status === "retracted") {
      res.setHeader("Cache-Control", "no-store");
      res.status(410).json({
        ok: false,
        code: "PUBLIC_ARTICLE_RETRACTED",
        message: "This article has been retracted",
        articleUuid: result.articleUuid,
        retractedAt: result.retractedAt,
        reason: result.reason,
        replacementPath: result.replacementPath
      });
      return;
    }
    sendCacheableJson(req, res, {
      ok: true,
      article: result.article,
      pointer: {
        articleUuid: result.pointer.articleUuid,
        publicationId: result.pointer.publicationId,
        revisionUuid: result.pointer.revisionUuid,
        revisionNumber: result.pointer.revisionNumber,
        publishedAt: result.pointer.publishedAt,
        pointerVersion: result.pointer.pointerVersion
      }
    }, 5);
  } catch (error) {
    next(error);
  }
});

app.get("/v1/public/taxonomy", async (req, res, next) => {
  try {
    const { publicContent } = createService(req);
    const result = await publicContent.list({ page: 1, limit: 1 });
    sendCacheableJson(req, res, { ok: true, ...result.facets }, 60);
  } catch (error) {
    next(error);
  }
});

app.get("/v1/public/sitemap.xml", async (req, res, next) => {
  try {
    const { publicContent, env } = createService(req);
    if (!env.PUBLIC_SITE_BASE_URL) throw new PublicationError("PUBLIC_SITE_BASE_URL is not configured", "PUBLIC_SITE_URL_REQUIRED", false, 503);
    const articles = await publicContent.discoverableArticles();
    const urls = articles.map((article) => `<url><loc>${escapeXml(siteArticleUrl(env.PUBLIC_SITE_BASE_URL!, article.slug))}</loc><lastmod>${escapeXml(article.publishedAt)}</lastmod></url>`).join("");
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=60, must-revalidate");
    res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
  } catch (error) {
    next(error);
  }
});

app.get("/v1/public/rss.xml", async (req, res, next) => {
  try {
    const { publicContent, env } = createService(req);
    if (!env.PUBLIC_SITE_BASE_URL) throw new PublicationError("PUBLIC_SITE_BASE_URL is not configured", "PUBLIC_SITE_URL_REQUIRED", false, 503);
    const articles = (await publicContent.discoverableArticles()).slice(0, 50);
    const items = articles.map((article) => {
      const url = siteArticleUrl(env.PUBLIC_SITE_BASE_URL!, article.slug);
      return `<item><title>${escapeXml(article.title)}</title><link>${escapeXml(url)}</link><guid isPermaLink="true">${escapeXml(url)}</guid><pubDate>${escapeXml(new Date(article.publishedAt).toUTCString())}</pubDate><description>${escapeXml(article.excerpt)}</description></item>`;
    }).join("");
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=60, must-revalidate");
    res.type("application/rss+xml").send(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>GeneDrift Insights</title><link>${escapeXml(env.PUBLIC_SITE_BASE_URL)}</link><description>GeneDrift published insights</description>${items}</channel></rss>`);
  } catch (error) {
    next(error);
  }
});

app.post("/v1/publications", async (req: RawRequest, res, next) => {
  try {
    const { service, store, env } = createService(req);
    await authenticateCreatorRequest(req, store, env.PUBLISHING_HMAC_SECRET, env.REQUEST_CLOCK_SKEW_SECONDS);
    const accepted = await service.acceptHandoff(req.body);
    res.status(accepted.created ? 202 : 200).json({
      ok: true,
      created: accepted.created,
      requestId: accepted.request.requestId,
      status: accepted.request.status,
      idempotencyKey: accepted.request.idempotencyKey,
      scheduledAt: accepted.request.scheduledAt
    });
  } catch (error) {
    next(error);
  }
});

app.post("/internal/jobs/publish", async (req, res, next) => {
  try {
    const env = loadEnvironment();
    if (!secureEquals(req.header("x-genedrift-internal-secret"), env.INTERNAL_JOB_SECRET)) {
      throw new PublicationError("Internal job authentication failed", "INTERNAL_AUTH_FAILED", false, 401);
    }
    const { service } = createService(req);
    const requestId = typeof req.body?.requestId === "string" ? req.body.requestId : "";
    if (!requestId) throw new PublicationError("requestId is required", "REQUEST_ID_REQUIRED", false, 400);
    const result = await service.processPublication(requestId);
    res.status(200).json({ ok: true, requestId, status: result.status, attemptCount: result.attemptCount, publicationId: result.publicationId });
  } catch (error) {
    next(error);
  }
});

app.post("/internal/jobs/callback", async (req, res, next) => {
  try {
    const env = loadEnvironment();
    if (!secureEquals(req.header("x-genedrift-internal-secret"), env.INTERNAL_JOB_SECRET)) {
      throw new PublicationError("Internal job authentication failed", "INTERNAL_AUTH_FAILED", false, 401);
    }
    const { service } = createService(req);
    const eventId = typeof req.body?.eventId === "string" ? req.body.eventId : "";
    if (!eventId) throw new PublicationError("eventId is required", "EVENT_ID_REQUIRED", false, 400);
    const result = await service.processCallback(eventId);
    res.status(200).json({ ok: true, eventId, deliveryStatus: result.deliveryStatus, deliveryAttemptCount: result.deliveryAttemptCount });
  } catch (error) {
    next(error);
  }
});

app.post("/internal/maintenance/rebuild-public-index", async (req, res, next) => {
  try {
    const env = loadEnvironment();
    if (!secureEquals(req.header("x-genedrift-internal-secret"), env.INTERNAL_JOB_SECRET)) {
      throw new PublicationError("Internal maintenance authentication failed", "INTERNAL_AUTH_FAILED", false, 401);
    }
    const { publicContent } = createService(req);
    const indexed = await publicContent.rebuildIndex();
    res.status(200).json({ ok: true, indexed });
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ZodError) {
    res.status(422).json({ ok: false, code: "PAYLOAD_INVALID", message: "Publication payload failed validation", issues: error.issues });
    return;
  }
  const failure = asPublicationError(error);
  console.error(JSON.stringify({ level: "error", code: failure.code, message: failure.message, transient: failure.transient }));
  res.status(failure.httpStatus).json({ ok: false, code: failure.code, message: failure.message, transient: failure.transient });
});

if (require.main === module) {
  const port = Number(process.env.X_ZOHO_CATALYST_LISTEN_PORT ?? process.env.PORT ?? 9000);
  app.listen(port, () => console.log(`GeneDrift publishing service listening on ${port}`));
}

export default app;
