import { describe, it, expect } from 'vitest';
import { TREK_UI_CSS, TREK_THEME_JS, TREK_UI_MARKER, injectTrekUi } from '../src/index.js';

describe('design kit', () => {
  it('ships a token-driven stylesheet with the signature TREK components', () => {
    // Components an author leans on.
    for (const cls of ['.trek-card', '.trek-glass', '.trek-btn', '.trek-input', '.trek-chip', '.trek-row']) {
      expect(TREK_UI_CSS).toContain(cls);
    }
    // The glass recipe is baked (it can't be read over the bridge) and swaps for dark.
    expect(TREK_UI_CSS).toContain('--glass-bg');
    expect(TREK_UI_CSS).toContain('--glass-highlight');
    expect(TREK_UI_CSS).toContain('[data-theme="dark"]');
    // Honours the same accessibility choices as the host.
    expect(TREK_UI_CSS).toContain('prefers-reduced-motion');
    expect(TREK_UI_CSS).toContain('[data-no-transparency]');
  });

  it('ships a bootstrap that wires the frame and never breaks inline embedding', () => {
    expect(TREK_THEME_JS).toContain("type: 'trek:ready'");
    expect(TREK_THEME_JS).toContain('window.trek');
    expect(TREK_THEME_JS).toContain("'trek:context'");
    // Applies the host tokens + theme to the document.
    expect(TREK_THEME_JS).toContain('setProperty');
    expect(TREK_THEME_JS).toContain("setAttribute('data-theme'");
    // Auto-sizing so a widget/page reports its own height.
    expect(TREK_THEME_JS).toContain('trek:resize');
    // Trusts only the real parent window (opaque frame has a 'null' origin).
    expect(TREK_THEME_JS).toContain('ev.source !== window.parent');
    // Host-managed tab state uses the same request/response channel.
    expect(TREK_THEME_JS).toContain("trek:session:get");
    expect(TREK_THEME_JS).toContain('session: session');
  });

  it('never contains a closing tag that would break <style>/<script> inlining', () => {
    expect(TREK_UI_CSS.toLowerCase()).not.toContain('</style');
    expect(TREK_UI_CSS.toLowerCase()).not.toContain('</script');
    expect(TREK_THEME_JS.toLowerCase()).not.toContain('</script');
    expect(TREK_THEME_JS.toLowerCase()).not.toContain('</style');
  });

  it('injectTrekUi expands the marker into an inline style + script block', () => {
    const html = `<!doctype html><html><head></head><body>${TREK_UI_MARKER}</body></html>`;
    const out = injectTrekUi(html);
    expect(out).not.toContain(TREK_UI_MARKER);
    expect(out).toContain('<style data-trek-ui>');
    expect(out).toContain('<script data-trek-ui>');
    expect(out).toContain('.trek-glass');
    expect(out).toContain('window.trek');
  });

  it('auto-upgrades native <select> into a host-styled, opt-out-able listbox', () => {
    // Styles for the enhanced control ship in the kit.
    for (const cls of ['.trek-select-trigger', '.trek-select-menu', '.trek-select-option']) {
      expect(TREK_UI_CSS).toContain(cls);
    }
    // The bootstrap enhances selects as a listbox, keeps a per-field opt-out, and
    // re-emits real change events so form/plugin code still works.
    expect(TREK_THEME_JS).toContain('enhanceSelect');
    expect(TREK_THEME_JS).toContain('data-trek-native');
    expect(TREK_THEME_JS).toContain("'listbox'");
    expect(TREK_THEME_JS).toContain("dispatch(sel, 'change')");
  });

  it('injectTrekUi is a no-op without the marker and expands every occurrence', () => {
    const plain = '<html><body><h1>hi</h1></body></html>';
    expect(injectTrekUi(plain)).toBe(plain);
    const twice = `${TREK_UI_MARKER}<hr>${TREK_UI_MARKER}`;
    const out = injectTrekUi(twice);
    expect(out.match(/<style data-trek-ui>/g)?.length).toBe(2);
  });
});

/**
 * Boot the kit bootstrap against a stub window, so the bridge's promise handling can be
 * exercised without a DOM. `document.readyState` stays 'loading', which parks boot() on
 * DOMContentLoaded and leaves only the message plumbing live. The stub's postMessage runs
 * structuredClone first, exactly like the browser's — a value it cannot carry throws.
 */
function bootBridge() {
  const sent: Record<string, unknown>[] = [];
  const parent = { postMessage: (msg: Record<string, unknown>) => { structuredClone(msg); sent.push(msg); } };
  let onMessage: ((ev: { source: unknown; data: unknown }) => void) | null = null;
  const win: Record<string, unknown> = {
    parent,
    addEventListener: (type: string, cb: (ev: { source: unknown; data: unknown }) => void) => { if (type === 'message') onMessage = cb; },
  };
  const docEl = { setAttribute: () => {}, removeAttribute: () => {}, style: { setProperty: () => {} } };
  const doc = { documentElement: docEl, readyState: 'loading', addEventListener: () => {}, body: null };
  new Function('window', 'document', TREK_THEME_JS)(win, doc);
  return {
    trek: win.trek as {
      session: { set: (k: string, v: unknown) => Promise<unknown>; get: (k: string) => Promise<unknown> };
      invoke: (sub: string, opts?: { body?: unknown }) => Promise<unknown>;
      confirm: (opts: unknown) => Promise<boolean>;
    },
    sent,
    deliver: (data: unknown) => onMessage?.({ source: parent, data }),
  };
}

describe('bridge requests never hang', () => {
  it('rejects session.set with a value the frame cannot post, instead of pending forever', async () => {
    const { trek, sent } = bootBridge();
    // A function can't be structured-cloned: postMessage throws synchronously and the
    // request never reaches the host, so the promise has to settle here.
    await expect(trek.session.set('k', () => 1)).rejects.toMatchObject({ code: 'SESSION_INVALID_VALUE' });
    expect(sent).toEqual([]);
  });

  it('rejects invoke with an unpostable body and resolves confirm as declined', async () => {
    const { trek } = bootBridge();
    await expect(trek.invoke('/x', { body: { cb: () => 1 } })).rejects.toMatchObject({ code: 'error' });
    await expect(trek.confirm({ message: 'ok?', title: () => 'x' })).resolves.toBe(false);
  });

  it('still settles a normal request from the host response', async () => {
    const { trek, sent, deliver } = bootBridge();
    const p = trek.session.get('k');
    expect(sent).toHaveLength(1);
    deliver({ type: 'trek:response', requestId: sent[0].requestId, data: 'v' });
    await expect(p).resolves.toBe('v');
  });
});
