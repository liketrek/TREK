/*
 * Pre-paint appearance boot — kills the flash of default/wrong theme (FOUC).
 *
 * Loaded as an external, render-blocking CLASSIC script in <head> (NOT a module)
 * so it runs before first paint AND complies with the production CSP
 * (script-src 'self'; inline scripts are blocked). It reads the compact snapshot
 * written by client/src/theme/applyAppearance.ts and applies it verbatim. Keep
 * this in sync with that module's snapshot shape + apply logic.
 *
 * It must never throw — any failure silently falls back to the default look.
 */
(function () {
  try {
    var raw = localStorage.getItem('trek_appearance');
    if (!raw) return;
    var s = JSON.parse(raw);
    if (!s || s.v !== 1) return;

    var root = document.documentElement;
    var path = location.pathname;
    var isShared = path.indexOf('/shared/') === 0 || path.indexOf('/public/') === 0;

    var dark;
    if (isShared) dark = false;
    else if (s.darkMode === 'auto') dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    else dark = s.darkMode === true || s.darkMode === 'dark';
    root.classList.toggle('dark', dark);

    var scheme = isShared ? 'default' : s.scheme;
    if (scheme && scheme !== 'default') root.setAttribute('data-scheme', scheme);
    if (!isShared && s.noTransparency) root.setAttribute('data-no-transparency', '');
    if (s.density === 'compact') root.setAttribute('data-density', 'compact');
    if (s.reduceMotion) root.setAttribute('data-reduce-motion', '');

    if (!isShared && scheme === 'custom' && s.accent) {
      root.style.setProperty('--accent-custom-light', s.accent.light);
      root.style.setProperty('--accent-custom-dark', s.accent.dark);
      if (s.accentText) {
        root.style.setProperty('--accent-custom-text-light', s.accentText.light);
        root.style.setProperty('--accent-custom-text-dark', s.accentText.dark);
      }
    }

    var ts = s.typeScale || {};
    var fs = typeof s.fontScale === 'number' ? s.fontScale : 1;
    setScale('--fs-scale-title', fs * (ts.title || 1));
    setScale('--fs-scale-subtitle', fs * (ts.subtitle || 1));
    setScale('--fs-scale-body', fs * (ts.body || 1));
    setScale('--fs-scale-caption', fs * (ts.caption || 1));
    if (fs !== 1) root.style.fontSize = fs * 100 + '%';

    function setScale(name, v) {
      if (typeof v === 'number' && v !== 1) root.style.setProperty(name, String(v));
    }
  } catch (e) {
    /* never block boot */
  }
})();
