import { afterEach, describe, expect, it, vi } from 'vitest';
import { focusDialog } from './dialogFocus';

function panelWith(html: string): HTMLElement {
  const panel = document.createElement('div');
  panel.tabIndex = -1;
  panel.innerHTML = html;
  document.body.appendChild(panel);
  return panel;
}

describe('focusDialog', () => {
  const realMatchMedia = window.matchMedia;
  afterEach(() => {
    window.matchMedia = realMatchMedia;
    document.body.innerHTML = '';
  });

  const desktop = () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 1400 });
    window.matchMedia = vi
      .fn()
      .mockImplementation((q: string) => ({
        matches: q.includes('pointer: fine'),
        media: q,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })) as unknown as typeof window.matchMedia;
  };

  it('FE-DIALOGFOCUS-001: on a desktop the first text field takes the focus', () => {
    desktop();
    const panel = panelWith('<input id="a" type="text"><input id="b" type="text">');
    focusDialog(panel);
    expect(document.activeElement?.id).toBe('a');
  });

  it('FE-DIALOGFOCUS-002: a field marked as the start wins over the first one', () => {
    desktop();
    const panel = panelWith('<input id="a" type="text"><input id="b" type="text" data-initial-focus>');
    focusDialog(panel);
    expect(document.activeElement?.id).toBe('b');
  });

  it('FE-DIALOGFOCUS-003: a focus already inside stays where it is', () => {
    desktop();
    const panel = panelWith('<input id="a" type="text"><input id="b" type="text" data-initial-focus>');
    (panel.querySelector('#a') as HTMLElement).focus();
    focusDialog(panel);
    expect(document.activeElement?.id).toBe('a');
  });
});
