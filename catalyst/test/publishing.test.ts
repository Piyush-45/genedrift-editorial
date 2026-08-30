import assert from "node:assert/strict";
import test from "node:test";
import type { PublicationHandoff } from "../src/domain";
import { MemoryCallbackClient, MemoryMediaSource, MemoryObjectStore, MemoryPublicationAuthority, MemoryPublicationStore, MemoryScheduler } from "../src/adapters/memory";
import { PublishingService } from "../src/service";
import { asPublicationError, PublicationError } from "../src/errors";
import { sha256Hex, signRequest, verifyRequestSignature } from "../src/security";
import { CatalystPublicationStore, CatalystScheduler } from "../src/adapters/catalyst";
import { PublicContentService } from "../src/publicContent";

const initialNow = new Date("2026-08-26T10:00:00.000Z");

function handoff(overrides: { action?: "publish" | "schedule" | "retract"; scheduledAt?: string | null; revisionNumber?: number; revisionUuid?: string; idempotencyKey?: string; articleUuid?: string } = {}): PublicationHandoff {
  const editorDocument = {
    type: "doc" as const,
    content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "A safe heading" }] },
      { type: "paragraph", content: [
        { type: "text", text: "Read " },
        { type: "text", text: "this", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] },
        { type: "text", text: " <script>alert(1)</script>" }
      ] }
    ]
  };
  const revisionNumber = overrides.revisionNumber ?? 1;
  const revisionUuid = overrides.revisionUuid ?? `revision-uuid-${revisionNumber}`;
  const action = overrides.action ?? "publish";
  const scheduledAt = action === "schedule" ? (overrides.scheduledAt ?? "2026-08-26T10:05:00.000Z") : null;
  return {
    schemaVersion: 2,
    action,
    job: {
      creatorJobId: `4717410000000${revisionNumber}`,
      idempotencyKey: overrides.idempotencyKey ?? `${action}-article-revision-${revisionNumber}`,
      requestedAt: initialNow.toISOString(),
      scheduledAt,
      requestedByEmployeeId: "employee-1"
    },
    article: {
      creatorRecordId: "article-record-1",
      uuid: overrides.articleUuid ?? "article-uuid-0001",
      workflowState: action === "schedule" ? "Scheduled" : action === "retract" ? "Published" : "Approved",
      approvedRevisionId: `revision-record-${revisionNumber}`,
      primaryCategory: "Regulatory Affairs",
      tags: ["Gene therapy"]
    },
    revision: {
      creatorRecordId: `revision-record-${revisionNumber}`,
      uuid: revisionUuid,
      number: revisionNumber,
      state: action === "retract" ? "Published" : "Approved",
      title: `Article revision ${revisionNumber}`,
      slug: `article-revision-${revisionNumber}`,
      excerpt: "A publication boundary test.",
      editorDocument,
      documentChecksum: sha256Hex(JSON.stringify(editorDocument)),
      seoTitle: "Safe title",
      seoDescription: "Safe description",
      canonicalUrlOverride: "",
      robotsDirective: "Index Follow",
      wordCount: 12,
      readingTimeMinutes: 1,
      approvedAt: "2026-08-26T09:55:00.000Z"
    },
    media: [],
    retraction: action === "retract" ? { reason: "Material accuracy concern", replacementPath: "/insights" } : null
  };
}

function harness() {
  let now = new Date(initialNow);
  const store = new MemoryPublicationStore();
  const objects = new MemoryObjectStore();
  const scheduler = new MemoryScheduler();
  const callbacks = new MemoryCallbackClient();
  const authority = new MemoryPublicationAuthority();
  const mediaSource = new MemoryMediaSource();
  const service = new PublishingService(store, objects, scheduler, callbacks, authority, mediaSource, {
    publishRetry: { maxAttempts: 3, baseDelayMs: 60_000, maxDelayMs: 600_000 },
    callbackRetry: { maxAttempts: 3, baseDelayMs: 60_000, maxDelayMs: 600_000 },
    leaseDurationMs: 300_000,
    pointerCasAttempts: 4,
    maxMediaBytes: 10 * 1024 * 1024,
    now: () => new Date(now)
  });
  return { store, objects, scheduler, callbacks, authority, mediaSource, service, setNow(value: string) { now = new Date(value); } };
}

