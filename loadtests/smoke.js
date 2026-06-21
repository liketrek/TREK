// Minimal k6 smoke against the public health endpoint. Proves the toolchain works and the target is reachable.
import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL } from './lib/options.js';

export const options = {
  vus: 5,
  duration: '10s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/_nest/health`, { tags: { name: 'health' } });
  check(res, {
    'status is 200': (r) => r.status === 200,
    'body ok:true': (r) => r.json('ok') === true,
  });
}

export function handleSummary(data) {
  return { 'results/smoke.summary.json': JSON.stringify(data, null, 2) };
}
