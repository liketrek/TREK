// The page /api/auth/native/start answers with runs this (see NativeAuthController.start).
// A browser that ran an older TREK keeps that version's app in its service worker, and
// the worker would answer the handoff page with an app that has no such page. So the
// worker goes first, and the handoff page loads from the server.
(function () {
  var script = document.currentScript;
  var target = script && script.getAttribute('data-target');
  if (!target || target.indexOf('/native-handoff?') !== 0) return;
  var gone = false;
  var go = function () {
    if (gone) return;
    gone = true;
    location.replace(target);
  };
  // Until the sign-in is handed back to the app, no worker is registered and no
  // new version reloads the page (src/native/browserSignInFlag.ts): a tab still
  // open on the older TREK keeps its worker alive, and either would bring it back.
  try {
    localStorage.setItem('trek_native_signin', String(Date.now()));
  } catch (e) {
    /* site data blocked: the worker is still taken off below */
  }
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.getRegistrations) {
    go();
    return;
  }
  // Never stuck here: whatever the browser does with the workers, the page moves on.
  var timer = setTimeout(go, 3000);
  navigator.serviceWorker
    .getRegistrations()
    .then(function (registrations) {
      return Promise.all(
        registrations.map(function (registration) {
          return registration.unregister();
        })
      );
    })
    .catch(function () {})
    .then(function () {
      clearTimeout(timer);
      go();
    });
})();
