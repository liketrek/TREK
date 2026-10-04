/**
 * public/shell-guard.js (#2524): the classic boot script that recovers a shell
 * whose entry module cannot load. It is not a module, so it is run here from its
 * source, the way the browser runs it from index.html.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SOURCE = readFileSync(resolve(process.cwd(), 'public/shell-guard.js'), 'utf8');
const ENTRY = '/assets/index-BZcJ9-lk.js';
const MARKER = 'trek:shell-reload';

type Listener = [string, EventListenerOrEventListenerObject, boolean | AddEventListenerOptions | undefined];
let listeners: Listener[] = [];
let scripts: HTMLElement[] = [];

/** Runs the guard and keeps its listeners, so every test starts with exactly one set. */
function runGuard(): void {
  const add = vi.spyOn(document, 'addEventListener');
  new Function(SOURCE)();
  listeners = add.mock.calls.map(call => call as unknown as Listener);
  add.mockRestore();
}

function moduleScript(src: string, type = 'module'): HTMLScriptElement {
  const el = document.createElement('script');
  el.type = type;
  el.src = src;
  document.head.appendChild(el);
  scripts.push(el);
  return el;
}

function fail(el: Element): void {
  el.dispatchEvent(new Event('error'));
}

/** Lets the guard's promise chain run to its end. */
async function settle(): Promise<void> {
  for (let i = 0; i < 10; i++) await new Promise(r => setTimeout(r, 0));
}

function healthAnswer(ok: boolean, type: string) {
  return { ok, headers: { get: (name: string) => (name.toLowerCase() === 'content-type' ? type : null) } };
}

interface Env {
  replace: ReturnType<typeof vi.fn>;
  fetch: ReturnType<typeof vi.fn>;
  unregister: ReturnType<typeof vi.fn>;
  deleted: string[];
}

/** A page a service worker served, unless `controlled` is false. */
function install(href = 'http://localhost/trips/4?tab=plan#day-2', controlled = true): Env {
  const replace = vi.fn();
  Object.defineProperty(window, 'location', { value: { ...window.location, href, replace }, writable: true, configurable: true });
  const fetch = vi.fn(async () => healthAnswer(true, 'application/json; charset=utf-8'));
  vi.stubGlobal('fetch', fetch);
  const unregister = vi.fn(async () => true);
  Object.defineProperty(navigator, 'serviceWorker', {
    value: { controller: controlled ? { scriptURL: 'http://localhost/sw.js' } : null, getRegistration: vi.fn(async () => ({ unregister })) },
    configurable: true,
  });
  const deleted: string[] = [];
  Object.defineProperty(globalThis, 'caches', {
    value: {
      keys: vi.fn(async () => ['workbox-precache-v2-http://localhost/', 'map-tiles', 'gl-map-offline', 'user-uploads']),
      delete: vi.fn(async (name: string) => { deleted.push(name); return true; }),
    },
    configurable: true,
  });
  return { replace, fetch, unregister, deleted };
}

const originalLocation = Object.getOwnPropertyDescriptor(window, 'location');

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  for (const [type, fn, options] of listeners) document.removeEventListener(type, fn, options);
  listeners = [];
  for (const el of scripts) el.remove();
  scripts = [];
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, 'serviceWorker');
  Reflect.deleteProperty(globalThis, 'caches');
  if (originalLocation) Object.defineProperty(window, 'location', originalLocation);
});