test("validates HMAC signatures and rejects tampering or stale timestamps", () => {
  const secret = "x".repeat(32);
  const body = Buffer.from('{"hello":"world"}');
  const timestamp = String(Math.floor(initialNow.getTime() / 1000));
  const nonce = "nonce-12345678";
  const signature = signRequest(secret, "POST", "/v1/publications", timestamp, nonce, body);
  assert.doesNotThrow(() => verifyRequestSignature(secret, "POST", "/v1/publications", body, { timestamp, nonce, signature }, initialNow, 300));
  assert.throws(() => verifyRequestSignature(secret, "POST", "/v1/publications", Buffer.from("tampered"), { timestamp, nonce, signature }, initialNow, 300), /Invalid request signature/);
  assert.throws(() => verifyRequestSignature(secret, "POST", "/v1/publications", body, { timestamp, nonce, signature }, new Date(initialNow.getTime() + 301_000), 300), /clock skew/);
});

test("public content lists and resolves only current published pointers", async () => {
  const h = harness();
  const first = await h.service.acceptHandoff(handoff());
  await h.service.processPublication(first.request.requestId);

  const secondHandoff = handoff({
    articleUuid: "article-uuid-0002",
    revisionUuid: "revision-uuid-second",
    idempotencyKey: "publish-second-article-revision-1"
  });
  secondHandoff.revision.slug = "second-public-article";
  secondHandoff.revision.title = "Second public article";
  secondHandoff.article.primaryCategory = "Industry";
  secondHandoff.article.tags = ["Markets"];
  const second = await h.service.acceptHandoff(secondHandoff);
  await h.service.processPublication(second.request.requestId);

  const publicContent = new PublicContentService(h.store, h.objects);
  const page = await publicContent.list({ page: 1, limit: 1 });
  assert.equal(page.pagination.total, 2);
  assert.equal(page.articles.length, 1);
  assert.deepEqual(page.facets.categories, ["Industry", "Regulatory Affairs"]);

  const filtered = await publicContent.list({ page: 1, limit: 20, query: "markets", category: "industry", tag: "Markets" });
  assert.equal(filtered.articles.length, 1);
  assert.equal(filtered.articles[0].slug, "second-public-article");

  const resolved = await publicContent.resolveSlug("article-revision-1");
  assert.equal(resolved.status, "published");
  if (resolved.status === "published") {
    assert.equal(resolved.article.article.uuid, "article-uuid-0001");
    assert.match(resolved.article.html, /A safe heading/);
    assert.doesNotMatch(JSON.stringify(resolved.article), /creatorRecordId|approvedRevisionId|editorDocument/);
  }
  assert.deepEqual(await publicContent.resolveSlug("draft-never-published"), { status: "missing" });
});

test("public content removes retracted pointers from lists and returns retraction metadata by slug", async () => {
  const h = harness();
  const accepted = await h.service.acceptHandoff(handoff());
  await h.service.processPublication(accepted.request.requestId);
  const retraction = await h.service.acceptHandoff(handoff({ action: "retract", idempotencyKey: "retract-public-read-article" }));
  await h.service.processPublication(retraction.request.requestId);

  const publicContent = new PublicContentService(h.store, h.objects);
  const page = await publicContent.list({ page: 1, limit: 20 });
  assert.equal(page.pagination.total, 0);
  const resolved = await publicContent.resolveSlug("article-revision-1");
  assert.equal(resolved.status, "retracted");
  if (resolved.status === "retracted") {
    assert.equal(resolved.reason, "Material accuracy concern");
    assert.equal(resolved.replacementPath, "/insights");
  }
});

test("public content rejects pointer and immutable object identity drift", async () => {
  const h = harness();
  const accepted = await h.service.acceptHandoff(handoff());
  await h.service.processPublication(accepted.request.requestId);
  const pointer = h.store.pointers.get("article-uuid-0001")!;
  pointer.contentHash = "0".repeat(64);

  const publicContent = new PublicContentService(h.store, h.objects);
  await assert.rejects(() => publicContent.list({ page: 1, limit: 20 }), (error: unknown) => {
    const failure = asPublicationError(error);
    return failure.code === "PUBLIC_CONTENT_IDENTITY_MISMATCH" && failure.httpStatus === 500;
  });
});

