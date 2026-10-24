// STLOOK-001 to STLOOK-012: the newer looks of the travel elements. Each look is drawn from the element alone, in its
// ink and accent; these cases check that every look draws its figures, names and marks, and that the classic looks
// every stored book holds still go through the renderer they always went through.
import { describe, expect, it } from 'vitest';

import {
  BOOK_BADGE_STYLES,
  BOOK_COUNTRY_LOOKS,
  BOOK_STATS_LOOKS,
  bookBadgeElementSchema,
  bookCountriesElementSchema,
  bookMapElementSchema,
  bookStatsElementSchema,
  type BookElement,
} from '@trek/shared';

import { TravelElementView } from '../../../src/components/Studio/TravelElements';
import { inkOn, isBadgeLook } from '../../../src/components/Studio/travel/badgeLook';
import { hatch, roughBox, roughCircle, roughLine, seeded } from '../../../src/components/Studio/travel/sketch';
import { render } from '../../helpers/render';

const frame = (w: number, h: number) => ({ x: 0, y: 0, w, h });

const stats = (look: string, metrics = ['distance', 'days', 'countries', 'photos']) =>
  bookStatsElementSchema.parse({
    id: `st-${look}`,
    kind: 'stats',
    frame: frame(150, 75),
    look,
    metrics,
    accent: '#c2185b',
    values: { distance: 966000, days: 20, countries: 1, photos: 4, steps: 102, places: 128, furthest: 122000 },
  });

const country = (look: string, over: Record<string, unknown> = {}) =>
  bookCountriesElementSchema.parse({
    id: `co-${look}`,
    kind: 'countries',
    frame: frame(80, 60),
    look,
    codes: ['JP'],
    names: ['Japan'],
    accent: '#ef6c00',
    ...over,
  });

const badge = (style: string, over: Record<string, unknown> = {}) =>
  bookBadgeElementSchema.parse({
    id: `bd-${style}`,
    kind: 'badge',
    frame: frame(60, 14),
    style,
    variant: 'distance',
    text: '966 km',
    sub: 'Distance',
    accent: '#00796b',
    ...over,
  });

function draw(el: BookElement) {
  return render(
    <TravelElementView
      el={el}
      frameStyle={{ position: 'absolute', width: `${el.frame.w}mm`, height: `${el.frame.h}mm` }}
    />
  );
}

describe('the newer summary looks', () => {
  it('STLOOK-001: every look draws every figure with its value', () => {
    for (const look of BOOK_STATS_LOOKS.filter((l) => l !== 'classic')) {
      const { container, unmount } = draw(stats(look));
      const text = container.textContent ?? '';
      // The odometer sets each digit on its own drum, so its figures read padded with zeros.
      const figures = look === 'odometer' ? ['0966', '0020', '0001', '0004'] : ['966', '20', '1', '4'];
      for (const figure of figures) expect(text.replace(/\s/g, '')).toContain(figure);
      unmount();
    }
  });

  it('STLOOK-002: a ticket cuts its notches and prints a barcode drawn from the figures', () => {
    const { container } = draw(stats('ticket'));
    expect(container.querySelector('clipPath path')?.getAttribute('d')).toContain('A');
    expect(container.querySelectorAll('rect').length).toBeGreaterThan(20);
  });

  it('STLOOK-003: a medal letters its name round the rim, and a single figure fills the frame', () => {
    const { container } = draw(stats('medal', ['days']));
    const rim = container.querySelector('textPath')?.textContent ?? '';
    expect(rim.length).toBeGreaterThan(0);
    expect(rim).toBe(rim.toUpperCase());
    expect(container.querySelectorAll('circle').length).toBeGreaterThanOrEqual(3);
  });

  it('STLOOK-004: a summary placed before looks existed still draws the classic way', () => {
    const { container } = draw(stats('classic'));
    expect(container.querySelector('textPath')).toBeNull();
    expect(container.textContent).toContain('966');
  });
});

