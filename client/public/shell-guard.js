/*
 * Boot guard for the app shell (#2524).
 *
 * Loaded as an external classic script in <head> (NOT a module), like
 * theme-boot.js, so it runs before the entry module and complies with the
 * production CSP (script-src 'self').
 *
 * The entry module and every chunk it imports statically have to load before
 * any of the app's own code runs. When one of them does not (a service worker
 * precache that keeps index.html under a chunk's name, a proxy that hands out a
 * stale file), the module script fails as a whole: nothing renders, and no error
 * screen or reload button of the app is there to help. A reload changes nothing
 * either, since the same precache answers it. This notices exactly that failure
 * and, while the server answers, loads the page again from the server under a
 * URL no cache has seen. When a service worker served the page, the app shell
 * it keeps (the Workbox precache and the worker itself) is thrown away first,
 * since that is what answered with the broken file. A Web Push subscription
 * ends with the worker and has to be switched on again, the price of an app
 * that starts again. Once per session, so a build that is broken on the server
 * cannot put the page in a reload loop. Offline nothing happens: the precache
 * is then the only way the app can start at all.
 *
 * It also strips the query parameter such a reload carries, before the app
 * reads the URL. Keep the parameter and the cache filter in sync with
 * src/utils/chunkReload.ts and src/utils/serviceWorkerShell.ts.
 *
 * It must never throw.
 */
(function () {
  var PARAM = 'trek-reload';
  var MARKER = 'trek:shell-reload';
  var HEALTH_TIMEOUT_MS = 3000;

  try {
    var here = new URL(window.location.href);
    if (here.searchParams.has(PARAM)) {
      here.searchParams.delete(PARAM);
      window.history.replaceState(window.history.state, '', here.pathname + here.search + here.hash);
    }
  } catch (e) {
    /* the parameter stays in the address bar, which is harmless */
  }

  // The built entry lives under /assets/. The dev server's /src/main.tsx does
  // not, so a syntax error while developing is left to Vite's own overlay.
  function isEntry(el) {
    return !!el && el.tagName === 'SCRIPT' && el.type === 'module' && /\/assets\//.test(el.src || '');
  }

  function alreadyTried() {
    try {
      return !!sessionStorage.getItem(MARKER);
    } catch (e) {
      // Without the marker there is no loop protection, so do nothing.
      return true;
    }
  }

  function markTried() {
    try {
      sessionStorage.setItem(MARKER, String(Date.now()));
      return true;
    } catch (e) {
      return false;
    }
  }

  // Same test as probeNow() in src/sync/connectivity.ts: TREK's own health JSON,
  // not an edge proxy's login page and not a request that never came back.
  function serverAnswers() {
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, HEALTH_TIMEOUT_MS) : null;
    return fetch('/api/health', {
      credentials: 'include',
      cache: 'no-store',
      redirect: 'manual',
      signal: ctrl ? ctrl.signal : undefined,
    }).then(function (res) {
      var type = res.headers.get('content-type') || '';
      return res.ok && type.indexOf('application/json') !== -1;
    }, function () {
      return false;
    }).then(function (ok) {
      if (timer) clearTimeout(timer);
      return ok;
    });
  }

  function servedByWorker() {
    try {
      return !!(navigator.serviceWorker && navigator.serviceWorker.controller);
    } catch (e) {
      return false;
    }
  }

  function dropAppShell() {
    var jobs = [];
    if (typeof caches !== 'undefined') {
      jobs.push(caches.keys().then(function (names) {
        return Promise.all(names.filter(function (name) {
          return name.indexOf('-precache-') !== -1;
        }).map(function (name) {
          return caches.delete(name);
        }));
      }));
    }
    if (navigator.serviceWorker) {
      jobs.push(navigator.serviceWorker.getRegistration().then(function (reg) {
        return reg ? reg.unregister() : false;
      }));
    }
    return Promise.all(jobs);
  }

  function reloadFresh() {
    var url = new URL(window.location.href);
    url.searchParams.set(PARAM, Date.now().toString(36));
    window.location.replace(url.href);
  }

  function recover() {
    if (alreadyTried()) return;
    // Read now: a page the worker did not serve failed on the network, and its
    // precache has nothing to do with it.
    var fromWorker = servedByWorker();
    serverAnswers().then(function (ok) {
      if (!ok || alreadyTried() || !markTried()) return;
      var dropped = fromWorker ? dropAppShell() : Promise.resolve();
      return dropped.then(null, function () {
        /* reload regardless, the server has the current build */
      }).then(reloadFresh);
    }).then(null, function () {
      /* never block boot */
    });
  }

  try {
    // Error and load events of a script do not bubble, so both are caught on
    // their way down. On the document, since a load event never reaches window.
    document.addEventListener('error', function (event) {
      if (isEntry(event.target)) recover();
    }, true);
    // The shell started, so a later update in this session may recover too.
    document.addEventListener('load', function (event) {
      if (!isEntry(event.target)) return;
      try {
        sessionStorage.removeItem(MARKER);
      } catch (e) {
        /* nothing to clear */
      }
    }, true);
  } catch (e) {
    /* never block boot */
  }
})();