test("preserves safe Catalyst SDK plain-object API errors", () => {
  const failure = asPublicationError({
    statusCode: 400,
    code: "INVALID_INPUT",
    message: "Job Scheduling rejected the cron payload",
    request: { headers: { authorization: "must-not-be-serialized" } }
  });
  assert.equal(failure.httpStatus, 400);
  assert.equal(failure.code, "CATALYST_INVALID_INPUT");
  assert.equal(failure.message, "Job Scheduling rejected the cron payload");
  assert.equal(failure.transient, false);
  assert.doesNotMatch(JSON.stringify(failure), /must-not-be-serialized/);
});

test("submits a typed one-time AppSail cron to Catalyst Job Scheduling", async () => {
  const submissions: any[] = [];
  const immediateSubmissions: any[] = [];
  const app = {
    jobScheduling() {
      return {
        job() {
          return {
            async submitJob(details: any) {
              immediateSubmissions.push(details);
              return { id: `job-${immediateSubmissions.length}` };
            }
          };
        },
        cron() {
          return {
            async createCron(details: any) {
              submissions.push(details);
              return { id: `cron-${submissions.length}` };
            }
          };
        }
      };
    }
  };
  const schedulerNow = new Date("2026-08-26T10:00:00.000Z").getTime();
  const scheduler = new CatalystScheduler(app, {
    jobPoolName: "gdgenedriftpublishing",
    appSailName: "gd-genedrift-publishing",
    appSailBaseUrl: "https://example.catalystappsail.in",
    publicationPath: "/internal/jobs/publish",
    callbackPath: "/internal/jobs/callback",
    internalSecret: "internal-test-secret"
  }, () => schedulerNow);
  const runAt = new Date("2100-01-01T00:00:00.000Z");

  assert.equal(await scheduler.dispatchPublicationNow("req-now"), "job-1");
  const immediateJob = immediateSubmissions[0];
  assert.equal(immediateJob.job_name.length, 20);
  assert.match(immediateJob.job_name, /^gdpub[a-f0-9]{15}$/);
  assert.equal(immediateJob.target_type, "AppSail");
  assert.equal(immediateJob.target_name, "gd-genedrift-publishing");
  assert.equal(immediateJob.jobpool_name, "gdgenedriftpublishing");
  assert.equal(immediateJob.request_method, "POST");
  assert.equal(immediateJob.url, "/internal/jobs/publish");
  assert.deepEqual(JSON.parse(immediateJob.request_body), { requestId: "req-now" });
  assert.equal("cron_detail" in immediateJob, false);

  assert.equal(await scheduler.schedulePublication("req-1", runAt, true), "cron-1");
  const submitted = submissions[0];
  assert.ok(submitted.cron_name.length >= 1 && submitted.cron_name.length <= 30);
  assert.match(submitted.cron_name, /^gdpub[a-f0-9]{25}$/);
  assert.equal("description" in submitted, false);
  assert.equal(submitted.cron_type, "OneTime");
  assert.equal(submitted.cron_detail.time_of_execution, String(Math.floor(runAt.getTime() / 1000)));
  assert.equal(submitted.job_meta.job_name.length, 20);
  assert.match(submitted.job_meta.job_name, /^gdpub[a-f0-9]{15}$/);
  assert.equal(submitted.job_meta.target_type, "AppSail");
  assert.equal(submitted.job_meta.target_name, "gd-genedrift-publishing");
  assert.equal(submitted.job_meta.jobpool_name, "gdgenedriftpublishing");
  assert.equal(submitted.job_meta.url, "/internal/jobs/publish");
  assert.equal("job_config" in submitted.job_meta, false);
  assert.deepEqual(JSON.parse(submitted.job_meta.request_body), { requestId: "req-1" });

  assert.equal(
    await scheduler.scheduleCallback("event-1", new Date(schedulerNow - 1_000)),
    "cron-2"
  );
  const immediate = submissions[1];
  assert.ok(immediate.cron_name.length <= 30);
  assert.ok(immediate.job_meta.job_name.length <= 20);
  assert.equal(
    immediate.cron_detail.time_of_execution,
    String(Math.floor((schedulerNow + 120_000) / 1000))
  );
  assert.equal(immediate.job_meta.url, "/internal/jobs/callback");
});

