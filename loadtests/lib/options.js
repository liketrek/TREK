// Shared k6 presets.
// BASE_URL points at the target TREK instance. Default is the isolated E2E backend (client/e2e/server-launch.mjs on :3001).
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

// Seeded admin credentials (match client/e2e/server-launch.mjs).
export const CREDS = {
  email: __ENV.TREK_EMAIL || 'e2e@trek.local',
  password: __ENV.TREK_PASSWORD || 'E2eTest12345!',
};

// Default gates for read scenarios.
export const thresholds = {
  http_req_failed: ['rate<0.01'],
  http_req_duration: ['p(95)<800'],
};

// Reusable load profiles.
export const stages = {
  smoke: [{ duration: '10s', target: 1 }],
  ramp: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 20 },
    { duration: '10s', target: 0 },
  ],
  spike: [
    { duration: '10s', target: 5 },
    { duration: '20s', target: 50 },
    { duration: '20s', target: 5 },
    { duration: '10s', target: 0 },
  ],
};
