import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { BookTextElement } from '@trek/shared';
import { bookTextElementSchema } from '@trek/shared';

import { render } from '../../../tests/helpers/render';
import { ElementView } from './SpreadView';
import { TextEffectsView } from './TextEffectsView';

/**
 * Text effects on the page: every effect a vector layer, never a blur or a
 * filter, a curve and a photo fill drawn as SVG with ids of their own, and a
 * plain text left to the renderer it always had.
 */

const text = (over: Record<string, unknown> = {}): BookTextElement =>
  bookTextElementSchema.parse({
    id: 't1',
    kind: 'text',
    frame: { x: 10, y: 20, w: 100, h: 40 },
    text: 'Lisbon',
    size: 36,
    ...over,
  });

const frameStyle = { position: 'absolute' as const, width: '100mm', height: '40mm' };

describe('a text that still wraps', () => {
  it('stacks a shadow, a band, an outline and the fill, laid out alike', () => {
    const el = text({
      outline: { color: '#ffffff', width: 0.5 },
      shadow: { dx: 1, dy: 2, color: '#111111', alpha: 0.5 },
      highlight: { color: '#c2410c', padX: 2, padY: 0.5, radius: 1 },
      transform: 'upper',
      vAlign: 'bottom',
    });
    const { container } = render(<TextEffectsView el={el} frameStyle={frameStyle} big={false} />);
    const frame = container.firstElementChild as HTMLElement;
    const layers = Array.from(frame.children) as HTMLElement[];
    expect(layers).toHaveLength(4);
    expect(layers.map((l) => l.getAttribute('aria-hidden'))).toEqual(['true', 'true', 'true', null]);
    for (const layer of layers) expect(layer.textContent).toBe('Lisbon');

    // The styles as React writes them, which is what the print renderer reads.
    const html = renderToStaticMarkup(<TextEffectsView el={el} frameStyle={frameStyle} big={false} />);
    expect(html).toContain('overflow:visible');
    expect(html).toContain('transform:translate(1mm, 2mm)');
    expect(html).toContain('color:rgba(17, 17, 17, 0.5)');
    expect(html).toContain('-webkit-text-stroke:1mm rgba(17, 17, 17, 0.5)');
    expect(html).toContain('background:#c2410c');
    expect(html).toContain('box-decoration-break:clone');
    expect(html).toContain('-webkit-text-stroke:1mm #ffffff');
    expect(html.match(/text-transform:uppercase/g)).toHaveLength(4);
    expect(html.match(/justify-content:flex-end/g)).toHaveLength(4);
    expect(html).not.toMatch(/filter|blur|background-clip/);
  });

  it('draws hollow letters as their outline alone', () => {
    const el = text({
      outline: { color: '#111111', width: 0.4 },
      fillPaint: { type: 'solid', color: '#111111', alpha: 0 },
    });
    const html = renderToStaticMarkup(<TextEffectsView el={el} frameStyle={frameStyle} big={false} />);
    expect(html).toContain('color:transparent;-webkit-text-stroke:0.4mm #111111');
    expect(html).toContain('color:rgba(17, 17, 17, 0)');
  });

  it('keeps a text with only a case or a vertical place clipped to its frame, as plain text is', () => {
    const el = text({ transform: 'smallcaps' });
    const { container } = render(<TextEffectsView el={el} frameStyle={frameStyle} big={false} />);
    expect((container.firstElementChild as HTMLElement).children).toHaveLength(1);
    const html = renderToStaticMarkup(<TextEffectsView el={el} frameStyle={frameStyle} big={false} />);
    expect(html).toContain('overflow:hidden');
    expect(html).toContain('font-variant-caps:small-caps');
  });
});

