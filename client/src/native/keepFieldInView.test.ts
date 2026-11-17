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

  it('FE-NATIVE-KBFIELD-004: a page as tall as the screen gets room at its end and scrolls the field above the keyboard', () => {
    // The login on an iPhone: no pane scrolls, and the keyboard plugin holds the body's height.
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 });
    const scrollBy = vi.spyOn(window, 'scrollBy').mockImplementation(() => {});
    const form = document.createElement('form');
    document.body.appendChild(form);
    field(form, 'input', 760, 800);

    revealFocusedField(KEYBOARD);
    const room = document.body.lastElementChild as HTMLElement;
    expect(room.getAttribute('aria-hidden')).toBe('true');
    expect(room.style.height).toBe('300px');
    expect(scrollBy).toHaveBeenCalledWith({ top: 800 - (700 - 24), behavior: 'smooth' });

    // The next field asks again without stacking a second room.
    revealFocusedField(KEYBOARD);
    expect(document.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);

    releaseRoom();
    expect(room.isConnected).toBe(false);
    scrollBy.mockRestore();
  });

  it('FE-NATIVE-KBFIELD-002: listens for the keyboard coming up and going', () => {
    const addListener = vi.fn(async () => ({ remove: vi.fn() }));
    keepFieldInView({ addListener } as never);
    expect(addListener).toHaveBeenCalledWith('keyboardDidShow', expect.any(Function));
    expect(addListener).toHaveBeenCalledWith('keyboardWillHide', expect.any(Function));
  });

  it('FE-NATIVE-KBFIELD-005: a field pushed under the open keyboard by a new row above it comes back up, and stops being watched once the keyboard goes', async () => {
    // The packing list keeps its entry field open after Enter: each added item lands above it.
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 });
    const handlers: Record<string, (info?: { keyboardHeight: number }) => void> = {};
    const addListener = vi.fn(async (event: string, listener: (info?: { keyboardHeight: number }) => void) => {
      handlers[event] = listener;
      return { remove: vi.fn() };
    });
    keepFieldInView({ addListener } as never);
    const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

    const scroller = pane();
    const list = document.createElement('div');
    scroller.appendChild(list);
    const input = field(scroller, 'input', 600, 640);
    handlers.keyboardDidShow({ keyboardHeight: KEYBOARD });
    expect(scroller.scrollBy).not.toHaveBeenCalled();

    // A new row pushes the field to 700..740, under the keyboard's top edge at 700.
    input.getBoundingClientRect = () => ({ top: 700, bottom: 740 }) as DOMRect;
    list.appendChild(document.createElement('div'));
    list.appendChild(document.createElement('div'));
    await nextFrame();
    await nextFrame();
    expect(scroller.scrollBy).toHaveBeenCalledTimes(1);
    expect(scroller.scrollBy).toHaveBeenCalledWith({ top: 740 - (700 - 24), behavior: 'smooth' });

    handlers.keyboardWillHide();
    list.appendChild(document.createElement('div'));
    await nextFrame();
    await nextFrame();
    expect(scroller.scrollBy).toHaveBeenCalledTimes(1);
    expect(scroller.style.paddingBottom).toBe('');
  });
});