test("claims a scheduled Catalyst row when its offset timestamp is due in UTC", async () => {
  const queries: string[] = [];
  const row: Record<string, unknown> = {
    Request_ID: "req-offset-time",
    Idempotency_Key: "schedule-offset-time",
    Action: "schedule",
    Status: "Scheduled",
    Article_UUID: "article-offset-time",
    Revision_UUID: "revision-offset-time",
    Revision_Number: 1,
    Creator_Job_ID: "creator-job-offset-time",
    Scheduled_At: "2026-08-28T22:25:00+05:30",
    Attempt_Count: 0,
    Snapshot_Object_ID: "snapshots/offset-time.json",
    Content_Hash: "a".repeat(64),
    Created_At: "2026-08-28T16:52:18.331Z",
    Updated_At: "2026-08-28T16:52:18.331Z"
  };
  const app = {
    zcql() {
      return {
        async executeZCQLQuery(query: string) {
          queries.push(query);
          if (query.startsWith("SELECT")) return [{ GD_Publication_Requests: { ...row } }];
          if (query.includes("SET Status = 'Processing'")) {
            row.Status = "Processing";
            row.Lease_Token = "offset-lease";
            row.Lease_Until_Epoch_MS = 1787936400000;
          } else if (query.includes("SET Attempt_Count = 1")) {
            row.Attempt_Count = 1;
          }
          return [];
        }
      };
    },
    datastore() {
      return { table() { return { async insertRow() { return {}; } }; } };
    }
  };
  const store = new CatalystPublicationStore(app);

  const claimed = await store.claimRequest(
    "req-offset-time",
    "offset-lease",
    1787936400000,
    "2026-08-28T16:55:00.100Z"
  );

  assert.equal(claimed?.status, "Processing");
  assert.equal(claimed?.attemptCount, 1);
  const leaseUpdate = queries.find((query) => query.startsWith("UPDATE") && query.includes("SET Status = 'Processing'"));
  assert.match(leaseUpdate ?? "", /Status = 'Scheduled'/);
  assert.doesNotMatch(leaseUpdate ?? "", /Scheduled_At\s*<=/);
});

test("preserves the real Catalyst pointer insert error when no concurrent pointer exists", async () => {
  const apiError = { statusCode: 400, code: "INVALID_INPUT", message: "Invalid input value for column Serving_Status" };
  const app = {
    datastore() {
      return { table() { return { async insertRow() { throw apiError; } }; } };
    },
    zcql() {
      return { async executeZCQLQuery() { return []; } };
    }
  };
  const store = new CatalystPublicationStore(app);
  const pointer = {
    articleUuid: "article-pointer-error",
    publicationId: "publication-pointer-error",
    revisionUuid: "revision-pointer-error",
    revisionNumber: 1,
    contentHash: "a".repeat(64),
    objectId: "content/pointer-error.json",
    publishedAt: initialNow.toISOString(),
    pointerVersion: 1,
    servingStatus: "Published" as const,
    retractedAt: null,
    retractionReason: null,
    retractionEventId: null,
    replacementPath: null
  };

  await assert.rejects(
    () => store.compareAndSwapPointer(null, pointer),
    (error: unknown) => error === apiError
  );
});

test("publishes one immutable version and converges under duplicate delivery", async () => {
  const h = harness();
  const first = await h.service.acceptHandoff(handoff());
  const duplicate = await h.service.acceptHandoff(handoff());
  assert.equal(first.created, true);
  assert.equal(duplicate.created, false);
  assert.equal(h.scheduler.immediatePublicationJobs.size, 1);

  const published = await h.service.processPublication(first.request.requestId);
  assert.equal(published.status, "Succeeded");
  assert.equal(published.attemptCount, 1);
  assert.equal(h.store.versions.size, 1);
  assert.equal(h.store.pointers.get("article-uuid-0001")?.revisionNumber, 1);
  assert.equal(h.callbacks.delivered.filter((event) => event.status === "Succeeded").length, 1);

  const duplicateWorker = await h.service.processPublication(first.request.requestId);
  assert.equal(duplicateWorker.status, "Succeeded");
  assert.equal(h.store.versions.size, 1);
  assert.equal(h.objects.objects.size, 2, "one approved snapshot and one immutable published document");

  const version = [...h.store.versions.values()][0];
  const document = await h.objects.getJson<any>(version.objectId);
  assert.doesNotMatch(document.html, /javascript:/i);
  assert.match(document.html, /&lt;script&gt;/);
});