describe('the newer country looks', () => {
  it('STLOOK-005: every look names the country, and the outline or the flag shows where', () => {
    for (const look of BOOK_COUNTRY_LOOKS.filter((l) => l !== 'classic')) {
      const { container, unmount } = draw(country(look, { showFlag: true }));
      expect((container.textContent ?? '').toUpperCase()).toContain('JAPAN');
      expect(container.querySelector('svg')).not.toBeNull();
      unmount();
    }
  });

  it('STLOOK-006: a name switched off is left off in every look', () => {
    for (const look of ['stamp', 'visa', 'postcard', 'flag', 'pin', 'label', 'sketch']) {
      const { container, unmount } = draw(country(look, { showName: false }));
      expect(container.textContent ?? '').not.toContain('Japan');
      unmount();
    }
  });

  it('STLOOK-007: an element holding several countries draws one of each, side by side', () => {
    const { container } = draw(country('stamp', { codes: ['JP', 'KR'], names: ['Japan', 'Korea'] }));
    expect(container.querySelectorAll('textPath')).toHaveLength(4);
  });
});

describe('the newer mark styles', () => {
  it('STLOOK-008: every style sets the value and its line, and the four first ones stay classic', () => {
    for (const style of BOOK_BADGE_STYLES) {
      const { container, unmount } = draw(badge(style));
      expect(container.textContent).toContain('966 km');
      expect(isBadgeLook(style)).toBe(!['plain', 'chip', 'outline', 'stacked'].includes(style));
      unmount();
    }
  });

  it('STLOOK-009: a mark without a value carries its name instead, and coordinates go on two lines', () => {
    const flag = draw(badge('pill', { variant: 'flag', text: '', sub: 'Japan', code: 'JP' }));
    expect(flag.container.textContent).toContain('Japan');
    flag.unmount();

    const coords = draw(badge('tag', { variant: 'coords', text: '35°40′N 139°45′E', sub: 'Tokyo' }));
    const lines = [...coords.container.querySelectorAll('span')].find((s) => s.style.flexDirection === 'column');
    expect(lines?.textContent).toContain('Tokyo');
  });

  it('STLOOK-010: a filled mark takes the ink that reads on its fill', () => {
    expect(inkOn('#ffffff')).not.toBe(inkOn('#000000'));
    const { container } = draw(badge('pill', { variant: 'date', text: '4', sub: 'May' }));
    expect(container.querySelector('svg')).not.toBeNull();
  });
});

describe('the map stops', () => {
  const route = [
    { lat: 35.68, lng: 139.76 },
    { lat: 35.01, lng: 135.77 },
    { lat: 34.69, lng: 135.5 },
  ];

  it('STLOOK-011: numbers every stop, or marks the start and the finish', () => {
    const numbered = draw(
      bookMapElementSchema.parse({
        id: 'm1',
        kind: 'map',
        frame: frame(120, 90),
        countries: ['JP'],
        points: route,
        pinStyle: 'numbered',
      })
    );
    expect([...numbered.container.querySelectorAll('text')].map((t) => t.textContent)).toEqual(['1', '2', '3']);
    numbered.unmount();

    const ends = draw(
      bookMapElementSchema.parse({
        id: 'm2',
        kind: 'map',
        frame: frame(120, 90),
        countries: ['JP'],
        points: route,
        pinStyle: 'ends',
      })
    );
    // The finish carries a pennant, the start a ring round a dot.
    expect(ends.container.querySelectorAll('line').length).toBeGreaterThan(0);
    expect(ends.container.querySelectorAll('text')).toHaveLength(0);
  });
});

describe('drawn by hand', () => {
  it('STLOOK-012: the same words wobble the same way every time, and every stroke is a path', () => {
    const a = seeded('Japan');
    const b = seeded('Japan');
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(seeded('Korea')()).not.toBe(seeded('Japan')());

    const pen = { rand: seeded('x'), wobble: 1 };
    for (const d of [
      roughLine(0, 0, 10, 0, pen),
      roughBox({ x: 0, y: 0, w: 10, h: 5 }, pen),
      roughCircle(5, 5, 3, pen),
      hatch({ x: 0, y: 0, w: 10, h: 10 }, 2, pen),
    ]) {
      expect(d.startsWith('M')).toBe(true);
    }
  });
});
