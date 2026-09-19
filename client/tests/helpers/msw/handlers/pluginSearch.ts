import { http, HttpResponse } from 'msw';

/**
 * The search-provider route, answering the way an instance with no such plugin does.
 *
 * `mapsApi.search` asks this beside every place search (#2221), so without a default
 * handler every suite that searches for a place has an unhandled request hanging in it
 * until its own deadline — which is a slow test with a warning in it, not a real
 * failure, and the kind that later reads as flake.
 *
 * Empty is the honest default: a plugin providing a search index is the exception, and
 * a suite that wants hits says so with its own `server.use`.
 */
export const pluginSearchHandlers = [
  http.get('/api/plugin-search', () => HttpResponse.json({ places: [] })),
];
