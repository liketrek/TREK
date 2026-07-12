/**
 * The TREK plugin design kit (#plugins).
 *
 * A plugin's UI runs in a sandboxed, opaque-origin iframe — it can't load TREK's
 * stylesheet, only postMessage. So instead of forcing every author to re-derive the
 * look, we ship it: a token-driven stylesheet (`TREK_UI_CSS`) plus a tiny bootstrap
 * (`TREK_THEME_JS`) that wires the frame to the host. Both are plain strings, meant
 * to be INLINED into the plugin's own `client/index.html` (the CSP forbids external
 * <link>/<script src> for an opaque frame). Authors opt in with a single
 * `<!-- trek:ui -->` marker; `dev`/`pack` expand it, and `create` seeds it.
 *
 * The kit carries its own default values, so a component looks right on first paint,
 * then the bootstrap overrides the live tokens the host sends (accent scheme, custom
 * accent, high-contrast, light/dark) so the plugin tracks the app exactly. The glassy
 * `.trek-dash` layer (the --glass, --r and --sh families) is scoped to the dashboard
 * in the host, so it can't be read over the bridge — those values are baked here
 * (they only change
 * with light/dark, keyed off `[data-theme="dark"]`, not with the accent).
 *
 * Nothing here is a security boundary: it is the plugin's own inlined CSS/JS talking
 * over the existing bridge. It grants no new capability — only a native look.
 */

/** Marker an author drops in `client/index.html`; `dev`/`pack` replace it with the kit. */
export const TREK_UI_MARKER = '<!-- trek:ui -->';