describe('a text drawn as SVG', () => {
  it('lays a curved text on its path with textPath, the path in the millimetres of the frame', () => {
    const el = text({
      curve: { type: 'arc', bend: 40, start: 0 },
      align: 'center',
      shadow: { dx: 1, dy: 1, color: '#111111' },
    });
    const { container } = render(<TextEffectsView el={el} frameStyle={frameStyle} big={false} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 100 40');
    const path = svg?.querySelector('defs path');
    const used = svg?.getElementsByTagName('textPath') ?? [];
    expect(used).toHaveLength(2);
    for (const tp of Array.from(used)) {
      expect(tp.getAttribute('href')).toBe(`#${path?.getAttribute('id')}`);
      expect(tp.getAttribute('startOffset')).toBe('50%');
      expect(tp.textContent).toBe('Lisbon');
    }
    expect(svg?.querySelector('g')?.getAttribute('transform')).toBe('translate(1 1)');
  });

  it('fills the letters with the photo through a clip of the letters, waiting on an <image>', () => {
    const el = text({ text: 'LIS\nBON', fillPaint: { type: 'photo', photoId: 12, focalX: 0.5, focalY: 0.5, zoom: 1 } });
    const { container } = render(<TextEffectsView el={el} frameStyle={frameStyle} big />);
    const image = container.querySelector('image');
    expect(image?.getAttribute('href')).toBe('/api/photos/12/original');
    const clip = container.getElementsByTagName('clipPath')[0];
    expect(image?.getAttribute('clip-path')).toBe(`url(#${clip?.getAttribute('id')})`);
    expect(clip?.getAttribute('clipPathUnits')).toBe('userSpaceOnUse');
    expect(Array.from(clip?.querySelectorAll('tspan') ?? []).map((t) => t.textContent)).toEqual(['LIS', 'BON']);
  });

  it('fills the letters with a gradient through a gradient of their own frame', () => {
    const el = text({
      fillPaint: {
        type: 'linear',
        angle: 90,
        stops: [
          { at: 0, color: '#ff6600' },
          { at: 1, color: '#ffcc00' },
        ],
      },
    });
    const { container } = render(<TextEffectsView el={el} frameStyle={frameStyle} big={false} />);
    const gradient = container.querySelector('linearGradient');
    expect(gradient?.getAttribute('gradientUnits')).toBe('userSpaceOnUse');
    expect(Array.from(gradient?.querySelectorAll('stop') ?? []).map((s) => s.getAttribute('stop-color'))).toEqual([
      '#ff6600',
      '#ffcc00',
    ]);
    const letters = container.querySelector('svg > text');
    expect(letters?.getAttribute('fill')).toBe(`url(#${gradient?.getAttribute('id')})`);
  });

  it('fills the letters with a pattern, its ground and its marks clipped to them', () => {
    const el = text({
      fillPaint: { type: 'pattern', pattern: 'stripes', fg: '#d62828', bg: '#ffffff', scale: 1, angle: 0 },
    });
    const { container } = render(<TextEffectsView el={el} frameStyle={frameStyle} big={false} />);
    const clip = container.getElementsByTagName('clipPath')[0];
    const group = container.querySelector('g[clip-path]');
    expect(group?.getAttribute('clip-path')).toBe(`url(#${clip?.getAttribute('id')})`);
    expect(group?.querySelector('rect')?.getAttribute('fill')).toBe('#ffffff');
    expect(group?.querySelectorAll('path[fill="#d62828"]').length).toBeGreaterThan(0);
  });

  it('gives every copy of a page its own ids, so a page drawn twice never clips to the other copy', () => {
    const el = text({ fillPaint: { type: 'photo', photoId: 12 }, curve: { type: 'circle' } });
    const { container } = render(
      <>
        <TextEffectsView el={el} frameStyle={frameStyle} big={false} />
        <TextEffectsView el={el} frameStyle={frameStyle} big={false} />
      </>
    );
    const ids = Array.from(container.querySelectorAll('[id]')).map((n) => n.id);
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
  });
});

describe('the page renderer', () => {
  it('draws a text with effects through the effect view and a plain one as it always did', () => {
    const { container: fx } = render(
      <ElementView el={text({ outline: { color: '#111111', width: 0.3 } })} big={false} />
    );
    expect((fx.firstElementChild as HTMLElement).children).toHaveLength(2);
    const { container: plain } = render(<ElementView el={text()} big={false} />);
    const div = plain.firstElementChild as HTMLElement;
    expect(div.textContent).toBe('Lisbon');
    expect(div.children).toHaveLength(0);
  });
});
