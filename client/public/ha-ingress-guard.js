// Home Assistant Ingress guard.
//
// Under HA Ingress the SPA is served from a rotating subpath, which is
// incompatible with the service worker's fixed precache scope registered by
// a prior standalone visit. This script unregisters any stale service
// worker (and clears its caches) before the app boots, then reloads once
// so the fresh index.html from the server takes effect.
//
// Served at the repo root so browsers fetch it as `ha-ingress-guard.js`
// under any base path; loaded synchronously BEFORE the bundled app script
// so it runs before React mounts.
(function () {
  if (!location.pathname.startsWith('/api/hassio_ingress/')) return;
  if (!('serviceWorker' in navigator)) return;

  var unregisterPromise = navigator.serviceWorker.getRegistrations().then(function (regs) {
    return Promise.all(regs.map(function (r) { return r.unregister(); }))
      .then(function (results) { return results.some(Boolean); });
  });

  var cachePromise = typeof caches !== 'undefined'
    ? caches.keys().then(function (keys) {
        return Promise.all(keys.map(function (k) { return caches.delete(k); }));
      })
    : Promise.resolve();

  Promise.all([unregisterPromise, cachePromise]).then(function (results) {
    if (results[0] && !sessionStorage.getItem('trek_ha_ingress_reloaded')) {
      sessionStorage.setItem('trek_ha_ingress_reloaded', '1');
      location.reload();
    }
  }).catch(function () { /* ignore */ });
})();
