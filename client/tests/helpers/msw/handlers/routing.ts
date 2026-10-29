import { http, HttpResponse } from 'msw';

/**
 * The routing relay to the TREK services' Valhalla, answered the way a server
 * without an installation key answers it: 503, so the planner turns to the
 * public Valhalla as it does there. A test about the relay overrides this
 * with server.use().
 */
export const routingHandlers = [
  http.post('/api/routing/valhalla/:action', () =>
    HttpResponse.json({ error: 'The TREK routing service is not available on this instance' }, { status: 503 })
  ),
];
