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
@media (prefers-reduced-motion: reduce) {
  .trek-interactive, .trek-btn, .trek-row, .trek-input, .trek-textarea, .trek-select { transition: none; }
  .trek-interactive:hover, .trek-btn:active { transform: none; }
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
  var lastCtx = null;
  var pending = {};
  var seq = 0;
  var lastH = -1;

  function send(msg) { try { window.parent.postMessage(msg, '*'); } catch (e) {} }
  function setFlag(name, on) { if (on) { docEl.setAttribute(name, ''); } else { docEl.removeAttribute(name); } }

  function applyContext(m) {
    if (m.theme) { docEl.setAttribute('data-theme', m.theme); }
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
    notify: function (level, message) { send({ type: 'trek:notify', level: level, message: message }); },
    navigate: function (to) { send({ type: 'trek:navigate', to: to }); },
    resize: function (px) { var h = px | 0; if (h > 0) { lastH = h; send({ type: 'trek:resize', height: h }); } },
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

  function boot() {
    if (document.body) { document.body.classList.add('trek-ui'); }
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
