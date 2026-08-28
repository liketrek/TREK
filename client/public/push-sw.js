(function () {
  const STATE_DB = 'trek-push-state';
  const STATE_STORE = 'state';

  function readActiveUserId() {
    return new Promise((resolve) => {
      try {
        const open = indexedDB.open(STATE_DB, 1);
        open.onupgradeneeded = () => {
          if (!open.result.objectStoreNames.contains(STATE_STORE)) open.result.createObjectStore(STATE_STORE);
        };
        open.onerror = () => resolve(undefined);
        open.onsuccess = () => {
          const stateDb = open.result;
          try {
            const get = stateDb.transaction(STATE_STORE, 'readonly').objectStore(STATE_STORE).get('activeUserId');
            get.onerror = () => {
              stateDb.close();
              resolve(undefined);
            };
            get.onsuccess = () => {
              stateDb.close();
              resolve(get.result);
            };
          } catch {
            stateDb.close();
            resolve(undefined);
          }
        };
      } catch {
        resolve(undefined);
      }
    });
  }

  function safePayload(event) {
    try {
      const data = event.data && event.data.json();
      return data && data.v === 1 ? data : null;
    } catch {
      return null;
    }
  }

  self.addEventListener('push', (event) => {
    event.waitUntil(
      (async () => {
        const payload = safePayload(event);
        const activeUserId = await readActiveUserId();
        const showFull = payload && Number(payload.recipientUserId) === Number(activeUserId);
        const title = showFull && typeof payload.title === 'string' ? payload.title : 'TREK';
        const body = showFull && typeof payload.body === 'string' ? payload.body : 'Sign in to view your notification.';
        const path = showFull && typeof payload.path === 'string' && payload.path.startsWith('/') ? payload.path : '/';
        const unreadCount =
          payload && Number.isFinite(Number(payload.unreadCount))
            ? Math.max(0, Math.floor(Number(payload.unreadCount)))
            : 0;
        const tasks = [
          self.registration.showNotification(title, {
            body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png',
            data: { path },
          }),
        ];
        if (unreadCount > 0 && self.navigator && typeof self.navigator.setAppBadge === 'function') {
          tasks.push(self.navigator.setAppBadge(unreadCount));
        } else if (self.navigator && typeof self.navigator.clearAppBadge === 'function') {
          tasks.push(self.navigator.clearAppBadge());
        }
        await Promise.allSettled(tasks);
      })()
    );
  });

  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
      (async () => {
        const rawPath = event.notification.data && event.notification.data.path;
        const path =
          typeof rawPath === 'string' && rawPath.startsWith('/') && !rawPath.startsWith('//') ? rawPath : '/';
        const target = new URL(path, self.location.origin);
        if (target.origin !== self.location.origin) return;
        const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        const exact = windows.find((client) => client.url === target.href);
        const candidate = exact || windows.find((client) => new URL(client.url).origin === target.origin);
        if (candidate) {
          if (!exact && typeof candidate.navigate === 'function') await candidate.navigate(target.href);
          await candidate.focus();
        } else await self.clients.openWindow(target.href);
      })()
    );
  });
})();
