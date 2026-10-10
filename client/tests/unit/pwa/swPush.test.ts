// FE-SW-PUSH-001 to FE-SW-PUSH-016: the Web Push handlers in public/sw-push.js.
//
// The file is a classic script that Workbox imports into the generated service
// worker, so it sits outside src/, ESLint and coverage. This spec is its only
// guard: it evaluates the real file against a fake worker global and drives
// the three events the way a browser would.
//
// What matters most:
//  - every push shows a notification inside waitUntil, whatever arrives, since
//    Chrome demands one per push and WebKit revokes a subscription that stays
//    silent;
//  - a click only ever opens a path on this origin;
//  - a renewed subscription reaches the server, and the old one is forgotten
//    only once the new one is stored.
// Plus the drift guard: vite.config.js must import the file, and it must exist,
// or importScripts gets a 404 instead of a script and the new worker never
// installs.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ORIGIN = 'https://trek.example';
const SOURCE_PATH = resolve(process.cwd(), 'public/sw-push.js');
const SOURCE = readFileSync(SOURCE_PATH, 'utf8');

type Listener = (event: Record<string, unknown>) => void;

interface FakeWindow {
  url: string;
  focused: boolean;
  focus: ReturnType<typeof vi.fn>;
  navigate: ReturnType<typeof vi.fn>;
}

function fakeWindow(over: Partial<FakeWindow> = {}): FakeWindow {
  const win: FakeWindow = {
    url: `${ORIGIN}/dashboard`,
    focused: false,
    focus: vi.fn(async () => win),
    navigate: vi.fn(async () => win),
    ...over,
  };
  return win;
}

function boot(windows: FakeWindow[] = []) {
  const listeners: Record<string, Listener> = {};
  const registration = {
    showNotification: vi.fn(async (_title: string, _options: NotificationOptions) => undefined),
    pushManager: { subscribe: vi.fn() },
  };
  const clients = {
    matchAll: vi.fn(async () => windows),
    openWindow: vi.fn(async (_url: string) => null),
  };
  const self = {
    addEventListener: (type: string, fn: Listener) => {
      listeners[type] = fn;
    },
    registration,
    clients,
    location: { origin: ORIGIN },
  };
  const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response(null, { status: 200 }));
  new Function('self', 'fetch', SOURCE)(self, fetchMock);
  return { listeners, registration, clients, fetch: fetchMock };
}

/** Dispatches one event and hands back what it passed to waitUntil. */
function fire(listener: Listener, event: Record<string, unknown>): Promise<unknown> {
  let waited: Promise<unknown> | undefined;
  listener({ ...event, waitUntil: (p: Promise<unknown>) => { waited = p; } });
  expect(waited).toBeInstanceOf(Promise);
  return waited as Promise<unknown>;
}

