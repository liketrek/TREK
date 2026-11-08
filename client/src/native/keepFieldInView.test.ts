import { afterEach, describe, expect, it, vi } from 'vitest';
import { keepFieldInView, releaseRoom, revealFocusedField } from './keepFieldInView';

const KEYBOARD = 300;

function pane(): HTMLElement {
  const el = document.createElement('div');
  el.style.overflowY = 'auto';
  Object.defineProperty(el, 'scrollHeight', { configurable: true, value: 2000 });
  Object.defineProperty(el, 'clientHeight', { configurable: true, value: 800 });
  el.scrollBy = vi.fn();
  document.body.appendChild(el);
  return el;
}

function field(parent: HTMLElement, tag: string, top: number, bottom: number): HTMLElement {
  const el = document.createElement(tag);
  parent.appendChild(el);
  el.getBoundingClientRect = () => ({ top, bottom }) as DOMRect;
  el.scrollIntoView = vi.fn();
  if (tag === 'div') el.tabIndex = 0;
  el.focus();
  return el;
}

afterEach(() => {
  releaseRoom();
  document.body.innerHTML = '';
});

describe('keepFieldInView', () => {
  it('FE-NATIVE-KBFIELD-001: a field under the keyboard gets room in its pane and is scrolled above it, the room goes with the keyboard', () => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 });
    const scroller = pane();
    field(scroller, 'input', 760, 800);

    revealFocusedField(KEYBOARD);
    expect(scroller.style.paddingBottom).toBe('300px');
    // The keyboard's top is at 700; the field's bottom goes 24px above it.
    expect(scroller.scrollBy).toHaveBeenCalledWith({ top: 800 - (700 - 24), behavior: 'smooth' });

    releaseRoom();
    expect(scroller.style.paddingBottom).toBe('');
  });

  it('FE-NATIVE-KBFIELD-003: a field in view, or one not for typing, stays where it is', () => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 });
    const scroller = pane();
    field(scroller, 'textarea', 100, 160);
    revealFocusedField(KEYBOARD);
    field(scroller, 'div', 760, 800);
    revealFocusedField(KEYBOARD);
    expect(scroller.scrollBy).not.toHaveBeenCalled();
    expect(scroller.style.paddingBottom).toBe('');
  });

  it('FE-NATIVE-KBFIELD-002: listens for the keyboard coming up and going', () => {
    const addListener = vi.fn(async () => ({ remove: vi.fn() }));
    keepFieldInView({ addListener } as never);
    expect(addListener).toHaveBeenCalledWith('keyboardDidShow', expect.any(Function));
    expect(addListener).toHaveBeenCalledWith('keyboardWillHide', expect.any(Function));
  });
});
