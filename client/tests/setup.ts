import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from './helpers/msw/server';

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

// MSW lifecycle
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
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
