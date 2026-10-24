// FE-FERRATA-ICON-001 to FE-FERRATA-ICON-004: the route icon halfway along a via ferrata.
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  FERRATA_ICON_GAP,
  FERRATA_ICON_PIXEL_RATIO,
  FERRATA_ICON_SIZE,
  ferrataIconSvg,
  loadFerrataIcon,
  placeFerrataIcons,
} from './ferrataIcon';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ferrataIcon', () => {
  it('FE-FERRATA-ICON-001: draws a ladder in the line colour on a disc of the casing colour', () => {
    const svg = ferrataIconSvg({ line: 'var(--text-primary)', casing: 'rgb(255, 255, 255)' });
    expect(svg).toContain('fill="rgb(255, 255, 255)"');
    expect(svg).toContain('stroke="var(--text-primary)"');
    expect(svg).toContain(`width="${FERRATA_ICON_SIZE}"`);
  });

  it('FE-FERRATA-ICON-002: lets nothing but a colour into the markup', () => {
    const svg = ferrataIconSvg({ line: '"/><script>alert(1)</script>', casing: 'white' });
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('stroke="currentColor"');
  });

  it('FE-FERRATA-ICON-003: hands GL a sharp image of the same SVG, and rejects when it cannot be decoded', async () => {
    const made: Array<{ src: string; width?: number }> = [];
    class FakeImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(public width?: number) {
        made.push(this as unknown as { src: string; width?: number });
      }
      set src(value: string) {
        (this as unknown as { _src: string })._src = value;
        queueMicrotask(() => (value.includes('fail') ? this.onerror?.() : this.onload?.()));
      }
      get src() {
        return (this as unknown as { _src: string })._src;
      }
    }
    vi.stubGlobal('Image', FakeImage);

    const image = await loadFerrataIcon({ line: 'black', casing: 'white' });
    expect(image).toBe(made[0]);
    expect(made[0]?.width).toBe(FERRATA_ICON_SIZE * FERRATA_ICON_PIXEL_RATIO);
    expect(decodeURIComponent(made[0]?.src ?? '')).toContain('stroke="black"');

    await expect(loadFerrataIcon({ line: 'fail', casing: 'white' })).rejects.toThrow('could not be drawn');
  });
  it('FE-FERRATA-ICON-004: leaves out an icon that would touch one already placed, first come first placed', () => {
    const placed = placeFerrataIcons([
      { id: 'a', x: 100, y: 100 },
      { id: 'b', x: 100 + FERRATA_ICON_GAP - 1, y: 100 },
      { id: 'c', x: 100, y: 100 + FERRATA_ICON_GAP },
      { id: 'd', x: 400, y: 400 },
    ]);
    expect([...placed]).toEqual(['a', 'c', 'd']);
    expect(FERRATA_ICON_GAP).toBeGreaterThan(FERRATA_ICON_SIZE);
  });
});
