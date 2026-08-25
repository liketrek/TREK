import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { describe, expect, it, vi } from 'vitest';

function loadWorker(activeUserId: number | undefined) {
  const listeners: Record<string, (event: any) => void> = {};
  const showNotification = vi.fn().mockResolvedValue(undefined);
  const setAppBadge = vi.fn().mockResolvedValue(undefined);
  const indexedDB = {
    open: vi.fn(() => {
      const request: any = {};
      queueMicrotask(() => {
        request.result = {
          transaction: () => ({
            objectStore: () => ({
              get: () => {
                const getRequest: any = {};
                queueMicrotask(() => {
                  getRequest.result = activeUserId;
                  getRequest.onsuccess?.();
                });
                return getRequest;
              },
            }),
            close: () => {},
          }),
          close: () => {},
        };
        request.onsuccess?.();
      });
      return request;
    }),
  };
  const self: any = {
    addEventListener: (type: string, handler: (event: any) => void) => {
      listeners[type] = handler;
    },
    registration: { showNotification },
    navigator: { setAppBadge },
    clients: { matchAll: vi.fn().mockResolvedValue([]), openWindow: vi.fn() },
    location: { origin: 'https://trek.example.test' },
  };
  const source = fs.readFileSync(path.resolve(process.cwd(), 'public/push-sw.js'), 'utf8');
  vm.runInNewContext(source, { self, indexedDB, URL, Promise, console });
  return { listeners, showNotification, setAppBadge };
}

describe('imported Web Push service worker', () => {
  it('shows full content only for the locally active TREK account and updates the badge', async () => {
    const worker = loadWorker(42);
    let completion!: Promise<unknown>;
    worker.listeners.push!({
      data: {
        json: () => ({
          v: 1,
          recipientUserId: 42,
          title: 'Tokyo',
          body: 'Booking changed',
          path: '/trips/7',
          unreadCount: 3,
        }),
      },
      waitUntil: (promise: Promise<unknown>) => {
        completion = promise;
      },
    });
    await completion;
    expect(worker.showNotification).toHaveBeenCalledWith('Tokyo', expect.objectContaining({ body: 'Booking changed' }));
    expect(worker.setAppBadge).toHaveBeenCalledWith(3);

    const loggedOut = loadWorker(undefined);
    loggedOut.listeners.push!({
      data: {
        json: () => ({
          v: 1,
          recipientUserId: 42,
          title: 'Private title',
          body: 'Private body',
          path: '/trips/7',
          unreadCount: 3,
        }),
      },
      waitUntil: (promise: Promise<unknown>) => {
        completion = promise;
      },
    });
    await completion;
    expect(loggedOut.showNotification).toHaveBeenCalledWith(
      'TREK',
      expect.objectContaining({ body: 'Sign in to view your notification.' })
    );
  });
});