test("retracts the current pointer without deleting immutable publication history", async () => {
  const h = harness();
  const publishedRequest = await h.service.acceptHandoff(handoff());
  await h.service.processPublication(publishedRequest.request.requestId);
  const originalPointer = h.store.pointers.get("article-uuid-0001")!;

  const accepted = await h.service.acceptHandoff(handoff({ action: "retract", idempotencyKey: "retract-article-revision-1" }));
  const retracted = await h.service.processPublication(accepted.request.requestId);
  const pointer = h.store.pointers.get("article-uuid-0001")!;

  assert.equal(retracted.status, "Succeeded");
  assert.equal(pointer.servingStatus, "Retracted");
  assert.equal(pointer.publicationId, originalPointer.publicationId);
  assert.equal(pointer.pointerVersion, originalPointer.pointerVersion + 1);
  assert.equal(pointer.retractionReason, "Material accuracy concern");
  assert.equal(pointer.replacementPath, "/insights");
  assert.equal(h.store.versions.size, 1, "retraction keeps the immutable version");
  assert.equal(h.objects.objects.size, 3, "publish/retract snapshots and published document remain immutable");
  assert.equal(h.callbacks.delivered.at(-1)?.objectId, null);

  await h.service.processPublication(accepted.request.requestId);
  assert.equal(h.store.pointers.get("article-uuid-0001")?.pointerVersion, pointer.pointerVersion);
});

test("rejects retraction without a required reason", async () => {
  const h = harness();
  const invalid = { ...handoff({ action: "retract" }), retraction: null };
  await assert.rejects(() => h.service.acceptHandoff(invalid), /Retraction requires a reason/);
});

test("a stale published revision cannot retract a newer pointer", async () => {
  const h = harness();
  const newer = await h.service.acceptHandoff(handoff({ revisionNumber: 2, idempotencyKey: "publish-current-revision-2" }));
  await h.service.processPublication(newer.request.requestId);
  const staleRetraction = await h.service.acceptHandoff(handoff({ action: "retract", revisionNumber: 1, idempotencyKey: "retract-stale-revision-1" }));
  const result = await h.service.processPublication(staleRetraction.request.requestId);
  assert.equal(result.status, "Failed");
  assert.equal(result.lastErrorCode, "RETRACTION_POINTER_MISMATCH");
  assert.equal(h.store.pointers.get("article-uuid-0001")?.servingStatus, "Published");
  assert.equal(h.store.pointers.get("article-uuid-0001")?.revisionNumber, 2);
});

test("a stale revision cannot replace a newer published pointer", async () => {
  const h = harness();
  const newer = await h.service.acceptHandoff(handoff({ revisionNumber: 2, idempotencyKey: "publish-article-revision-2" }));
  await h.service.processPublication(newer.request.requestId);
  const older = await h.service.acceptHandoff(handoff({ revisionNumber: 1, idempotencyKey: "publish-article-revision-1-late" }));
  const result = await h.service.processPublication(older.request.requestId);
  assert.equal(result.status, "Failed");
  assert.equal(result.lastErrorCode, "STALE_REVISION");
  assert.equal(h.store.pointers.get("article-uuid-0001")?.revisionNumber, 2);
});

test("transient worker failures use bounded exponential retry and then succeed", async () => {
  const h = harness();
  const accepted = await h.service.acceptHandoff(handoff());
  h.objects.failPuts = 1;
  const retrying = await h.service.processPublication(accepted.request.requestId);
  assert.equal(retrying.status, "RetryScheduled");
  assert.equal(retrying.attemptCount, 1);
  assert.equal(retrying.nextAttemptAt, "2026-08-26T10:01:00.000Z");
  assert.equal(h.callbacks.delivered.at(-1)?.status, "Retrying");

  h.setNow("2026-08-26T10:01:00.000Z");
  const succeeded = await h.service.processPublication(accepted.request.requestId);
  assert.equal(succeeded.status, "Succeeded");
  assert.equal(succeeded.attemptCount, 2);
});