/** Token-driven stylesheet. Inline as `<style>${TREK_UI_CSS}</style>`. */
export const TREK_UI_CSS = `/* TREK plugin design kit — token-driven, matches the host in light + dark. */
:root {
  color-scheme: light;
  /* Live tokens (the host overrides these per theme/accent via the bridge). */
  --bg-primary: #ffffff; --bg-secondary: #f8fafc; --bg-tertiary: #f1f5f9;
  --bg-card: #ffffff; --bg-input: #ffffff; --bg-hover: rgba(0,0,0,.03); --bg-selected: #e2e8f0;
  --text-primary: #111827; --text-secondary: #374151; --text-muted: #6b7280; --text-faint: #9ca3af;
  --border-primary: #e5e7eb; --border-secondary: #f3f4f6; --border-faint: rgba(0,0,0,.06);
  --accent: #111827; --accent-text: #ffffff; --accent-hover: #1f2937; --accent-subtle: #f1f5f9;
  --success: #16a34a; --success-soft: #dcfce7; --danger: #dc2626; --danger-soft: #fef2f2;
  --warning: #d97706; --warning-soft: #fffbeb; --info: #2563eb; --info-soft: #eff6ff;
  --shadow-card: 0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.04);
  --shadow-sm: 0 1px 2px rgba(0,0,0,.05); --shadow-md: 0 4px 12px rgba(0,0,0,.08);
  --shadow-lg: 0 12px 32px rgba(0,0,0,.12);
  --radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px; --radius-xl: 20px;
  --font-system: 'Poppins', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif;
  /* Baked glass layer (mirrors the host's .trek-dash; not sent over the bridge). */
  --glass-bg: linear-gradient(135deg, oklch(1 0 0 / .72) 0%, oklch(0.99 0.006 75 / .5) 100%);
  --glass-border: oklch(0.88 0.008 70 / .7);
  --glass-shadow: 0 1px 2px oklch(0.4 0.02 60 / .05), 0 12px 32px -14px oklch(0.3 0.02 60 / .2);
  --glass-shadow-hover: 0 2px 6px oklch(0.4 0.02 60 / .07), 0 26px 56px -20px oklch(0.25 0.04 60 / .32);
  --glass-highlight: inset 0 1px 0 oklch(1 0 0 / .8);
  --glass-blur: blur(22px) saturate(1.7);
  --r-sm: 14px; --r-md: 18px; --r-lg: 22px; --r-xl: 28px;
  /* The house easings: a punchy card curve and TREK's ease-out-quint. */
  --trek-ease: cubic-bezier(.2,.7,.2,1);
  --trek-ease-quint: cubic-bezier(.23,1,.32,1);
}
[data-theme="dark"] {
  color-scheme: dark;
  --bg-primary: #121215; --bg-secondary: #1a1a1e; --bg-tertiary: #1c1c21;
  --bg-card: #131316; --bg-input: #1c1c21; --bg-hover: rgba(255,255,255,.06); --bg-selected: rgba(255,255,255,.1);
  --text-primary: #f4f4f5; --text-secondary: #d4d4d8; --text-muted: #a1a1aa; --text-faint: #71717a;
  --border-primary: #27272a; --border-secondary: #1c1c21; --border-faint: rgba(255,255,255,.07);
  --accent: #e4e4e7; --accent-text: #09090b; --accent-hover: #d4d4d8; --accent-subtle: rgba(255,255,255,.08);
  --success: #22c55e; --success-soft: rgba(34,197,94,.15); --danger: #ef4444; --danger-soft: rgba(239,68,68,.15);
  --warning: #f59e0b; --warning-soft: rgba(245,158,11,.15); --info: #3b82f6; --info-soft: rgba(59,130,246,.15);
  --shadow-card: 0 1px 3px rgba(0,0,0,.4), 0 1px 2px rgba(0,0,0,.3);
  --shadow-sm: 0 1px 2px rgba(0,0,0,.3); --shadow-md: 0 4px 12px rgba(0,0,0,.4);
  --shadow-lg: 0 12px 32px rgba(0,0,0,.5);
  --glass-bg: linear-gradient(135deg, oklch(0.31 0 0 / .58) 0%, oklch(0.25 0 0 / .42) 100%);
  --glass-border: oklch(1 0 0 / .1);
  --glass-shadow: 0 1px 2px oklch(0 0 0 / .3), 0 12px 32px -14px oklch(0 0 0 / .55);
  --glass-shadow-hover: 0 2px 6px oklch(0 0 0 / .4), 0 26px 56px -20px oklch(0 0 0 / .72);
  --glass-highlight: inset 0 1px 0 oklch(1 0 0 / .09);
}

/* Base: a light reset + native type. The bootstrap adds \`trek-ui\` to <body>. */
*, *::before, *::after { box-sizing: border-box; }
body.trek-ui {
  margin: 0;
  font-family: var(--font-system);
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-primary);
  background: transparent;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.trek-ui :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 4px; }

/* Cards + panels ----------------------------------------------------------- */
.trek-card {
  background: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 16px;
}
.trek-glass {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--r-xl);
  box-shadow: var(--glass-shadow), var(--glass-highlight);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  padding: 24px 26px;
}
/* Add to a card/glass to make it lift on hover, like a native tool tile. */
.trek-interactive {
  transition: transform .3s var(--trek-ease), box-shadow .3s, border-color .3s;
  cursor: pointer;
}
.trek-glass.trek-interactive:hover {
  transform: translateY(-2px);
  box-shadow: var(--glass-shadow-hover), var(--glass-highlight);
}
.trek-card.trek-interactive:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.trek-interactive:active { transform: translateY(0); }

/* Buttons ------------------------------------------------------------------ */
.trek-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 10px 16px; border-radius: 12px;
  font: inherit; font-size: 14px; font-weight: 500; line-height: 1;
  border: 1px solid transparent; cursor: pointer; text-decoration: none; white-space: nowrap;
  transition: transform .08s var(--trek-ease-quint), background .15s, box-shadow .15s, border-color .15s, color .15s;
}
.trek-btn:active { transform: scale(.97); }
.trek-btn:disabled { opacity: .5; cursor: not-allowed; }
.trek-btn--primary { background: var(--accent); color: var(--accent-text); box-shadow: var(--shadow-sm); }
.trek-btn--primary:hover:not(:disabled) { background: var(--accent-hover); }
.trek-btn--secondary { background: var(--bg-card); color: var(--text-primary); border-color: var(--border-primary); box-shadow: var(--shadow-sm); }
.trek-btn--secondary:hover:not(:disabled) { background: var(--bg-hover); }
.trek-btn--ghost { background: transparent; color: var(--text-secondary); }
.trek-btn--ghost:hover:not(:disabled) { background: var(--bg-hover); color: var(--text-primary); }
.trek-btn--danger { background: var(--danger); color: #fff; }
.trek-btn--danger:hover:not(:disabled) { filter: brightness(1.05); }

/* Form controls ------------------------------------------------------------ */
.trek-input, .trek-textarea, .trek-select {
  width: 100%; box-sizing: border-box;
  padding: 8px 14px; border-radius: 10px;
  border: 1px solid var(--border-primary); background: var(--bg-input); color: var(--text-primary);
  font: inherit; font-size: 13px; outline: none;
  transition: border-color .15s, box-shadow .15s, background .15s;
}
.trek-textarea { resize: vertical; min-height: 72px; }
.trek-input::placeholder, .trek-textarea::placeholder { color: var(--text-faint); }
.trek-input:focus, .trek-textarea:focus, .trek-select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--accent) 22%, transparent);
}
.trek-label { display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; }

/* Enhanced select — the kit upgrades a native <select> into this listbox so the
   dropdown matches the host (a native popup is drawn by the OS and can't be
   themed). The real <select> stays in the DOM as the value source. */
.trek-select-wrap { position: relative; }
.trek-select-native-hidden {
  position: absolute !important; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); border: 0;
}
.trek-select-trigger {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  text-align: start; cursor: pointer;
}
.trek-select-trigger:disabled { opacity: .5; cursor: not-allowed; }
.trek-select-trigger[aria-expanded="true"] {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--accent) 22%, transparent);
}
.trek-select-value { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.trek-select-caret { flex: none; display: inline-flex; color: var(--text-faint); transition: transform .15s; }
.trek-select-trigger[aria-expanded="true"] .trek-select-caret { transform: rotate(180deg); }
.trek-select-menu {
  position: absolute; left: 0; right: 0; top: 100%; z-index: 50;
  margin-top: 6px; padding: 4px;
  max-height: 260px; overflow-y: auto;
  background: var(--bg-card); color: var(--text-primary);
  border: 1px solid var(--border-primary); border-radius: 10px;
  box-shadow: var(--shadow-md);
}
.trek-select-menu[data-placement="top"] { top: auto; bottom: 100%; margin-top: 0; margin-bottom: 6px; }
.trek-select-option {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px; border-radius: 7px; cursor: pointer;
  font-size: 13px; white-space: nowrap;
}
.trek-select-option.trek-active { background: var(--bg-hover); }
.trek-select-option[aria-selected="true"] { color: var(--accent); font-weight: 600; }
.trek-select-option[aria-disabled="true"] { opacity: .45; cursor: not-allowed; }

/* Chips + badges ----------------------------------------------------------- */
.trek-chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px; border-radius: 999px;
  font-size: 12px; font-weight: 600; white-space: nowrap;
  color: var(--text-secondary); background: var(--accent-subtle);
}
.trek-chip--accent  { color: var(--accent);  background: color-mix(in oklch, var(--accent) 12%, transparent); }
.trek-chip--success { color: var(--success); background: var(--success-soft); }
.trek-chip--danger  { color: var(--danger);  background: var(--danger-soft); }
.trek-chip--warning { color: var(--warning); background: var(--warning-soft); }
.trek-chip--info    { color: var(--info);    background: var(--info-soft); }

/* Rows + text helpers ------------------------------------------------------ */
.trek-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: 12px; cursor: pointer;
  transition: background .12s;
}
.trek-row:hover { background: var(--bg-hover); }
.trek-title { font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: .14em; color: var(--text-muted); }
.trek-muted { color: var(--text-muted); }
.trek-faint { color: var(--text-faint); }

/* Layout helpers ----------------------------------------------------------- */
.trek-stack { display: flex; flex-direction: column; gap: 12px; }
.trek-cluster { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }

/* Motion library — the host's animation vocabulary, mirrored 1:1 from
   index.css so plugin UI moves exactly like TREK does. ---------------------- */
@keyframes trek-menu-enter {
  from { opacity: 0; transform: scale(0.95) translateY(-4px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes trek-popover-enter {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes trek-modal-enter {
  from { opacity: 0; transform: scale(0.97); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes trek-backdrop-enter {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes trek-toast-enter {
  from { opacity: 0; transform: translateY(8px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes trek-progress-fill {
  from { width: 0%; }
  to   { width: var(--trek-progress-to, 0%); }
}
@keyframes trek-pie-reveal {
  from { opacity: 0; transform: rotate(-90deg) scale(0.85); }
  to   { opacity: 1; transform: rotate(0deg) scale(1); }
}
@keyframes trek-bar-fill {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
@keyframes trek-page-enter {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes trek-shimmer {
  from { background-position: -200% 0; }
  to   { background-position: 200% 0; }
}
@keyframes trek-drawer-enter {
  from { opacity: 0; transform: translateY(100%); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes trek-fade-up {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.trek-menu-enter {
  animation: trek-menu-enter 200ms var(--trek-ease-quint);
  transform-origin: top right; will-change: transform, opacity;
}
.trek-menu-enter-left {
  animation: trek-menu-enter 200ms var(--trek-ease-quint);
  transform-origin: top left; will-change: transform, opacity;
}
.trek-popover-enter { animation: trek-popover-enter 180ms var(--trek-ease-quint); will-change: transform, opacity; }
.trek-modal-enter { animation: trek-modal-enter 220ms var(--trek-ease-quint); will-change: transform, opacity; }
@media (max-width: 639px) {
  .trek-modal-enter { animation: trek-drawer-enter 320ms cubic-bezier(0.32, 0.72, 0, 1); }
}
.trek-backdrop-enter { animation: trek-backdrop-enter 180ms var(--trek-ease-quint); }
.trek-toast-enter { animation: trek-toast-enter 260ms var(--trek-ease-quint); will-change: transform, opacity; }
.trek-pie-reveal {
  animation: trek-pie-reveal 900ms var(--trek-ease-quint) both;
  transform-origin: center; will-change: transform, opacity;
}
.trek-bar-fill {
  animation: trek-bar-fill 700ms var(--trek-ease-quint) both;
  transform-origin: left center; will-change: transform;
}
.trek-page-enter { animation: trek-page-enter 220ms var(--trek-ease-quint) both; }
.trek-skeleton {
  background: linear-gradient(90deg, var(--bg-tertiary) 0%, var(--bg-hover) 50%, var(--bg-tertiary) 100%);
  background-size: 200% 100%;
  animation: trek-shimmer 1.6s linear infinite;
  border-radius: 8px; color: transparent; user-select: none;
}
[data-theme="dark"] .trek-skeleton {
  background: linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%);
  background-size: 200% 100%;
}
.trek-stagger > * { animation: trek-fade-up 280ms var(--trek-ease-quint) both; }
.trek-stagger > *:nth-child(1) { animation-delay: 0ms; }
.trek-stagger > *:nth-child(2) { animation-delay: 40ms; }
.trek-stagger > *:nth-child(3) { animation-delay: 80ms; }
.trek-stagger > *:nth-child(4) { animation-delay: 120ms; }
.trek-stagger > *:nth-child(5) { animation-delay: 160ms; }
.trek-stagger > *:nth-child(6) { animation-delay: 200ms; }
.trek-stagger > *:nth-child(7) { animation-delay: 240ms; }
.trek-stagger > *:nth-child(8) { animation-delay: 280ms; }
.trek-stagger > *:nth-child(n+9) { animation-delay: 320ms; }

/* Accessibility: mirror the host's own graceful-degrade rules. -------------- */
[data-no-transparency] .trek-glass {
  background: var(--bg-card); border-color: var(--border-primary);
  box-shadow: var(--shadow-card);
  -webkit-backdrop-filter: none; backdrop-filter: none;
}
[data-reduce-motion] .trek-interactive,
[data-reduce-motion] .trek-btn,
[data-reduce-motion] .trek-row { transition: none; }
[data-reduce-motion] .trek-interactive:hover,
[data-reduce-motion] .trek-btn:active { transform: none; }
[data-reduce-motion] .trek-menu-enter, [data-reduce-motion] .trek-menu-enter-left,
[data-reduce-motion] .trek-popover-enter, [data-reduce-motion] .trek-modal-enter,
[data-reduce-motion] .trek-toast-enter, [data-reduce-motion] .trek-stagger > *,
[data-reduce-motion] .trek-page-enter {
  animation: trek-backdrop-enter 120ms ease-out;
}
[data-reduce-motion] .trek-pie-reveal, [data-reduce-motion] .trek-bar-fill {
  animation: trek-backdrop-enter 120ms ease-out both;
}
[data-reduce-motion] .trek-skeleton { animation: none; background: var(--bg-tertiary); }
[data-reduce-motion] .trek-select-caret { transition: none; }
@media (prefers-reduced-motion: reduce) {
  .trek-interactive, .trek-btn, .trek-row, .trek-input, .trek-textarea, .trek-select, .trek-select-caret { transition: none; }
  .trek-interactive:hover, .trek-btn:active { transform: none; }
  .trek-menu-enter, .trek-menu-enter-left, .trek-popover-enter,
  .trek-modal-enter, .trek-toast-enter, .trek-stagger > *, .trek-page-enter {
    animation: trek-backdrop-enter 120ms ease-out;
  }
  .trek-pie-reveal, .trek-bar-fill { animation: trek-backdrop-enter 120ms ease-out both; }
  .trek-skeleton { animation: none; background: var(--bg-tertiary); }
}`;

