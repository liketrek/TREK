// Auth/login spike.
// The server-side cost is bcrypt verification plus the per-IP rate limiter.
// 429 is an expected response under a spike (the limiter shedding load), so it
// is not counted as a failure. Only 5xx / connection errors are.
import http from "k6/http";
import { check } from "k6";
import { Rate } from "k6/metrics";
import { BASE_URL, CREDS, stages } from "./lib/options.js";

// Treat 200 and 429 as expected so the rate-limiter's 429s don't inflate http_req_failed.
http.setResponseCallback(http.expectedStatuses(200, 429));

const rateLimited = new Rate("rate_limited_429");

export const options = {
  stages: stages.spike,
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.05"],
  },
};

export default function () {
  const res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(CREDS), {
    headers: { "Content-Type": "application/json" },
    tags: { name: "POST /api/auth/login" },
  });
  rateLimited.add(res.status === 429);
  check(res, {
    "handled (200 or 429)": (r) => r.status === 200 || r.status === 429,
    "no server error": (r) => r.status < 500,
  });
}

export function handleSummary(data) {
  return { "results/auth-login.summary.json": JSON.stringify(data, null, 2) };
}