describe('shell-guard.js', () => {
  it('FE-SHELLGUARD-001: strips the fresh-reload parameter and keeps the rest of the URL', () => {
    window.history.replaceState({ usr: 1 }, '', '/trips/4?tab=plan&trek-reload=mfz3x1&x=2#day-2');
    runGuard();
    expect(window.location.pathname + window.location.search + window.location.hash).toBe('/trips/4?tab=plan&x=2#day-2');
    expect(window.history.state).toEqual({ usr: 1 });
    window.history.replaceState(null, '', '/');
  });

  it('FE-SHELLGUARD-002: leaves a URL without the parameter alone', () => {
    window.history.replaceState(null, '', '/dashboard?tab=trips');
    const replaceState = vi.spyOn(window.history, 'replaceState');
    runGuard();
    expect(replaceState).not.toHaveBeenCalled();
    window.history.replaceState(null, '', '/');
  });

  it('FE-SHELLGUARD-003: an entry that cannot load drops the app shell and loads the page afresh', async () => {
    const env = install();
    vi.spyOn(Date, 'now').mockReturnValue(1790358416100);
    runGuard();
    fail(moduleScript(ENTRY));
    await vi.waitFor(() => expect(env.replace).toHaveBeenCalledTimes(1));

    expect(env.fetch).toHaveBeenCalledWith('/api/health', expect.objectContaining({ cache: 'no-store', redirect: 'manual' }));
    // Only the precache: offline map regions and cached uploads were downloaded on purpose.
    expect(env.deleted).toEqual(['workbox-precache-v2-http://localhost/']);
    expect(env.unregister).toHaveBeenCalledTimes(1);
    const target = new URL(env.replace.mock.calls[0][0] as string);
    expect(target.pathname + target.hash).toBe('/trips/4#day-2');
    expect(target.searchParams.get('tab')).toBe('plan');
    expect(target.searchParams.get('trek-reload')).toBe((1790358416100).toString(36));
  });

  it.each([
    ['offline', () => Promise.reject(new TypeError('Failed to fetch'))],
    ['a proxy login page', async () => healthAnswer(true, 'text/html')],
    ['a server error', async () => healthAnswer(false, 'application/json')],
  ])('FE-SHELLGUARD-004: keeps the shell when the server does not answer (%s)', async (_case, answer) => {
    const env = install();
    env.fetch.mockImplementation(answer);
    runGuard();
    fail(moduleScript(ENTRY));
    await settle();
    // Offline, the precache is the only way the app starts at all.
    expect(env.fetch).toHaveBeenCalledTimes(1);
    expect(env.deleted).toEqual([]);
    expect(env.unregister).not.toHaveBeenCalled();
    expect(env.replace).not.toHaveBeenCalled();
    // Nothing was tried, so a later load may still recover.
    expect(sessionStorage.getItem(MARKER)).toBeNull();
  });

  it('FE-SHELLGUARD-005: recovers once per session, so a broken build cannot loop', async () => {
    const env = install();
    runGuard();
    fail(moduleScript(ENTRY));
    await vi.waitFor(() => expect(env.replace).toHaveBeenCalledTimes(1));

    // The reloaded page fails the same way: the marker is still set.
    fail(moduleScript(ENTRY));
    await settle();
    expect(env.fetch).toHaveBeenCalledTimes(1);
    expect(env.replace).toHaveBeenCalledTimes(1);
  });

  it('FE-SHELLGUARD-006: an entry that loaded clears the marker, so a later update may recover too', async () => {
    const env = install();
    sessionStorage.setItem(MARKER, '1790358416100');
    runGuard();
    moduleScript(ENTRY).dispatchEvent(new Event('load'));
    expect(sessionStorage.getItem(MARKER)).toBeNull();

    fail(moduleScript(ENTRY));
    await vi.waitFor(() => expect(env.replace).toHaveBeenCalledTimes(1));
  });

  it('FE-SHELLGUARD-007: does nothing without session storage, where it could not stop a loop', async () => {
    const env = install();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    runGuard();
    fail(moduleScript(ENTRY));
    await settle();
    expect(env.fetch).not.toHaveBeenCalled();
    expect(env.replace).not.toHaveBeenCalled();
  });

  it('FE-SHELLGUARD-008: still reloads when dropping the shell fails', async () => {
    const env = install();
    env.unregister.mockRejectedValue(new Error('InvalidStateError'));
    runGuard();
    fail(moduleScript(ENTRY));
    await vi.waitFor(() => expect(env.replace).toHaveBeenCalledTimes(1));
  });

  it('FE-SHELLGUARD-011: a page that came from the network is reloaded afresh and its worker kept', async () => {
    // Nothing the worker keeps answered this load, so throwing it away would only
    // cost the offline shell.
    const env = install('http://localhost/dashboard', false);
    runGuard();
    fail(moduleScript(ENTRY));
    await vi.waitFor(() => expect(env.replace).toHaveBeenCalledTimes(1));
    expect(env.deleted).toEqual([]);
    expect(env.unregister).not.toHaveBeenCalled();
    expect(new URL(env.replace.mock.calls[0][0] as string).searchParams.has('trek-reload')).toBe(true);
  });

  it('FE-SHELLGUARD-009: works where there is no service worker and no Cache Storage', async () => {
    const env = install();
    Reflect.deleteProperty(navigator, 'serviceWorker');
    Reflect.deleteProperty(globalThis, 'caches');
    runGuard();
    fail(moduleScript(ENTRY));
    // A proxy that kept a stale index.html is bypassed by the fresh URL alone.
    await vi.waitFor(() => expect(env.replace).toHaveBeenCalledTimes(1));
  });

  it('FE-SHELLGUARD-010: ignores every other failure', async () => {
    const env = install();
    runGuard();
    // Vite's dev entry, a classic script, a lazy chunk's stylesheet, an image.
    fail(moduleScript('/src/main.tsx'));
    fail(moduleScript('/registerSW.js', 'text/javascript'));
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/assets/DashboardPage-v4ODOTOr.css';
    document.head.appendChild(link);
    scripts.push(link);
    fail(link);
    const img = document.createElement('img');
    img.src = '/uploads/covers/missing.jpg';
    document.body.appendChild(img);
    scripts.push(img);
    fail(img);
    // A runtime error of the app is an ErrorEvent on window, not a failed script.
    window.dispatchEvent(new Event('error'));
    await settle();
    expect(env.fetch).not.toHaveBeenCalled();
    expect(env.replace).not.toHaveBeenCalled();
  });
});
