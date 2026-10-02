# Production Readiness Review - 2026-09-08

## Verdict

The editorial widget and Catalyst publishing service now have a locally verified production candidate, but they are not yet cleared as live-production-ready. The remaining blocker is live validation in Zoho Creator/Catalyst after installing the candidate artifacts and confirming report permissions, callback delivery, queue behavior, and the Data Sharing export.

The attached Creator screenshots match the intended architecture: the rich article body is saved in `Article_Revisions.Editor_Document` as a JSON file. Creator reports/forms show that field as a file attachment, so the form is not the place where editors should add H2/H3, tables, links, or inline media. The Article Workspace widget is the rich editor. Metadata such as category, tags, SEO title, SEO description, robots directive, featured media, word count, and reading time remain normal Creator fields.

## Candidate Artifacts

- Widget candidate: `editor-widget/genedrift-editor-widget-production-candidate-v0.5.8.zip`
- Widget SHA-256: `a8757c36cdde3453a6c3b7c40d83b78810ef6bb085594dad451b31ae010f3b03`
- Widget contents: exactly 5 files: `app/assets/App.js`, `app/assets/editor.js`, `app/assets/index.css`, `app/index.html`, `plugin-manifest.json`.
- Catalyst candidate: `genedrift-catalyst-appsail-candidate-v0.4.4-production-readiness.zip`
- Catalyst SHA-256: `28193fc5f566d751e3425a15054db9572b46d4c43260b3fbf4b91159f1c62e8b`

The failed attempt to produce a cleaner production-only Catalyst dependency ZIP was moved to `work_artifacts/production-review-2026-09-08/FAILED-clean-catalyst-production-runtime.zip`. Do not deploy that file; npm left its staged dependency tree invalid.

## Confirmed Fixes

- Rich text body handling: `Editor_Document` is explicitly requested on revision reads, and a hidden report field no longer makes the widget treat an existing body as blank.
- Missing body files: if a revision has a checksum or file reference but Creator cannot return the JSON body, the widget fails visibly instead of opening an empty editable editor.
- Empty new drafts: a genuinely new draft with no uploaded document still opens with an empty editor.
- Save safety: stale, archived, or no-longer-active draft saves are rejected before a body upload is attempted.
- Recovery safety: blocked/quota-limited `localStorage` no longer interrupts editing or Creator autosave, and damaged/cross-revision recovery data is ignored.
- Dashboard refresh truthfulness: a successful publish/schedule/retract action is no longer shown as failed just because the follow-up dashboard refresh fails.
- Dashboard completeness: Creator report reads now follow `record_cursor` pagination instead of silently hiding rows beyond the first page.
- Publishing index scale: Catalyst pointer rebuild now uses the SDK row iterator instead of a single `SELECT *`, avoiding Catalyst's 300-row ZCQL cap.
- Accessibility polish: modal dialogs now trap focus, close with Escape when not busy, and return focus to the triggering control.
- Destructive reset: the Creator `reset_editorial_test_content` function is disabled in source, because the previous implementation deleted all article/media/review/publication/audit data without a test-data boundary.
- Dependency remediation: TipTap was upgraded to remove the runtime advisory; Catalyst `qs` was updated to a patched version.

## Verification Completed

- `npm test --prefix editor-widget`: 24 tests passed.
- `npm run build --prefix editor-widget`: passed. Vite still warns that `App.js` is larger than 500 kB after minification; this is an optimization backlog item, not a build failure.
- `../node_modules/.bin/zet validate` from `editor-widget/zet`: validation passed. The toolkit also printed a local self-update warning about `/Users/piyushtyagi/.config`; package validation still succeeded.
- `../node_modules/.bin/zet pack` from `editor-widget/zet`: created the candidate widget ZIP.
- `npm test --prefix catalyst`: 34 tests passed, including 1,800 indexed articles, deep pagination, search/filter coverage, callback retry/dead-letter behavior, and real JPEG/PNG/GIF/WebP media fixtures.
- `npm run typecheck --prefix editor-widget`: passed.
- `npm run typecheck --prefix catalyst`: passed.
- `npm run build --prefix frontend`: passed.
- Runtime dependency audits passed with zero vulnerabilities for `editor-widget --omit=dev`, `catalyst --omit=dev`, and `frontend --omit=dev`.

## Documentation Evidence

- Zoho Creator JS API V2 states that report reads return visible/custom fields, hidden fields are not fetched, `max_records` supports 200/500/1000, and `record_cursor` is used to fetch additional batches: https://www.zoho.com/creator/help/js-api/v2/get-records.html
- Zoho Creator API V2.1 confirms the same pagination model and lookup/multivalue response structures: https://www.zoho.com/creator/help/api/v2.1/get-records.html
- Zoho Catalyst ZCQL docs state that `SELECT *` returns a maximum of 300 rows per query: https://docs.catalyst.zoho.com/en/cloud-scale/help/zcql/select/
- Zoho Catalyst FAQ repeats the 300-row `SELECT *` limit and recommends iterating when more records are needed: https://docs.catalyst.zoho.com/en/faq/cloud-scale/

## Client Explanation For Forms

Yes, the requested form-backed blog system is achievable, but the article body should not be edited directly inside a normal Creator report form. The clean model is:

- Creator `Articles` form stores the article-level record and workflow state.
- Creator `Article_Revisions` form stores revision metadata fields.
- `Article_Revisions.Editor_Document` stores the rich body as a JSON file.
- The Article Workspace widget reads and writes that JSON file and gives editors the real rich-text experience.
- AI writing can later create or update the same structured JSON document, but it should pass through a controlled service/function that validates schema, permissions, version tokens, media references, and metadata before saving to Creator.

That means AI is not a blocker for the form work. The forms should first expose and protect the right fields; AI can be added as another writer into the same save pipeline.

## Remaining Production Blockers

- Live Creator browser testing could not be completed in this Codex task because the browser security policy check failed before access was granted to `https://creatorapp.zoho.in`.
- The widget candidate has not been installed into the live Creator app yet.
- Least-privilege report permissions still need to be proven in Creator using non-admin roles, especially `Editor_Document` file read/write, media file read/write, taxonomy update, and publication job visibility.
- The save path is still not fully atomic because Creator stores the body file and revision metadata in separate operations. The client-side guards reduce stale saves, but a server-side save endpoint is still the right long-term hardening.
- The live `record_cursor` shape returned by the Creator JS SDK should be verified after install. The implementation follows Zoho's docs, but the exact SDK wrapper shape must be confirmed against the live app.
- The disabled reset function must be installed or the live reset endpoint must be removed before production access is expanded.
- Catalyst callback delivery, idempotency, scheduled publishing, retry/dead-letter recovery, and queue claims need a live smoke test after deploying the Catalyst candidate.
- Current Creator Data Sharing export and OAuth/credential rotation status still need to be captured before client handoff.

## Non-Blocking Follow-Ups

- Consider syncing `Articles.Working_Title` when the active draft revision title changes, so dashboard titles track draft title edits. This should be done through a guarded server mutation rather than an opportunistic client-only update.
- Connect the public website's `robots.txt`, article sitemap, and RSS to the Catalyst public endpoints. The frontend build passes, but current sitemap output still only lists `/` and `/insights`.
- Split the widget bundle after the live candidate is stable; the current 610 kB `App.js` build warning is acceptable for now but worth reducing later.
