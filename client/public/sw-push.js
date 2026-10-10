/*
 * Web Push handlers for the generated service worker.
 *
 * vite-plugin-pwa builds sw.js with Workbox (generateSW), and Workbox pulls
 * this file in through `workbox.importScripts` in vite.config.js, ahead of its
 * own precaching. A CLASSIC, dependency-free script on purpose, in the style of
 * theme-boot.js: importScripts cannot load a module, and switching the whole
 * worker to injectManifest to get TypeScript here would mean rewriting every
 * runtime caching rule by hand. The behaviour is pinned by
 * tests/unit/pwa/swPush.test.ts, which runs this file against a fake worker.
 *
 * What arrives is the shared pushPayloadSchema: { title, body, url?, tag? },
 * rendered on the server in the recipient's language, because a worker has no
 * translations of its own. Only chat messages carry a tag, so one trip's chat
 * collapses into one notification; everything else stands on its own.
 */
(function () {
  'use strict';

  var FALLBACK_TITLE = 'TREK';
  var ICON = '/icons/icon-192x192.png';
  var SUBSCRIPTIONS_URL = '/api/notifications/push/subscriptions';

  /** The payload as an object; a push that is not JSON still shows, with its text as the body. */
  function readPayload(data) {
    if (!data) return {};
    try {
      var parsed = data.json();
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
      try {
        return { body: data.text() };
      } catch (e2) {
        return {};
      }
    }
  }

  function text(value) {
    return typeof value === 'string' ? value : '';
  }

  /**
   * A path on this origin, or '/'. The url comes from the server, but a click
   * must never be able to open another site in the installed app's window.
   */
  function sameOriginPath(value) {
    if (typeof value !== 'string' || !value) return '/';
    try {
      var resolved = new URL(value, self.location.origin);
      if (resolved.origin !== self.location.origin) return '/';
      return resolved.pathname + resolved.search + resolved.hash;
    } catch (e) {
      return '/';
    }
  }

  self.addEventListener('push', function (event) {
    var payload = readPayload(event.data);
    var options = {
      body: text(payload.body),
      icon: ICON,
      data: { url: sameOriginPath(payload.url) },
    };
    // A tag makes this notification replace an earlier one with the same tag
    // (the server only sets one for chat, per trip). renotify goes with it, or
    // the replacement would arrive without sound or vibration.
    if (text(payload.tag)) {
      options.tag = payload.tag;
      options.renotify = true;
    }
    // Always show something. Chrome requires a visible notification for every
    // push (userVisibleOnly), and WebKit revokes the subscription after a few
    // silent ones, even while a TREK window has the focus.
    event.waitUntil(self.registration.showNotification(text(payload.title) || FALLBACK_TITLE, options));
  });

  /** Focus a TREK window and take it to `path`, or open one there when none is left. */
  function openPath(path) {
    var target = self.location.origin + path;
    return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windows) {
      var client = windows[0];
      for (var i = 0; i < windows.length; i++) {
        if (windows[i].focused) client = windows[i];
      }
      if (!client) return self.clients.openWindow(target);
      return client
        .focus()
        .then(function (focused) {
          // navigate() is only allowed on a window this worker controls.
          var win = focused || client;
          return typeof win.navigate === 'function' ? win.navigate(target) : win;
        })
        .catch(function () {
          return self.clients.openWindow(target);
        });
    });
  }

  self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    var data = event.notification.data || {};
    event.waitUntil(openPath(sameOriginPath(data.url)));
  });

  /**
   * The browser replaced or dropped the subscription (Firefox does this now and
   * then). Subscribe again with the same server key and tell the server. The
   * same-origin fetch carries the session cookie; when the session is gone this
   * fails, and the re-sync after the next sign-in is the backstop.
   */
  function resubscribe(event) {
    var old = event.oldSubscription;
    var key = old && old.options ? old.options.applicationServerKey : null;
    var next = event.newSubscription
      ? Promise.resolve(event.newSubscription)
      : key
        ? self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key })
        : Promise.resolve(null);
    return next
      .then(function (subscription) {
        if (!subscription) return undefined;
        return fetch(SUBSCRIPTIONS_URL, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: subscription.toJSON() }),
        }).then(function (response) {
          // The old endpoint is dead either way; forgetting it only tidies the
          // server's device list, and only once the new one is safely stored.
          if (!response.ok || !old || old.endpoint === subscription.endpoint) return undefined;
          return fetch(SUBSCRIPTIONS_URL, {
            method: 'DELETE',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: old.endpoint }),
          });
        });
      })
      .catch(function (err) {
        console.warn('[push] could not renew the subscription', err);
      });
  }

  self.addEventListener('pushsubscriptionchange', function (event) {
    event.waitUntil(resubscribe(event));
  });
})();