/**
 * The bridge bootstrap. Inline as `<script>${TREK_THEME_JS}</script>` (typically via
 * the `<!-- trek:ui -->` marker). It: announces readiness; applies the host's theme
 * tokens, theme name and appearance flags to the document; auto-reports its height so
 * a widget/page self-sizes; and installs a small `window.trek` helper over the same
 * bridge messages the host already understands — it adds no new capability.
 */
export const TREK_THEME_JS = `(function () {
  'use strict';
  var docEl = document.documentElement;
  var ctxHandlers = [];
  var evtHandlers = [];
  var lastCtx = null;
  var pending = {};
  var pendingConfirms = {};
  var seq = 0;
  var lastH = -1;

  function send(msg) { try { window.parent.postMessage(msg, '*'); } catch (e) {} }
  function setFlag(name, on) { if (on) { docEl.setAttribute(name, ''); } else { docEl.removeAttribute(name); } }

  function applyContext(m) {
    if (m.theme) { docEl.setAttribute('data-theme', m.theme); }
    if (m.locale) { docEl.setAttribute('lang', m.locale); }
    docEl.setAttribute('dir', m.dir === 'rtl' ? 'rtl' : 'ltr');
    var t = m.tokens || {};
    for (var k in t) {
      if (Object.prototype.hasOwnProperty.call(t, k) && t[k]) { docEl.style.setProperty(k, t[k]); }
    }
    var a = m.appearance || {};
    setFlag('data-reduce-motion', a.reducedMotion);
    setFlag('data-no-transparency', a.noTransparency);
    if (a.density) { docEl.setAttribute('data-density', a.density); }
    if (a.scheme) { docEl.setAttribute('data-scheme', a.scheme); }
    if (document.body) { document.body.classList.add('trek-ui'); }
  }

  function reportHeight() {
    var h = Math.ceil(document.documentElement.scrollHeight);
    if (h > 0 && h !== lastH) { lastH = h; send({ type: 'trek:resize', height: h }); }
  }

  window.addEventListener('message', function (ev) {
    // Opaque frame: origin serialises to 'null', so trust the SENDER — only our real
    // parent window. Never act on a claimed id or on origin.
    if (ev.source !== window.parent) { return; }
    var m = ev.data;
    if (!m || typeof m !== 'object') { return; }
    if (m.type === 'trek:context') {
      lastCtx = m; api.context = m;
      applyContext(m);
      for (var i = 0; i < ctxHandlers.length; i++) { try { ctxHandlers[i](m); } catch (e) {} }
      reportHeight();
    } else if (m.type === 'trek:response') {
      var p = pending[m.requestId];
      if (p) { delete pending[m.requestId]; p.resolve(m.data); }
    } else if (m.type === 'trek:error') {
      var q = pending[m.requestId];
      if (q) { delete pending[m.requestId]; var err = new Error(m.message || 'invoke failed'); err.code = m.code; q.reject(err); }
    } else if (m.type === 'trek:confirm:result') {
      var c = pendingConfirms[m.requestId];
      if (c) { delete pendingConfirms[m.requestId]; c(!!m.confirmed); }
    } else if (m.type === 'trek:event') {
      for (var j = 0; j < evtHandlers.length; j++) { try { evtHandlers[j](m.event, m.tripId); } catch (e) {} }
    }
  });

  // Native DOM helpers so a widget can build kit-styled UI with no bundler and no
  // hand-written CSS — every element carries the same trek-* classes the kit ships.
  function mkEl(tag, props, children) {
    var node = document.createElement(tag);
    props = props || {};
    for (var k in props) {
      if (!Object.prototype.hasOwnProperty.call(props, k)) { continue; }
      var v = props[k];
      if (v == null) { continue; }
      if (k === 'class' || k === 'className') { node.className = v; }
      else if (k === 'text') { node.textContent = v; }
      else if (k === 'html') { node.innerHTML = v; }
      else if (k === 'on') { for (var ev in v) { if (Object.prototype.hasOwnProperty.call(v, ev)) { node.addEventListener(ev, v[ev]); } } }
      else { node.setAttribute(k, v); }
    }
    var kids = children == null ? [] : (typeof children === 'string' || children.nodeType ? [children] : children);
    for (var i = 0; i < kids.length; i++) {
      var c = kids[i];
      if (c == null) { continue; }
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return node;
  }
  var ui = {
    el: mkEl,
    button: function (label, opts) {
      opts = opts || {};
      return mkEl('button', { class: 'trek-btn' + (opts.variant ? ' trek-btn--' + opts.variant : ''), type: 'button', text: label, on: opts.onClick ? { click: opts.onClick } : null }, null);
    },
    card: function (children) { return mkEl('div', { class: 'trek-card' }, children); },
    chip: function (text, variant) { return mkEl('span', { class: 'trek-chip' + (variant ? ' trek-chip--' + variant : ''), text: text }, null); },
    input: function (opts) { opts = opts || {}; return mkEl('input', { class: 'trek-input', type: opts.type || 'text', placeholder: opts.placeholder || '', value: opts.value || '' }, null); },
    mount: function (node, target) { (target || document.body).appendChild(node); return node; }
  };

  var api = {
    context: null,
    ui: ui,
    ready: function () { send({ type: 'trek:ready' }); },
    requestContext: function () { send({ type: 'trek:context:request' }); },
    onContext: function (cb) {
      ctxHandlers.push(cb);
      if (lastCtx) { try { cb(lastCtx); } catch (e) {} }
      return function () { var i = ctxHandlers.indexOf(cb); if (i >= 0) { ctxHandlers.splice(i, 1); } };
    },
    notify: function (level, message, duration) { send({ type: 'trek:notify', level: level, message: message, duration: duration }); },
    navigate: function (to) { send({ type: 'trek:navigate', to: to }); },
    openExternal: function (url) { send({ type: 'trek:openExternal', url: url }); },
    resize: function (px) { var h = px | 0; if (h > 0) { lastH = h; send({ type: 'trek:resize', height: h }); } },
    // Host-rendered native confirm dialog; resolves true/false. The host shows one
    // at a time — a second concurrent request resolves false immediately.
    confirm: function (opts) {
      opts = typeof opts === 'string' ? { message: opts } : (opts || {});
      var id = 'c' + (++seq);
      return new Promise(function (resolve) {
        pendingConfirms[id] = resolve;
        send({ type: 'trek:confirm', requestId: id, title: opts.title, message: opts.message, confirmLabel: opts.confirmLabel, cancelLabel: opts.cancelLabel, danger: opts.danger });
      });
    },
    // Core-event names for the trip in view ({ event, tripId } only, no payloads) —
    // refetch via invoke() when something relevant fires instead of polling.
    onEvent: function (cb) {
      evtHandlers.push(cb);
      return function () { var i = evtHandlers.indexOf(cb); if (i >= 0) { evtHandlers.splice(i, 1); } };
    },
    invoke: function (sub, opts) {
      opts = opts || {};
      var id = 'r' + (++seq);
      return new Promise(function (resolve, reject) {
        pending[id] = { resolve: resolve, reject: reject };
        send({ type: 'trek:invoke', requestId: id, sub: sub, method: opts.method, body: opts.body });
      });
    }
  };
  window.trek = api;

  // --- Native <select> -> host-styled listbox ---------------------------------
  // A native select's popup is drawn by the OS and can't match TREK. Upgrade each
  // one to a keyboard-accessible listbox that uses the kit tokens, while the real
  // <select> stays in the DOM as the value/form source (kept in sync both ways).
  // Opt out per field with data-trek-native; multi/size selects are left alone.
  function dispatch(el, type) {
    var ev;
    try { ev = new Event(type, { bubbles: true }); }
    catch (e) { ev = document.createEvent('Event'); ev.initEvent(type, true, false); }
    el.dispatchEvent(ev);
  }
  function enhanceSelect(sel) {
    if (!sel || sel.__trekSelect || sel.hasAttribute('data-trek-native')) { return; }
    if (sel.multiple || sel.size > 1 || !sel.parentNode) { return; }
    sel.__trekSelect = true;

    var wrap = document.createElement('div');
    wrap.className = 'trek-select-wrap';
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(sel);
    sel.classList.add('trek-select-native-hidden');
    sel.setAttribute('tabindex', '-1');
    sel.setAttribute('aria-hidden', 'true');

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'trek-select trek-select-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    if (sel.disabled) { trigger.disabled = true; }
    var valueEl = document.createElement('span');
    valueEl.className = 'trek-select-value';
    var caret = document.createElement('span');
    caret.className = 'trek-select-caret';
    caret.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
    trigger.appendChild(valueEl);
    trigger.appendChild(caret);
    wrap.appendChild(trigger);

    var menu = document.createElement('div');
    menu.className = 'trek-select-menu';
    menu.setAttribute('role', 'listbox');
    menu.hidden = true;
    wrap.appendChild(menu);

    var activeIdx = -1;

    function syncTrigger() {
      var o = sel.options[sel.selectedIndex];
      valueEl.textContent = o ? o.text : '';
    }
    function buildMenu() {
      menu.innerHTML = '';
      for (var i = 0; i < sel.options.length; i++) {
        var o = sel.options[i];
        var item = document.createElement('div');
        item.className = 'trek-select-option';
        item.setAttribute('role', 'option');
        item.setAttribute('data-idx', String(i));
        item.setAttribute('aria-selected', i === sel.selectedIndex ? 'true' : 'false');
        if (o.disabled) { item.setAttribute('aria-disabled', 'true'); }
        item.textContent = o.text;
        menu.appendChild(item);
      }
    }
    function highlight(idx) {
      var opts = menu.children;
      for (var i = 0; i < opts.length; i++) {
        opts[i].className = i === idx ? 'trek-select-option trek-active' : 'trek-select-option';
      }
      if (idx >= 0 && opts[idx] && opts[idx].scrollIntoView) { opts[idx].scrollIntoView({ block: 'nearest' }); }
      activeIdx = idx;
    }
    function onDocDown(e) { if (!wrap.contains(e.target)) { closeMenu(); } }
    function openMenu() {
      if (trigger.disabled || !menu.hidden) { return; }
      buildMenu();
      menu.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      // Flip above the trigger when there isn't room below in the frame viewport.
      var r = trigger.getBoundingClientRect();
      var below = window.innerHeight - r.bottom;
      if (below < Math.min(260, menu.scrollHeight + 12) && r.top > below) { menu.setAttribute('data-placement', 'top'); }
      else { menu.removeAttribute('data-placement'); }
      highlight(sel.selectedIndex);
      reportHeight();
      document.addEventListener('mousedown', onDocDown, true);
    }
    function closeMenu() {
      if (menu.hidden) { return; }
      menu.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      document.removeEventListener('mousedown', onDocDown, true);
      reportHeight();
    }
    function nextEnabled(from, dir) {
      var i = from;
      for (var n = 0; n < sel.options.length; n++) {
        i += dir;
        if (i < 0) { i = sel.options.length - 1; }
        if (i >= sel.options.length) { i = 0; }
        if (!sel.options[i].disabled) { return i; }
      }
      return from;
    }
    function commit(idx) {
      if (idx < 0 || idx >= sel.options.length || sel.options[idx].disabled) { return; }
      if (sel.selectedIndex !== idx) { sel.selectedIndex = idx; dispatch(sel, 'input'); dispatch(sel, 'change'); }
      syncTrigger();
      closeMenu();
      trigger.focus();
    }

    trigger.addEventListener('click', function () { if (menu.hidden) { openMenu(); } else { closeMenu(); } });
    trigger.addEventListener('keydown', function (e) {
      var k = e.key;
      if (menu.hidden) {
        if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Enter' || k === ' ' || k === 'Spacebar') { e.preventDefault(); openMenu(); }
        return;
      }
      if (k === 'Escape') { e.preventDefault(); closeMenu(); trigger.focus(); }
      else if (k === 'ArrowDown') { e.preventDefault(); highlight(nextEnabled(activeIdx, 1)); }
      else if (k === 'ArrowUp') { e.preventDefault(); highlight(nextEnabled(activeIdx, -1)); }
      else if (k === 'Home') { e.preventDefault(); highlight(nextEnabled(-1, 1)); }
      else if (k === 'End') { e.preventDefault(); highlight(nextEnabled(0, -1)); }
      else if (k === 'Enter' || k === ' ' || k === 'Spacebar') { e.preventDefault(); commit(activeIdx); }
      else if (k === 'Tab') { closeMenu(); }
    });
    menu.addEventListener('mousedown', function (e) { e.preventDefault(); }); // keep focus on the trigger
    menu.addEventListener('click', function (e) {
      var t = e.target;
      while (t && t !== menu && !(t.getAttribute && t.hasAttribute('data-idx'))) { t = t.parentNode; }
      if (t && t.getAttribute && t.hasAttribute('data-idx')) { commit(parseInt(t.getAttribute('data-idx'), 10)); }
    });
    menu.addEventListener('mousemove', function (e) {
      var t = e.target;
      while (t && t !== menu && !(t.getAttribute && t.hasAttribute('data-idx'))) { t = t.parentNode; }
      if (t && t.getAttribute && t.hasAttribute('data-idx')) { highlight(parseInt(t.getAttribute('data-idx'), 10)); }
    });
    // The plugin may set select.value itself — mirror it back to the trigger.
    sel.addEventListener('change', syncTrigger);
    syncTrigger();
  }
  function enhanceAllSelects(root) {
    var live = (root || document).getElementsByTagName('select');
    var arr = [];
    for (var i = 0; i < live.length; i++) { arr.push(live[i]); }
    for (var j = 0; j < arr.length; j++) { enhanceSelect(arr[j]); }
  }

  function boot() {
    if (document.body) { document.body.classList.add('trek-ui'); }
    enhanceAllSelects(document);
    if (typeof MutationObserver !== 'undefined' && document.body) {
      new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          var added = muts[i].addedNodes;
          for (var j = 0; j < added.length; j++) {
            var n = added[j];
            if (!n || n.nodeType !== 1) { continue; }
            if (n.tagName === 'SELECT') { enhanceSelect(n); }
            else if (n.getElementsByTagName) { enhanceAllSelects(n); }
          }
        }
      }).observe(document.body, { childList: true, subtree: true });
    }
    api.ready();
    reportHeight();
    if (typeof ResizeObserver !== 'undefined' && document.body) {
      new ResizeObserver(reportHeight).observe(document.body);
    }
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', boot); } else { boot(); }
})();`;

/**
 * Replace the `<!-- trek:ui -->` marker in a plugin's HTML with the inlined kit
 * (style + bootstrap). A no-op when the marker is absent, so it is safe to run over
 * any HTML. The source file on disk is never touched — the expansion happens at
 * dev-serve / pack time, so an author's `client/index.html` stays a one-line opt-in.
 */
export function injectTrekUi(html: string): string {
  if (!html.includes(TREK_UI_MARKER)) return html;
  const block = `<style data-trek-ui>\n${TREK_UI_CSS}\n</style>\n<script data-trek-ui>\n${TREK_THEME_JS}\n</script>`;
  return html.split(TREK_UI_MARKER).join(block);
}
