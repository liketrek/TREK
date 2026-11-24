import { afterEach, describe, expect, it, vi } from 'vitest';
import { TOUCH_INPUT_ATTR, trackTouchInput } from './touchInput';

const root = document.documentElement;
let stop: (() => void) | null = null;

afterEach(() => {
  stop?.();
  stop = null;
});

function pointer(type: string, pointerType: string) {
  const e = new Event(type, { bubbles: true }) as PointerEvent;
  Object.defineProperty(e, 'pointerType', { value: pointerType });
  window.dispatchEvent(e);
}

describe('trackTouchInput', () => {
  it('starts as touch and follows the pointer that was used last', () => {
    stop = trackTouchInput();
    expect(root.hasAttribute(TOUCH_INPUT_ATTR)).toBe(true);
    pointer('pointermove', 'mouse');
    expect(root.hasAttribute(TOUCH_INPUT_ATTR)).toBe(false);
    pointer('pointerdown', 'touch');
    expect(root.hasAttribute(TOUCH_INPUT_ATTR)).toBe(true);
    pointer('pointerdown', 'pen');
    expect(root.hasAttribute(TOUCH_INPUT_ATTR)).toBe(true);
  });

  it('keeps the mouseover a tap makes up from reaching any handler', () => {
    stop = trackTouchInput();
    const el = document.createElement('button');
    document.body.appendChild(el);
    const seen = vi.fn();
    el.addEventListener('mouseover', seen);
    el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    expect(seen).not.toHaveBeenCalled();

    pointer('pointermove', 'mouse');
    el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    expect(seen).toHaveBeenCalledTimes(1);
    el.remove();
  });

  it('takes everything back when stopped', () => {
    stop = trackTouchInput();
    stop();
    stop = null;
    expect(root.hasAttribute(TOUCH_INPUT_ATTR)).toBe(false);
    const seen = vi.fn();
    document.body.addEventListener('mouseover', seen);
    document.body.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    expect(seen).toHaveBeenCalledTimes(1);
    document.body.removeEventListener('mouseover', seen);
  });
});
