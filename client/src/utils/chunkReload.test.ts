import { isChunkLoadError, reloadOnceForChunk, clearChunkReloadMarker } from './chunkReload';

beforeEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe('isChunkLoadError', () => {
  // One message per engine — the wording differs and none of them carry a code.
  it.each([
    ['Vite', 'Failed to fetch dynamically imported module: /assets/Page-a1b2.js'],
    ['Firefox', 'error loading dynamically imported module'],
    ['Safari', 'Importing a module script failed.'],
    ['Vite CSS', 'Unable to preload CSS for /assets/Page-a1b2.css'],
  ])('FE-UTIL-CHUNK-001: recognises the %s wording', (_engine, message) => {
    expect(isChunkLoadError(new Error(message))).toBe(true);
  });

  it('FE-UTIL-CHUNK-002: leaves ordinary errors alone', () => {
    expect(isChunkLoadError(new Error('Cannot read properties of undefined'))).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
    expect(isChunkLoadError(undefined)).toBe(false);
  });

  it('FE-UTIL-CHUNK-003: also reads a plain string, since a rejection need not be an Error', () => {
    expect(isChunkLoadError('Failed to fetch dynamically imported module')).toBe(true);
  });
});

describe('reloadOnceForChunk', () => {
  function stubReload() {
    const reload = vi.fn();
    Object.defineProperty(window, 'location', { value: { ...window.location, reload }, writable: true });
    return reload;
  }

  it('FE-UTIL-CHUNK-004: reloads the first time and refuses afterwards', () => {
    const reload = stubReload();
    expect(reloadOnceForChunk()).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);

    // A chunk that is genuinely missing — bad deploy, stale proxy — would otherwise
    // put the tab in a reload loop.
    expect(reloadOnceForChunk()).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('FE-UTIL-CHUNK-005: clearing the marker lets the next deploy heal too', () => {
    const reload = stubReload();
    reloadOnceForChunk();
    clearChunkReloadMarker();
    expect(reloadOnceForChunk()).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it('FE-UTIL-CHUNK-006: does not reload blind when storage is unavailable', () => {
    const reload = stubReload();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    // Without the marker there is no loop protection, so showing the fallback with
    // its manual reload button is the safer answer.
    expect(reloadOnceForChunk()).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it('FE-UTIL-CHUNK-007: clearing survives unavailable storage', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    expect(() => clearChunkReloadMarker()).not.toThrow();
  });
});
