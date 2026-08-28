import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from './helpers/msw/server';

// waitFor/findBy* default to 1s, which is enough on a dev machine but not on a
// 4-core CI runner running the whole suite in parallel forks — a multipart POST
// through MSW plus an IndexedDB write can exceed it. Still well inside the 15s
// testTimeout, so a genuinely broken assertion fails, it just takes longer.
configure({ asyncUtilTimeout: 5000 });

// Mock the websocket module so stores don't try to open real connections
vi.mock('../src/api/websocket', () => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  getSocketId: vi.fn(() => null),
  setRefetchCallback: vi.fn(),
  setPreReconnectHook: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
}));

// MSW lifecycle. A cross-origin request nobody mocked is the dangerous kind: 'warn'
// lets it through, so the runner really talks to frankfurter or a tile server and settles
// a promise after the test environment is gone (see handlers/external.ts). Those fail now.
// An unhandled same-origin call stays a warning: that is a missing handler, not egress.
beforeAll(() => server.listen({
  onUnhandledRequest: (request, print) => {
    if (new URL(request.url).origin === location.origin) print.warning();
    else print.error();
  },
}));
afterEach(() => {
  server.resetHandlers();
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});
afterAll(() => server.close());

// ── jsdom stubs ────────────────────────────────────────────────────────────────

// Force en-US locale for toLocaleDateString so tests are deterministic on
// non-US dev machines (Windows-de-DE returns "Sonntag" instead of "Sunday").
// Only affects calls without an explicit locale — callers that pass a locale
// keep their behavior.
const _origToLocaleDateString = Date.prototype.toLocaleDateString
Date.prototype.toLocaleDateString = function (locales?: Intl.LocalesArgument, options?: Intl.DateTimeFormatOptions) {
  return _origToLocaleDateString.call(this, locales ?? 'en-US', options)
}

// window.matchMedia — used by dark mode / responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// IntersectionObserver — used by lazy loading
// Must use a class or regular function (not arrow function) so 'new IntersectionObserver()' works
class _MockIntersectionObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  root = null
  rootMargin = ''
  thresholds: ReadonlyArray<number> = []
  takeRecords = vi.fn(() => [])
  constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}
}
globalThis.IntersectionObserver = _MockIntersectionObserver as unknown as typeof IntersectionObserver;

// ResizeObserver — used by resizable panels
class _MockResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  constructor(_callback: ResizeObserverCallback) {}
}
globalThis.ResizeObserver = _MockResizeObserver as unknown as typeof ResizeObserver;

// URL.createObjectURL / revokeObjectURL — Node 22 URL.createObjectURL requires
// a native node:buffer Blob; passing a jsdom Blob throws ERR_INVALID_ARG_TYPE.
// Tests that need blob URLs should mock fetch to return node:buffer Blobs so
// the real URL.createObjectURL works. For tests that only need the method to
// exist without returning a real URL, stub it here as a vi.fn fallback.
if (typeof URL.createObjectURL === 'undefined') {
  Object.defineProperty(URL, 'createObjectURL', { writable: true, configurable: true, value: vi.fn(() => 'blob:mock') });
  Object.defineProperty(URL, 'revokeObjectURL', { writable: true, configurable: true, value: vi.fn() });
}

// Element.prototype.scrollIntoView — jsdom doesn't implement it
Element.prototype.scrollIntoView = vi.fn();

// maplibre-gl-leaflet — the vector basemap every Leaflet map draws since the move
// off CARTO. jsdom has no WebGL, so the real layer can never work here; more to
// the point, several map tests hand react-leaflet a partial `useMap()` stub, and
// the real layer's addTo() reaches for map.addLayer and rejects into the void.
// Stubbed globally for the same reason ResizeObserver is: the capability does not
// exist in this environment. Tests that assert on the layer register their own
// mock, which takes precedence over this one.
vi.mock('@maplibre/maplibre-gl-leaflet', () => ({
  maplibreGL: vi.fn(() => {
    const gl = {
      setStyle: vi.fn(),
      on: vi.fn(),
      isStyleLoaded: vi.fn(() => false),
      getStyle: vi.fn(() => ({ layers: [] })),
      setLayoutProperty: vi.fn(),
    };
    const layer: Record<string, unknown> = { remove: vi.fn(), getMaplibreMap: vi.fn(() => gl) };
    layer.addTo = vi.fn(() => layer);
    return layer;
  }),
}));