test("callback delivery is retried independently and never rolls back publication", async () => {
  const h = harness();
  h.callbacks.failSends = 1;
  const accepted = await h.service.acceptHandoff(handoff());
  const published = await h.service.processPublication(accepted.request.requestId);
  assert.equal(published.status, "Succeeded");
  const callback = [...h.store.callbackOutbox.values()][0];
  assert.equal(callback.deliveryStatus, "RetryScheduled");
  assert.equal(h.scheduler.callbackJobs.has(callback.eventId), true);

  h.setNow("2026-08-26T10:01:00.000Z");
  const delivered = await h.service.processCallback(callback.eventId);
  assert.equal(delivered.deliveryStatus, "Delivered");
  assert.equal(h.store.requests.get(accepted.request.requestId)?.status, "Succeeded");
});

test("scheduled work stays inert until its due time", async () => {
  const h = harness();
  const accepted = await h.service.acceptHandoff(handoff({ action: "schedule", scheduledAt: "2026-08-26T10:05:00.000Z", idempotencyKey: "schedule-article-revision-1" }));
  assert.equal(accepted.request.status, "Scheduled");
  assert.equal(h.scheduler.publicationJobs.get(accepted.request.requestId)?.toISOString(), "2026-08-26T10:05:00.000Z");
  const early = await h.service.processPublication(accepted.request.requestId);
  assert.equal(early.status, "Scheduled");
  assert.equal(h.store.versions.size, 0);

  h.setNow("2026-08-26T10:05:00.000Z");
  const due = await h.service.processPublication(accepted.request.requestId);
  assert.equal(due.status, "Succeeded");
});

test("rejects a user schedule too close to run without silently shifting its time", async () => {
  const h = harness();
  await assert.rejects(
    () => h.service.acceptHandoff(handoff({
      action: "schedule",
      scheduledAt: "2026-08-26T10:01:59.000Z",
      idempotencyKey: "schedule-too-close"
    })),
    /at least two minutes in the future/
  );
  assert.equal(h.store.requests.size, 0);
});

test("inline images require immutable published media mappings", async () => {
  const h = harness();
  const payload = handoff();
  payload.revision.editorDocument.content.push({ type: "mediaImage", attrs: { mediaId: "media-uuid-0001" } });
  payload.revision.documentChecksum = sha256Hex(JSON.stringify(payload.revision.editorDocument));
  await assert.rejects(() => h.service.acceptHandoff(payload), /Approved media source is missing/);
});

