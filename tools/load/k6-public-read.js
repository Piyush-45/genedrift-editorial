import http from "k6/http";
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";

const profiles = {
  smoke: [{ duration: "1m", target: 2 }],
  normal: [{ duration: "1m", target: 10 }, { duration: "4m", target: 10 }],
  busy: [{ duration: "1m", target: 25 }, { duration: "4m", target: 25 }],
  stress: [{ duration: "1m", target: 25 }, { duration: "1m", target: 50 }, { duration: "1m", target: 0 }]
};

const profile = __ENV.PROFILE || "smoke";
if (!profiles[profile]) throw new Error(`Unknown PROFILE ${profile}`);
export const options = {
  stages: profiles[profile],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1000"],
    checks: ["rate>0.99"]
  }
};

http.setResponseCallback(http.expectedStatuses({ min: 200, max: 399 }, 404, 410));
const routeTime = new Trend("genedrift_route_duration", true);
const base = (__ENV.BASE_URL || "http://127.0.0.1:4100").replace(/\/$/, "");
const publishedSlug = __ENV.PUBLISHED_SLUG || "fixture-insight-0001";
const retractedSlug = __ENV.RETRACTED_SLUG || "fixture-retracted-article";
const category = __ENV.CATEGORY || "Science";

function get(path, expected, name) {
  const response = http.get(`${base}${path}`, { tags: { route: name } });
  routeTime.add(response.timings.duration, { route: name });
  check(response, { [`${name} returns ${expected}`]: (value) => value.status === expected });
  return response;
}

export default function () {
  const first = get("/v1/public/articles?page=1&limit=20", 200, "list-page-1");
  check(first, { "list payload is valid": (response) => response.json("pagination.total") >= 1 });
  get("/v1/public/articles?page=12&limit=20", 200, "list-deep-page");
  get("/v1/public/articles?q=evidence&limit=12", 200, "search");
  get(`/v1/public/articles?category=${encodeURIComponent(category)}&limit=12`, 200, "category-filter");
  get(`/v1/public/articles/${encodeURIComponent(publishedSlug)}`, 200, "article-detail");
  get("/v1/public/articles/fixture-missing-article", 404, "missing-detail");
  get(`/v1/public/articles/${encodeURIComponent(retractedSlug)}`, 410, "retracted-detail");
  sleep(1);
}
