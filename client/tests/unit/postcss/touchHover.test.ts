import postcss from 'postcss';
import { describe, expect, it } from 'vitest';
import touchHover, { guardHover } from '../../../postcss/touchHover.js';

const GUARD = ':where(:root:not([data-touch-input]) *)';
const run = (css: string) => postcss([touchHover()]).process(css, { from: undefined }).css;

describe('touchHover', () => {
  it('makes a hover rule wait for the touch mark to be gone, keeping its specificity', () => {
    expect(guardHover('.btn:hover')).toBe(`.btn:hover${GUARD}`);
    expect(guardHover('.row:hover > .icon')).toBe(`.row:hover${GUARD} > .icon`);
  });

  it("guards Tailwind's escaped class names on their real :hover only", () => {
    expect(guardHover('.hover\\:bg-red:hover')).toBe(`.hover\\:bg-red:hover${GUARD}`);
    expect(guardHover('.group:hover .group-hover\\:opacity-100')).toBe(
      `.group:hover${GUARD} .group-hover\\:opacity-100`
    );
  });

  it('guards every :hover of a selector, inside :is() too', () => {
    expect(guardHover(':is(.dark .dark\\:hover\\:x:hover)')).toBe(`:is(.dark .dark\\:hover\\:x:hover${GUARD})`);
    expect(guardHover('a:hover, b:focus')).toBe(`a:hover${GUARD}, b:focus`);
  });

  it('leaves :hover after a pseudo-element alone, where nothing may follow it', () => {
    expect(guardHover('.m-range::-webkit-slider-thumb:hover')).toBe('.m-range::-webkit-slider-thumb:hover');
  });

  it('touches neither rules without :hover nor ones already guarded', () => {
    expect(run('.a:focus { color: red }')).toBe('.a:focus { color: red }');
    const once = run('.a:hover { color: red }');
    expect(run(once)).toBe(once);
  });

  it('rewrites each selector of a list on its own', () => {
    expect(run('.a:hover, .b { color: red }')).toBe(`.a:hover${GUARD}, .b { color: red }`);
  });
});
