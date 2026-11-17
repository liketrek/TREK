// Registers the service worker, as vite-plugin-pwa's own registerSW.js does; this
// file in public/ takes its place. Not while the app's sign-in runs in this browser
// (src/native/browserSignInFlag.ts): a tab still open on an older TREK keeps that
// version's worker alive, and registering now would bring it back to answer the
// sign-in's next page with an app that has no handoff page.
(function () {
  if (!('serviceWorker' in navigator)) return;
  try {
    var started = Number(localStorage.getItem('trek_native_signin'));
    var age = Date.now() - started;
    if (started > 0 && age >= 0 && age < 15 * 60 * 1000) return;
  } catch (e) {
    /* site data blocked: register as usual */
  }
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js', { scope: '/' });
  });
})();
