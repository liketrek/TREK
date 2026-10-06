import { http, HttpResponse } from 'msw';

// The connectivity probe (src/sync/connectivity.ts) polls this from any mounted
// page; without a handler it was the single most frequent "unhandled request"
// warning in a green run (3.6k per CI job). Answers exactly what the server does.
export const healthHandlers = [
  http.get('/api/health', () => HttpResponse.json({ status: 'ok' })),
];