function pushData(value: unknown) {
  return {
    json: () => (typeof value === 'string' ? JSON.parse(value) : value),
    text: () => (typeof value === 'string' ? value : JSON.stringify(value)),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('sw-push.js: push', () => {
  it('FE-SW-PUSH-001: shows the payload as sent, with the icon and the path to open', async () => {
    const sw = boot();
    await fire(sw.listeners.push, {
      data: pushData({ title: 'Trip invite', body: 'Anna invited you to Rome', url: '/trips/5' }),
    });
    expect(sw.registration.showNotification).toHaveBeenCalledWith('Trip invite', {
      body: 'Anna invited you to Rome',
      icon: '/icons/icon-192x192.png',
      data: { url: '/trips/5' },
    });
  });

  it('FE-SW-PUSH-001b: a tagged push replaces the last one with that tag and still alerts', async () => {
    const sw = boot();
    const message = { title: 'New message in "Rome"', body: 'anna: see you there', url: '/trips/5' };
    await fire(sw.listeners.push, { data: pushData({ ...message, tag: 'collab_message:/trips/5' }) });
    expect(sw.registration.showNotification).toHaveBeenCalledWith(message.title, {
      body: message.body,
      icon: '/icons/icon-192x192.png',
      tag: 'collab_message:/trips/5',
      renotify: true,
      data: { url: '/trips/5' },
    });
    // Without a tag there is nothing to replace, and renotify would be refused.
    await fire(sw.listeners.push, { data: pushData({ ...message, tag: '' }) });
    expect(sw.registration.showNotification.mock.calls[1][1]).not.toHaveProperty('tag');
    expect(sw.registration.showNotification.mock.calls[1][1]).not.toHaveProperty('renotify');
  });

  it('FE-SW-PUSH-001c: renotify follows the tag alone, never the payload', async () => {
    const sw = boot();
    // showNotification throws on renotify without a tag, so a payload asking for it must not get it.
    await fire(sw.listeners.push, { data: pushData({ title: 'Booking', body: 'changed', renotify: true }) });
    expect(sw.registration.showNotification.mock.calls[0][1]).not.toHaveProperty('renotify');
    // Any tag at all brings it, not only the chat one.
    await fire(sw.listeners.push, { data: pushData({ title: 'Booking', body: 'changed', tag: 'any' }) });
    expect(sw.registration.showNotification.mock.calls[1][1]).toMatchObject({ tag: 'any', renotify: true });
  });

  it('FE-SW-PUSH-002: a payload that is not JSON still shows, with its text as the body', async () => {
    const sw = boot();
    await fire(sw.listeners.push, { data: pushData('plain words, no JSON') });
    expect(sw.registration.showNotification).toHaveBeenCalledWith('TREK', {
      body: 'plain words, no JSON',
      icon: '/icons/icon-192x192.png',
      data: { url: '/' },
    });
  });

  it('FE-SW-PUSH-003: a push without data, or with the wrong types, still shows something', async () => {
    const sw = boot();
    await fire(sw.listeners.push, { data: null });
    await fire(sw.listeners.push, { data: pushData({ title: 42, body: ['x'], tag: 7 }) });
    await fire(sw.listeners.push, { data: pushData('"just a string"') });
    for (const call of sw.registration.showNotification.mock.calls) {
      expect(call[0]).toBe('TREK');
      expect(call[1]).toEqual({ body: '', icon: '/icons/icon-192x192.png', data: { url: '/' } });
    }
    expect(sw.registration.showNotification).toHaveBeenCalledTimes(3);
  });

  it('FE-SW-PUSH-004: a url pointing anywhere else is replaced by the start page', async () => {
    const sw = boot();
    for (const url of ['https://evil.example/phish', '//evil.example/x', 'javascript:alert(1)']) {
      await fire(sw.listeners.push, { data: pushData({ title: 'x', body: 'y', url }) });
    }
    for (const call of sw.registration.showNotification.mock.calls) {
      expect(call[1].data.url).toBe('/');
    }
  });

  it('FE-SW-PUSH-005: a same-origin absolute url is reduced to its path, query and hash', async () => {
    const sw = boot();
    await fire(sw.listeners.push, { data: pushData({ title: 'x', body: 'y', url: `${ORIGIN}/trips/5?tab=plan#day-2` }) });
    expect(sw.registration.showNotification.mock.calls[0][1]).toMatchObject({ data: { url: '/trips/5?tab=plan#day-2' } });
  });
});

describe('sw-push.js: notificationclick', () => {
  function click(sw: ReturnType<typeof boot>, url: unknown) {
    const notification = { close: vi.fn(), data: { url } };
    return { notification, done: fire(sw.listeners.notificationclick, { notification }) };
  }

  it('FE-SW-PUSH-006: closes the notification, focuses a TREK window and takes it there', async () => {
    const win = fakeWindow();
    const sw = boot([win]);
    const { notification, done } = click(sw, '/trips/5');
    await done;
    expect(notification.close).toHaveBeenCalled();
    expect(sw.clients.matchAll).toHaveBeenCalledWith({ type: 'window', includeUncontrolled: true });
    expect(win.focus).toHaveBeenCalled();
    expect(win.navigate).toHaveBeenCalledWith(`${ORIGIN}/trips/5`);
    expect(sw.clients.openWindow).not.toHaveBeenCalled();
  });

  it('FE-SW-PUSH-007: prefers the window that already has the focus', async () => {
    const background = fakeWindow();
    const focused = fakeWindow({ focused: true });
    const sw = boot([background, focused]);
    await click(sw, '/notifications').done;
    expect(focused.navigate).toHaveBeenCalledWith(`${ORIGIN}/notifications`);
    expect(background.focus).not.toHaveBeenCalled();
  });

  it('FE-SW-PUSH-008: opens a window when none is left', async () => {
    const sw = boot([]);
    await click(sw, '/trips/5').done;
    expect(sw.clients.openWindow).toHaveBeenCalledWith(`${ORIGIN}/trips/5`);
  });

  it('FE-SW-PUSH-009: a window the worker may not navigate gets a new one instead', async () => {
    const uncontrolled = fakeWindow();
    uncontrolled.navigate.mockRejectedValueOnce(new TypeError('not controlled'));
    const sw = boot([uncontrolled]);
    await click(sw, '/trips/5').done;
    expect(sw.clients.openWindow).toHaveBeenCalledWith(`${ORIGIN}/trips/5`);
  });

  it('FE-SW-PUSH-010: a url from elsewhere, or none at all, opens the start page', async () => {
    const sw = boot([]);
    await click(sw, 'https://evil.example/').done;
    const notification = { close: vi.fn(), data: null };
    await fire(sw.listeners.notificationclick, { notification });
    expect(sw.clients.openWindow.mock.calls).toEqual([[`${ORIGIN}/`], [`${ORIGIN}/`]]);
  });
});

describe('sw-push.js: pushsubscriptionchange', () => {
  const OLD_KEY = new Uint8Array([4, 1, 2, 3]).buffer;

  function renewed(endpoint: string) {
    return { endpoint, toJSON: () => ({ endpoint, keys: { p256dh: 'p', auth: 'a' } }) };
  }

  it('FE-SW-PUSH-011: subscribes again with the old key, stores the new one, then forgets the old', async () => {
    const sw = boot();
    sw.registration.pushManager.subscribe.mockResolvedValue(renewed('https://push.example/new'));
    await fire(sw.listeners.pushsubscriptionchange, {
      oldSubscription: { endpoint: 'https://push.example/old', options: { applicationServerKey: OLD_KEY } },
      newSubscription: null,
    });

    expect(sw.registration.pushManager.subscribe).toHaveBeenCalledWith({ userVisibleOnly: true, applicationServerKey: OLD_KEY });
    expect(sw.fetch).toHaveBeenCalledTimes(2);
    const [postUrl, post] = sw.fetch.mock.calls[0];
    expect(postUrl).toBe('/api/notifications/push/subscriptions');
    expect(post).toMatchObject({ method: 'POST', credentials: 'same-origin' });
    expect(JSON.parse(String(post?.body))).toEqual({
      subscription: { endpoint: 'https://push.example/new', keys: { p256dh: 'p', auth: 'a' } },
    });
    const [, del] = sw.fetch.mock.calls[1];
    expect(del).toMatchObject({ method: 'DELETE', credentials: 'same-origin' });
    expect(JSON.parse(String(del?.body))).toEqual({ endpoint: 'https://push.example/old' });
  });

  it('FE-SW-PUSH-012: uses a subscription the browser already made', async () => {
    const sw = boot();
    await fire(sw.listeners.pushsubscriptionchange, {
      oldSubscription: null,
      newSubscription: renewed('https://push.example/fresh'),
    });
    expect(sw.registration.pushManager.subscribe).not.toHaveBeenCalled();
    expect(sw.fetch).toHaveBeenCalledTimes(1);
  });

  it('FE-SW-PUSH-013: keeps the row when the endpoint did not change', async () => {
    const sw = boot();
    await fire(sw.listeners.pushsubscriptionchange, {
      oldSubscription: { endpoint: 'https://push.example/same', options: { applicationServerKey: OLD_KEY } },
      newSubscription: renewed('https://push.example/same'),
    });
    expect(sw.fetch).toHaveBeenCalledTimes(1);
  });

  it('FE-SW-PUSH-014: forgets nothing when the server did not take the new subscription', async () => {
    const sw = boot();
    sw.fetch.mockResolvedValueOnce(new Response(null, { status: 401 }));
    await fire(sw.listeners.pushsubscriptionchange, {
      oldSubscription: { endpoint: 'https://push.example/old', options: { applicationServerKey: OLD_KEY } },
      newSubscription: renewed('https://push.example/new'),
    });
    expect(sw.fetch).toHaveBeenCalledTimes(1);
  });

  it('FE-SW-PUSH-015: gives up quietly, never with a rejected waitUntil', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const sw = boot();
    sw.registration.pushManager.subscribe.mockRejectedValueOnce(new Error('push service down'));
    await expect(
      fire(sw.listeners.pushsubscriptionchange, {
        oldSubscription: { endpoint: 'https://push.example/old', options: { applicationServerKey: OLD_KEY } },
        newSubscription: null,
      }),
    ).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();

    await fire(sw.listeners.pushsubscriptionchange, { oldSubscription: null, newSubscription: null });
    expect(sw.fetch).not.toHaveBeenCalled();
  });
});

describe('sw-push.js is wired into the service worker (drift guard)', () => {
  it('FE-SW-PUSH-016: vite.config.js imports it and public/ ships it', () => {
    const config = readFileSync(resolve(process.cwd(), 'vite.config.js'), 'utf8');
    expect(config).toMatch(/importScripts:\s*\[\s*'sw-push\.js'\s*\]/);
    expect(existsSync(SOURCE_PATH)).toBe(true);
  });
});
