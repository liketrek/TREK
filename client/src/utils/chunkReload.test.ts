import { isChunkLoadError, reloadOnceForChunk, clearChunkReloadMarker, reloadFresh, FRESH_LOAD_PARAM } from './chunkReload';

const net = vi.hoisted(() => ({
  probeNow: vi.fn(async () => 'online' as 'online' | 'offline' | 'proxy-wall'),
  isEffectivelyOffline: vi.fn(() => false),
}));
vi.mock('../sync/connectivity', () => ({ probeNow: net.probeNow }));
vi.mock('../sync/networkMode', () => ({ isEffectivelyOffline: net.isEffectivelyOffline }));

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

/**
 * A recovery reload is a location.replace onto a fresh URL (reloadFresh), so the
 * stub records the replace. `plain` is the location.reload() it must not use.
 */
function stubLocation(href = 'http://localhost/trips/4?tab=plan#day-2') {
  const reload = vi.fn();
  const plain = vi.fn();
  Object.defineProperty(window, 'location', {
    value: { ...window.location, href, replace: reload, reload: plain },
    writable: true,
  });
  return { reload, plain };
}

describe('reloadFresh', () => {
  it('FE-UTIL-CHUNK-015: loads the same page under a URL no cache has seen (#2524)', () => {
    const { reload, plain } = stubLocation();
    vi.spyOn(Date, 'now').mockReturnValue(1790358416100);
    reloadFresh();
    expect(plain).not.toHaveBeenCalled();
    expect(reload).toHaveBeenCalledTimes(1);
    const target = new URL(reload.mock.calls[0][0] as string);
    // Path, query and hash stay, so the app comes back where it was.
    expect(target.pathname).toBe('/trips/4');
    expect(target.searchParams.get('tab')).toBe('plan');
    expect(target.hash).toBe('#day-2');
    expect(target.searchParams.get(FRESH_LOAD_PARAM)).toBe((1790358416100).toString(36));
  });

  it('FE-UTIL-CHUNK-016: two reloads never share a URL', () => {
    const { reload } = stubLocation('http://localhost/dashboard');
    const now = vi.spyOn(Date, 'now').mockReturnValue(1790358416100);
    reloadFresh();
    now.mockReturnValue(1790358416101);
    reloadFresh();
    expect(reload.mock.calls[0][0]).not.toBe(reload.mock.calls[1][0]);
  });

  it('FE-UTIL-CHUNK-017: falls back to a plain reload when the URL cannot be built', () => {
    const { reload, plain } = stubLocation('not a url');
    reloadFresh();
    expect(reload).not.toHaveBeenCalled();
    expect(plain).toHaveBeenCalledTimes(1);
  });
});

