import { bookElementStyle, bookStyleKeys, pastableStyle } from './book-style-copy';
import {
  bookIconElementSchema,
  bookLineElementSchema,
  bookListElementSchema,
  bookShapeElementSchema,
  bookTextElementSchema,
  type BookElement,
} from './book.schema';

import { describe, expect, it } from 'vitest';

/** Copy and paste style: the look `style` may set, carried onto any kind that takes it. */

const frame = { x: 0, y: 0, w: 40, h: 20 };
const text = (over = {}) =>
  bookTextElementSchema.parse({ id: 't', kind: 'text', frame, text: 'Hi', ...over }) as BookElement;
const icon = (over = {}) =>
  bookIconElementSchema.parse({ id: 'i', kind: 'icon', frame, name: 'Sun', ...over }) as BookElement;
const shape = (over = {}) =>
  bookShapeElementSchema.parse({ id: 's', kind: 'shape', frame, shape: 'rect', ...over }) as BookElement;

describe('copy style', () => {
  it('BKSTY-001: takes the look of an element and none of what it says or where it is', () => {
    const style = bookElementStyle(text({ size: 24, color: '#ff0000', weight: 700, opacity: 0.5 }));
    expect(style.kind).toBe('text');
    expect(style.props).toMatchObject({ size: 24, color: '#ff0000', weight: 700, opacity: 0.5 });
    expect(style.props).not.toHaveProperty('text');
    expect(style.props).not.toHaveProperty('frame');
  });

  it('BKSTY-002: leaves out the props of `style` that are words rather than looks', () => {
    const list = bookListElementSchema.parse({ id: 'l', kind: 'list', frame, proLabel: 'Good' }) as BookElement;
    expect(bookStyleKeys('list')).not.toContain('proLabel');
    expect(bookElementStyle(list).props).not.toHaveProperty('proLabel');
    expect(bookStyleKeys('stats')).not.toContain('metrics');
  });

  it("BKSTY-005: takes a line's look and never its points, which are where it runs", () => {
    const route = bookLineElementSchema.parse({
      id: 'r',
      kind: 'line',
      frame,
      points: [
        { x: 0, y: 1 },
        { x: 0.5, y: 0 },
        { x: 1, y: 1 },
      ],
      stroke: '#c2410c',
      dash: 'dashed',
    }) as BookElement;
    expect(bookStyleKeys('line')).not.toContain('points');
    expect(bookElementStyle(route).props).toMatchObject({ stroke: '#c2410c', dash: 'dashed' });
    expect(bookElementStyle(route).props).not.toHaveProperty('points');
  });

  it('BKSTY-003: pastes all of it onto the same kind, and what both have onto another', () => {
    const style = bookElementStyle(text({ size: 24, color: '#ff0000', opacity: 0.5 }));
    expect(pastableStyle(style, 'text')).toMatchObject({ kind: 'text', size: 24, color: '#ff0000' });
    // An icon has a colour and an opacity, no type size.
    const onIcon = pastableStyle(style, 'icon');
    expect(onIcon).toEqual({ kind: 'icon', color: '#ff0000', opacity: 0.5 });
  });

  it('BKSTY-004: answers null when the two kinds share nothing that was set', () => {
    const style = { kind: 'icon' as const, props: { lineWidth: 2 } };
    expect(pastableStyle(style, 'shape')).toBeNull();
    expect(pastableStyle(bookElementStyle(shape({ fill: '#00ff00' })), 'shape')).toMatchObject({ fill: '#00ff00' });
    expect(pastableStyle(bookElementStyle(icon({ color: '#123456' })), 'icon')).toMatchObject({ color: '#123456' });
  });
});