test("Creator media is verified, content-addressed in Stratus, and returned in the callback", async () => {
  const h = harness();
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
  const payload = handoff();
  payload.revision.editorDocument.content.push({ type: "mediaImage", attrs: { mediaId: "media-uuid-0001" } });
  payload.revision.documentChecksum = sha256Hex(JSON.stringify(payload.revision.editorDocument));
  payload.media = [{
    creatorRecordId: "media-record-1",
    mediaId: "media-uuid-0001",
    originalFilename: "approved image.png",
    mimeType: "image/png",
    fileSizeBytes: png.length,
    widthPixels: 1,
    heightPixels: 1,
    checksum: sha256Hex(png),
    altText: "Approved image",
    caption: "Caption",
    credit: "GeneDrift"
  }];
  h.mediaSource.files.set("media-record-1", png);

  const accepted = await h.service.acceptHandoff(payload);
  const published = await h.service.processPublication(accepted.request.requestId);

  assert.equal(published.status, "Succeeded");
  assert.equal(h.objects.objects.size, 3, "private snapshot, public media, and public article JSON");
  const event = h.callbacks.delivered.at(-1)!;
  assert.equal(event.media.length, 1);
  assert.match(event.media[0].objectKey, /^media\/[a-f0-9]{2}\/[a-f0-9]{64}\.png$/);
  assert.equal(event.media[0].publishedUrl, `https://published.example/${event.media[0].objectKey}`);
  const version = [...h.store.versions.values()][0];
  const document = await h.objects.getJson<any>(version.objectId);
  assert.match(document.html, /https:\/\/published\.example\/media\//);
});

test("a retried success callback reloads media mappings from the immutable published document", async () => {
  const h = harness();
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
  const payload = handoff();
  payload.revision.editorDocument.content.push({ type: "mediaImage", attrs: { mediaId: "media-uuid-0001" } });
  payload.revision.documentChecksum = sha256Hex(JSON.stringify(payload.revision.editorDocument));
  payload.media = [{
    creatorRecordId: "media-record-1",
    mediaId: "media-uuid-0001",
    originalFilename: "approved image.png",
    mimeType: "image/png",
    fileSizeBytes: png.length,
    widthPixels: 1,
    heightPixels: 1,
    checksum: sha256Hex(png),
    altText: "Approved image",
    caption: "Caption",
    credit: "GeneDrift"
  }];
  h.mediaSource.files.set("media-record-1", png);
  h.callbacks.failSends = 1;

  const accepted = await h.service.acceptHandoff(payload);
  await h.service.processPublication(accepted.request.requestId);
  const callback = [...h.store.callbackOutbox.values()][0];
  assert.equal(callback.deliveryStatus, "RetryScheduled");

  // Catalyst Data Store intentionally does not persist the potentially large
  // media array in the outbox row. Model that persisted shape before retry.
  h.store.callbackOutbox.get(callback.eventId)!.media = [];
  h.setNow("2026-08-26T10:01:00.000Z");
  const delivered = await h.service.processCallback(callback.eventId);

  assert.equal(delivered.deliveryStatus, "Delivered");
  assert.equal(h.callbacks.delivered.at(-1)?.media.length, 1);
  assert.match(h.callbacks.delivered.at(-1)!.media[0].objectKey, /^media\/[a-f0-9]{2}\/[a-f0-9]{64}\.png$/);
});

test("media checksum drift fails permanently before a published version is inserted", async () => {
  const h = harness();
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
  const payload = handoff();
  payload.media = [{
    creatorRecordId: "media-record-1", mediaId: "media-uuid-0001", originalFilename: "image.png",
    mimeType: "image/png", fileSizeBytes: png.length, widthPixels: 1, heightPixels: 1,
    checksum: "0".repeat(64), altText: "Image", caption: "", credit: ""
  }];
  h.mediaSource.files.set("media-record-1", png);

  const accepted = await h.service.acceptHandoff(payload);
  const failed = await h.service.processPublication(accepted.request.requestId);

  assert.equal(failed.status, "Failed");
  assert.equal(failed.lastErrorCode, "MEDIA_CHECKSUM_MISMATCH");
  assert.equal(h.store.versions.size, 0);
});

test("media type, size, and dimension drift are rejected before publication", async () => {
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
  const cases: Array<{ code: string; change: (asset: PublicationHandoff["media"][number]) => void }> = [
    { code: "MEDIA_TYPE_MISMATCH", change: (asset) => { asset.mimeType = "image/jpeg"; } },
    { code: "MEDIA_SIZE_MISMATCH", change: (asset) => { asset.fileSizeBytes += 1; } },
    { code: "MEDIA_DIMENSIONS_MISMATCH", change: (asset) => { asset.widthPixels = 2; } }
  ];

  for (const testCase of cases) {
    const h = harness();
    const payload = handoff({ idempotencyKey: `media-drift-${testCase.code.toLowerCase()}` });
    const asset: PublicationHandoff["media"][number] = {
      creatorRecordId: "media-record-1", mediaId: "media-uuid-0001", originalFilename: "image.png",
      mimeType: "image/png", fileSizeBytes: png.length, widthPixels: 1, heightPixels: 1,
      checksum: sha256Hex(png), altText: "Image", caption: "", credit: ""
    };
    testCase.change(asset);
    payload.media = [asset];
    h.mediaSource.files.set("media-record-1", png);
    const accepted = await h.service.acceptHandoff(payload);
    const failed = await h.service.processPublication(accepted.request.requestId);
    assert.equal(failed.status, "Failed");
    assert.equal(failed.lastErrorCode, testCase.code);
    assert.equal(h.store.versions.size, 0);
  }
});

test("Creator preflight denial prevents publication and pointer advancement", async () => {
  const h = harness();
  const accepted = await h.service.acceptHandoff(handoff());
  h.authority.error = new PublicationError(
    "The approved revision pointer changed after this job was accepted",
    "CREATOR_PREFLIGHT_REJECTED",
    false,
    409
  );

  const result = await h.service.processPublication(accepted.request.requestId);

  assert.equal(result.status, "Failed");
  assert.equal(result.lastErrorCode, "CREATOR_PREFLIGHT_REJECTED");
  assert.equal(h.store.versions.size, 0);
  assert.equal(h.store.pointers.size, 0);
  assert.equal(h.callbacks.delivered.at(-1)?.status, "Failed");
});

test("only the current worker lease can complete a publication request", async () => {
  const h = harness();
  const accepted = await h.service.acceptHandoff(handoff());
  const claimed = await h.store.claimRequest(
    accepted.request.requestId,
    "lease-owner",
    initialNow.getTime() + 300_000,
    initialNow.toISOString()
  );
  assert.equal(claimed?.attemptCount, 1);

  await assert.rejects(
    () => h.store.markRequestSucceeded(
      accepted.request.requestId,
      "stale-worker",
      1,
      "pub_stale",
      initialNow.toISOString()
    ),
    /lease lost/i
  );
  assert.equal((await h.store.getRequest(accepted.request.requestId))?.status, "Processing");
});

test("accepts exact Creator file-field JSON text as the approved document", async () => {
  const h = harness();
  const payload = handoff();
  const wirePayload = {
    ...payload,
    revision: {
      ...payload.revision,
      editorDocument: JSON.stringify(payload.revision.editorDocument)
    }
  };

  const accepted = await h.service.acceptHandoff(wirePayload);
  const result = await h.service.processPublication(accepted.request.requestId);

  assert.equal(result.status, "Succeeded");
  assert.equal(h.store.versions.size, 1);
});

test("rejects reuse of an idempotency key for a different snapshot", async () => {
  const h = harness();
  const original = handoff({ idempotencyKey: "one-key-one-snapshot" });
  await h.service.acceptHandoff(original);
  const conflicting = handoff({ idempotencyKey: "one-key-one-snapshot" });
  conflicting.revision.title = "Different approved content";

  await assert.rejects(
    () => h.service.acceptHandoff(conflicting),
    /Idempotency key was already used for a different snapshot/
  );
  assert.equal(h.store.requests.size, 1);
  assert.equal(h.scheduler.immediatePublicationJobs.size, 1);
});

test("publication retry stops at the configured attempt bound", async () => {
  const h = harness();
  const accepted = await h.service.acceptHandoff(handoff());
  h.objects.failPuts = 3;

  assert.equal((await h.service.processPublication(accepted.request.requestId)).status, "RetryScheduled");
  h.setNow("2026-08-26T10:01:00.000Z");
  assert.equal((await h.service.processPublication(accepted.request.requestId)).status, "RetryScheduled");
  h.setNow("2026-08-26T10:03:00.000Z");
  const failed = await h.service.processPublication(accepted.request.requestId);

  assert.equal(failed.status, "Failed");
  assert.equal(failed.attemptCount, 3);
  assert.equal(h.callbacks.delivered.at(-1)?.status, "Failed");
  assert.equal(h.store.versions.size, 0);
});

test("callback retry dead-letters without changing a successful publication", async () => {
  const h = harness();
  h.callbacks.failSends = 3;
  const accepted = await h.service.acceptHandoff(handoff());
  const published = await h.service.processPublication(accepted.request.requestId);
  assert.equal(published.status, "Succeeded");
  const callback = [...h.store.callbackOutbox.values()][0];

  h.setNow("2026-08-26T10:01:00.000Z");
  await h.service.processCallback(callback.eventId);
  h.setNow("2026-08-26T10:03:00.000Z");
  const dead = await h.service.processCallback(callback.eventId);

  assert.equal(dead.deliveryStatus, "DeadLetter");
  assert.equal(dead.deliveryAttemptCount, 3);
  assert.equal((await h.store.getRequest(accepted.request.requestId))?.status, "Succeeded");
  assert.equal(h.store.pointers.get("article-uuid-0001")?.revisionNumber, 1);
});
