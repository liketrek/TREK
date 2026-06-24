// k6 ramp-up read load on GET /api/trips + /:id/bundle, gated on p95/p99 + error rate.
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { BASE_URL, CREDS, stages } from './lib/options.js';

export const options = {
  stages: stages.ramp,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{name:trips-list}': ['p(95)<800', 'p(99)<1500'],
    'http_req_duration{name:trip-bundle}': ['p(95)<1000', 'p(99)<2000'],
  },
};

export function setup() {
  const login = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(CREDS), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(login, { 'login → 200': (r) => r.status === 200 });
  const token = login.json('token');

  const authJson = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } };

  // Fresh seed DBs have no trips — create one so the read paths return real data.
  const created = http.post(
    `${BASE_URL}/api/trips`,
    JSON.stringify({ title: 'k6 read-load trip', start_date: '2026-09-01', end_date: '2026-09-07' }),
    authJson,
  );
  check(created, { 'seed trip → 201': (r) => r.status === 201 });

  return { token, tripId: created.json('trip.id') };
}

export default function (data) {
  const params = { headers: { Authorization: `Bearer ${data.token}` } };

  group('list trips', () => {
    const res = http.get(`${BASE_URL}/api/trips`, { ...params, tags: { name: 'trips-list' } });
    check(res, {
      'list → 200': (r) => r.status === 200,
      'list → trips array': (r) => Array.isArray(r.json('trips')),
    });
  });

  group('trip bundle', () => {
    const res = http.get(`${BASE_URL}/api/trips/${data.tripId}/bundle`, { ...params, tags: { name: 'trip-bundle' } });
    check(res, { 'bundle → 200': (r) => r.status === 200 });
  });

  sleep(1);
}

export function handleSummary(data) {
  return { 'results/trips-read.summary.json': JSON.stringify(data, null, 2) };
}