describe('reloadOnceForChunk', () => {
  const stubReload = () => stubLocation().reload;

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

describe('reloadOntoCurrentBuild', () => {
  class FakeWorker {}

  // The worker that served the page is read when serviceWorkerShell loads, so the
  // fake container goes in first and the modules are loaded afresh.
  async function setUp({ servedBy, controller }: { servedBy: FakeWorker | null; controller: FakeWorker | null }) {
    const registration = { unregister: vi.fn(async () => true) };
    const container = { controller: servedBy, getRegistration: vi.fn(async () => registration) };
    Object.defineProperty(navigator, 'serviceWorker', { value: container, configurable: true });
    const deleted: string[] = [];
    Object.defineProperty(globalThis, 'caches', {
      value: {
        keys: vi.fn(async () => ['workbox-precache-v2-http://localhost/', 'map-tiles']),
        delete: vi.fn(async (name: string) => { deleted.push(name); return true; }),
      },
      configurable: true,
    });
    const { reload } = stubLocation();
    vi.resetModules();
    const mod = await import('./chunkReload');
    container.controller = controller;
    return { mod, reload, registration, deleted, container };
  }

  beforeEach(() => {
    net.probeNow.mockReset().mockResolvedValue('online');
    net.isEffectivelyOffline.mockReset().mockReturnValue(false);
  });

  afterEach(() => {
    Reflect.deleteProperty(navigator, 'serviceWorker');
    Reflect.deleteProperty(globalThis, 'caches');
  });

  it('FE-UTIL-CHUNK-008: just reloads once a newer worker has taken over since the page loaded', async () => {
    const { mod, reload, registration, deleted } = await setUp({ servedBy: new FakeWorker(), controller: new FakeWorker() });
    mod.reloadOntoCurrentBuild();
    // That worker answers the reload with the new shell; nothing to throw away.
    expect(reload).toHaveBeenCalledTimes(1);
    expect(net.probeNow).not.toHaveBeenCalled();
    expect(registration.unregister).not.toHaveBeenCalled();
    expect(deleted).toEqual([]);
  });

  it('FE-UTIL-CHUNK-009: just reloads when the page came from the network', async () => {
    const { mod, reload, registration } = await setUp({ servedBy: null, controller: null });
    mod.reloadOntoCurrentBuild();
    expect(reload).toHaveBeenCalledTimes(1);
    expect(registration.unregister).not.toHaveBeenCalled();
  });

  it('FE-UTIL-CHUNK-010: drops the precache and the worker first when that worker would answer the reload again (#2524)', async () => {
    const worker = new FakeWorker();
    const { mod, reload, registration, deleted } = await setUp({ servedBy: worker, controller: worker });
    mod.reloadOntoCurrentBuild();
    // Not before the shell is gone: the reload would come back to the same error.
    expect(reload).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(deleted).toEqual(['workbox-precache-v2-http://localhost/']);
    expect(registration.unregister).toHaveBeenCalledTimes(1);
  });

  it.each(['offline', 'proxy-wall'] as const)(
    'FE-UTIL-CHUNK-011: keeps the shell when the server does not answer (%s)',
    async (state) => {
      net.probeNow.mockResolvedValue(state);
      const worker = new FakeWorker();
      const { mod, reload, registration, deleted } = await setUp({ servedBy: worker, controller: worker });
      mod.reloadOntoCurrentBuild();
      await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
      // Offline, the precache is the only way the app starts at all.
      expect(deleted).toEqual([]);
      expect(registration.unregister).not.toHaveBeenCalled();
    },
  );

  it('FE-UTIL-CHUNK-012: keeps the shell in offline mode without even asking the server', async () => {
    net.isEffectivelyOffline.mockReturnValue(true);
    const worker = new FakeWorker();
    const { mod, reload, registration } = await setUp({ servedBy: worker, controller: worker });
    mod.reloadOntoCurrentBuild();
    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(net.probeNow).not.toHaveBeenCalled();
    expect(registration.unregister).not.toHaveBeenCalled();
  });

  it('FE-UTIL-CHUNK-013: still reloads when dropping the shell fails', async () => {
    const worker = new FakeWorker();
    const { mod, reload, registration } = await setUp({ servedBy: worker, controller: worker });
    registration.unregister.mockRejectedValue(new Error('InvalidStateError'));
    mod.reloadOntoCurrentBuild();
    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
  });

  it('FE-UTIL-CHUNK-018: drops nothing when a newer worker takes over while the server is asked', async () => {
    const worker = new FakeWorker();
    const { mod, reload, registration, deleted, container } = await setUp({ servedBy: worker, controller: worker });
    net.probeNow.mockImplementation(async () => {
      // The browser's own sw.js check finished the handover in the meantime. Its
      // precache is the new build's, and dropping it would cost a full download.
      container.controller = new FakeWorker();
      return 'online';
    });
    mod.reloadOntoCurrentBuild();
    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(deleted).toEqual([]);
    expect(registration.unregister).not.toHaveBeenCalled();
  });

  it('FE-UTIL-CHUNK-014: the automatic reload after a dead chunk takes the same way, once', async () => {
    const worker = new FakeWorker();
    const { mod, reload, registration } = await setUp({ servedBy: worker, controller: worker });
    expect(mod.reloadOnceForChunk()).toBe(true);
    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(registration.unregister).toHaveBeenCalledTimes(1);
    expect(mod.reloadOnceForChunk()).toBe(false);
  });
});
