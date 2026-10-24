import { afterEach, describe, expect, it } from 'vitest';

import { rovingTarget, runsRtl } from './studioRoving';

/**
 * FE-STUDIO-ROVING-001 to FE-STUDIO-ROVING-004: the arrow keys through a strip
 * of tabs, the rail and the tab rows inside the panels.
 */

const ACROSS = { vertical: false, rtl: false };
const DOWN = { vertical: true, rtl: false };

afterEach(() => {
  document.documentElement.removeAttribute('dir');
  document.body.innerHTML = '';
});

describe('rovingTarget', () => {
  it('FE-STUDIO-ROVING-001: moves along a row with the arrows, wrapping at both ends', () => {
    expect(rovingTarget('ArrowRight', 0, 3, ACROSS)).toBe(1);
    expect(rovingTarget('ArrowRight', 2, 3, ACROSS)).toBe(0);
    expect(rovingTarget('ArrowLeft', 0, 3, ACROSS)).toBe(2);
    expect(rovingTarget('ArrowLeft', 2, 3, ACROSS)).toBe(1);
    // Up and down mean nothing to a row.
    expect(rovingTarget('ArrowDown', 0, 3, ACROSS)).toBeNull();
  });

  it('FE-STUDIO-ROVING-002: follows the reading direction across, and goes up and down a column', () => {
    const rtl = { vertical: false, rtl: true };
    expect(rovingTarget('ArrowLeft', 0, 3, rtl)).toBe(1);
    expect(rovingTarget('ArrowRight', 0, 3, rtl)).toBe(2);
    expect(rovingTarget('ArrowDown', 1, 4, DOWN)).toBe(2);
    expect(rovingTarget('ArrowUp', 0, 4, DOWN)).toBe(3);
    expect(rovingTarget('ArrowRight', 1, 4, DOWN)).toBeNull();
  });

  it('FE-STUDIO-ROVING-003: jumps to the ends, and takes no key on an empty strip', () => {
    expect(rovingTarget('Home', 2, 5, DOWN)).toBe(0);
    expect(rovingTarget('End', 0, 5, ACROSS)).toBe(4);
    expect(rovingTarget('Enter', 1, 5, ACROSS)).toBeNull();
    expect(rovingTarget('ArrowDown', 0, 0, DOWN)).toBeNull();
  });
});

describe('runsRtl', () => {
  it('FE-STUDIO-ROVING-004: reads the direction of the page around the element', () => {
    const tab = document.createElement('button');
    document.body.append(tab);
    expect(runsRtl(tab)).toBe(false);
    document.documentElement.setAttribute('dir', 'rtl');
    expect(runsRtl(tab)).toBe(true);
    const ltr = document.createElement('div');
    ltr.setAttribute('dir', 'ltr');
    ltr.append(tab);
    document.body.append(ltr);
    expect(runsRtl(tab)).toBe(false);
  });
});
