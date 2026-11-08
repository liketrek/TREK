import { describe, expect, it, vi } from 'vitest';
import { keepFieldInView, revealFocusedField } from './keepFieldInView';

function field(tag: string, top: number, bottom: number): HTMLElement {
  const el = document.createElement(tag);
  document.body.appendChild(el);
  el.getBoundingClientRect = () => ({ top, bottom }) as DOMRect;
  el.scrollIntoView = vi.fn();
  if (tag === 'div') el.tabIndex = 0;
  el.focus();
  return el;
}

describe('keepFieldInView', () => {
  it('FE-NATIVE-KBFIELD-001: a field the keyboard covers is scrolled to the middle, one in view or not for typing stays', () => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 500 });

    const covered = field('input', 620, 660);
    revealFocusedField();
    expect(covered.scrollIntoView).toHaveBeenCalledWith({ block: 'center', behavior: 'smooth' });

    const visible = field('textarea', 100, 160);
    revealFocusedField();
    expect(visible.scrollIntoView).not.toHaveBeenCalled();

    const notTyping = field('div', 620, 660);
    revealFocusedField();
    expect(notTyping.scrollIntoView).not.toHaveBeenCalled();
  });

  it('FE-NATIVE-KBFIELD-002: listens for the keyboard having come up', () => {
    const addListener = vi.fn(async () => ({ remove: vi.fn() }));
    keepFieldInView({ addListener });
    expect(addListener).toHaveBeenCalledWith('keyboardDidShow', expect.any(Function));
  });
});
