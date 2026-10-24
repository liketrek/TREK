import { describe, expect, it } from 'vitest';
import { centredMapCard } from './centredMapCard';

// Resolves the CSS the helper returns for a given container width, so the
// geometry is checked in pixels rather than as strings.
function resolve(css: string, extent: number): number {
  const expr = css
    .replace(/100%/g, `${extent}px`)
    .replace(/px/g, '')
    .replace(/calc/g, '')
    .replace(/min\(/g, 'Math.min(')
    .replace(/max\(/g, 'Math.max(');
  return Function(`return (${expr})`)() as number;
}

describe('centredMapCard', () => {
  it('keeps the old centred box when there is no pill to clear', () => {
    const box = centredMapCard(320, 320);
    expect(resolve(box.width, 1280)).toBe(608);
    expect(resolve(box.centre, 1280)).toBe(640);
  });

  it('a narrow desktop map moves the card off the base-layer pill (#2604)', () => {
    const box = centredMapCard(350, 310, { clearPill: true });
    const width = resolve(box.width, 1280);
    const leftEdge = resolve(box.centre, 1280) - width / 2;
    // The pill spans 20 to 62 px right of the left panel.
    expect(leftEdge).toBeGreaterThanOrEqual(350 + 62);
    // And the card still stops 16 px short of the right panel.
    expect(leftEdge + width).toBeLessThanOrEqual(1280 - 310 - 16);
  });

  it('a wide map keeps the card exactly centred and 800 wide', () => {
    const box = centredMapCard(320, 320, { clearPill: true });
    expect(resolve(box.width, 1920)).toBe(800);
    expect(resolve(box.centre, 1920)).toBe(960);
  });
});
