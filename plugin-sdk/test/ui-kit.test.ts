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

  it('injectTrekUi is a no-op without the marker and expands every occurrence', () => {
    const plain = '<html><body><h1>hi</h1></body></html>';
    expect(injectTrekUi(plain)).toBe(plain);
    const twice = `${TREK_UI_MARKER}<hr>${TREK_UI_MARKER}`;
    const out = injectTrekUi(twice);
    expect(out.match(/<style data-trek-ui>/g)?.length).toBe(2);
  });
});
