# GeneDrift catalog and read-load tools

These tools use synthetic data only. They keep catalog size, public read traffic,
and publication-workflow throughput as separate claims.

## 1,800-item catalog fixture

From the repository root:

```bash
node tools/catalog/generate.mjs
node tools/catalog/mock-api.mjs
```

The mock API starts on `http://127.0.0.1:4100`. Point a local frontend at it:

```bash
GENEDRIFT_PUBLIC_API_BASE_URL=http://127.0.0.1:4100 NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 npm --prefix frontend run dev
```

The fixture contains 1,800 visible articles plus one HTTP 410 retraction case.
Generated files are disposable and are not production evidence.

## k6 public-read test

Run only against an approved non-production target:

```bash
PROFILE=smoke BASE_URL=http://127.0.0.1:4100 k6 run tools/load/k6-public-read.js
PROFILE=normal BASE_URL=https://approved-preview.example k6 run tools/load/k6-public-read.js
PROFILE=busy BASE_URL=https://approved-preview.example k6 run tools/load/k6-public-read.js
```

Set `PUBLISHED_SLUG`, `RETRACTED_SLUG`, and `CATEGORY` when the target is not the
fixture API. The optional `stress` profile must be approved separately and run
only after the normal stages pass while platform limits and cost are monitored.

This suite does not send publication jobs or carry Creator/Catalyst credentials.
Write-throughput tests must use controlled synthetic jobs and a separate cleanup
plan; do not aim 1,800 writes at Creator, Catalyst Production, or a client account.
