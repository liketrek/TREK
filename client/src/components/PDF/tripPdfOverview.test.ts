/**
 * FE-PDFOVERVIEW-001 to FE-PDFOVERVIEW-005: the trip PDF's cover and overview pages,
 * built from the figures the export hands them.
 */
import { describe, expect, it } from 'vitest';

import { coverHtml, coverRouteSvg, glanceHtml, ledgerHtml, type GlanceRow, type LedgerRow } from './tripPdfOverview';

const tr = (key: string) => key;
const parse = (html: string) => new DOMParser().parseFromString(html, 'text/html');
const texts = (doc: Document, selector: string) =>
  [...doc.querySelectorAll(selector)].map((el) => el.textContent?.replace(/\s+/g, ' ').trim());

describe('coverHtml', () => {
  const base = {
    title: 'Autumn <in> Japan',
    description: 'Temples and trains',
    range: '1 November – 22 November 2026',
    logo: 'https://trek.example/logo-light.svg',
    stats: [
      { value: '22', label: 'days' },
      { value: '1,234 km', label: 'pdf.distanceLabel' },
    ],
    route: [],
    ribbon: [],
    ribbonEnds: null,
    tr,
  };

  it('FE-PDFOVERVIEW-001: the photo, the escaped title, the dates and a tile per figure', () => {
    const doc = parse(coverHtml({ ...base, image: 'https://cdn.example/cover.jpg' }));

    expect(doc.querySelector('section')?.className).toBe('cover');
    expect(doc.querySelector('.cover-bg')?.getAttribute('style')).toBe(
      "background-image:url('https://cdn.example/cover.jpg')"
    );
    expect(texts(doc, '.cover-title')).toEqual(['Autumn <in> Japan']);
    expect(texts(doc, '.cover-dates')).toEqual(['1 November – 22 November 2026']);
    expect(texts(doc, '.cover-desc')).toEqual(['Temples and trains']);
    expect(texts(doc, '.cover-stat-num')).toEqual(['22', '1,234 km']);
    expect(texts(doc, '.cover-top .eyebrow')).toEqual(['pdf.travelPlan']);
  });

  it('FE-PDFOVERVIEW-002: without a photo the cover is plain, and a hostile url cannot leave url()', () => {
    const plain = parse(coverHtml({ ...base, image: null, description: null, range: null }));
    expect(plain.querySelector('section')?.className).toBe('cover cover-plain');
    expect(plain.querySelector('.cover-bg')?.hasAttribute('style')).toBe(false);
    expect(plain.querySelector('.cover-desc')).toBeNull();
    expect(plain.querySelector('.cover-dates')).toBeNull();

    const hostile = parse(coverHtml({ ...base, image: "https://a/x.jpg');background:url('https://b/leak.jpg" }));
    const style = hostile.querySelector('.cover-bg')?.getAttribute('style') ?? '';
    expect(style.match(/url\(/g)).toHaveLength(1);
    expect(style).not.toContain("');");
  });
});

describe('the cover route and day band', () => {
  const base = { title: 'Japan', description: null, range: null, image: null, logo: null, stats: [], tr };

  it('FE-PDFOVERVIEW-006: the route is drawn day by day in its colours, the band has a segment per day', () => {
    const doc = parse(
      coverHtml({
        ...base,
        route: [
          {
            colour: '#ff0000',
            lines: [
              [
                [35.68, 139.76],
                [35.0, 135.77],
              ],
            ],
          },
          {
            colour: '#00ff00',
            lines: [
              [
                [35.0, 135.77],
                [34.69, 135.5],
              ],
            ],
          },
        ],
        ribbon: ['#ff0000', '#00ff00', '#0000ff'],
        ribbonEnds: ['Sun, Nov 1', 'Tue, Nov 3'],
      })
    );

    const coloured = [...doc.querySelectorAll('.cover-route-svg path[stroke]')].map((p) => p.getAttribute('stroke'));
    expect(coloured).toEqual(['#ff0000', '#00ff00']);
    expect(doc.querySelectorAll('.cover-route-glow path')).toHaveLength(2);
    expect(texts(doc, '.cover-route-lbl')).toEqual(['pdf.mapTitle']);
    expect(doc.querySelectorAll('.cover-ribbon span')).toHaveLength(3);
    expect(texts(doc, '.cover-ribbon-ends span')).toEqual(['Sun, Nov 1', 'Tue, Nov 3']);
    // Every point lands inside the drawing.
    const numbers = [...doc.querySelectorAll('.cover-route-svg path[stroke]')].flatMap((p) =>
      (p.getAttribute('d') ?? '').split(/[ML ]/).filter(Boolean).map(Number)
    );
    for (const n of numbers) expect(n).toBeGreaterThanOrEqual(0);
    for (const n of numbers) expect(n).toBeLessThanOrEqual(240);
  });

  it('FE-PDFOVERVIEW-007: nothing routed, one point or one spot draws no card, one day no band', () => {
    expect(coverRouteSvg([])).toBe('');
    expect(coverRouteSvg([{ colour: '#ff0000', lines: [[[1, 1]]] }])).toBe('');
    expect(
      coverRouteSvg([
        {
          colour: '#ff0000',
          lines: [
            [
              [1, 1],
              [1, 1],
            ],
          ],
        },
      ])
    ).toBe('');

    const doc = parse(coverHtml({ ...base, route: [], ribbon: ['#ff0000'], ribbonEnds: null }));
    expect(doc.querySelector('.cover-route')).toBeNull();
    expect(doc.querySelector('.cover-ribbon')).toBeNull();
  });

  it('FE-PDFOVERVIEW-008: a long road is thinned to a drawable number of points', () => {
    const road = Array.from({ length: 20000 }, (_, i) => [45 + i / 20000, 7 + i / 10000] as [number, number]);
    const svg = coverRouteSvg([{ colour: '#ff0000', lines: [road] }]);
    const d = /<path d="([^"]+)" stroke=/.exec(svg)?.[1] ?? '';
    expect(d.split('L').length).toBeLessThanOrEqual(1700);
  });
});

describe('glanceHtml', () => {
  const row = (over: Partial<GlanceRow> = {}): GlanceRow => ({
    number: 1,
    colour: '#0a84ff',
    date: 'Sun, Nov 1',
    title: 'Tokyo',
    stops: 3,
    stay: 'Hotel Gracery',
    cost: null,
    ...over,
  });

  it('FE-PDFOVERVIEW-003: one row per day in its colour, the cost column only when a day has one', () => {
    const without = parse(glanceHtml([row(), row({ number: 2, stops: 0 })], tr));
    expect(texts(without, 'thead th')).toEqual(['pdf.day', 'common.date', 'pdf.plan', 'pdf.stay', '']);
    expect(texts(without, 'tbody tr:first-child td')).toEqual(['1', 'Sun, Nov 1', 'Tokyo', 'Hotel Gracery', '3']);
    // A day without stops leaves the cell empty rather than printing a zero.
    expect(texts(without, 'tbody tr:last-child td').at(-1)).toBe('');
    expect(without.querySelector('tbody tr')?.getAttribute('style')).toBe('--day:#0a84ff');

    const withCost = parse(glanceHtml([row(), row({ number: 2, cost: '¥3,000' })], tr));
    expect(texts(withCost, 'thead th').at(-1)).toBe('pdf.costLabel');
    expect(texts(withCost, 'tbody tr:last-child td').at(-1)).toBe('¥3,000');

    expect(glanceHtml([], tr)).toBe('');
  });
});

describe('ledgerHtml', () => {
  it('FE-PDFOVERVIEW-004: each booking and stay with its date and the code to show', () => {
    const rows: LedgerRow[] = [
      {
        icon: '<svg></svg>',
        tint: '#3b82f6',
        title: 'LH716 <FRA>',
        sub: '<span>FRA → HND</span>',
        when: 'Sat, Oct 31',
        code: 'ABC123',
      },
      {
        icon: '<svg></svg>',
        tint: '#17171c',
        title: 'Hotel Gracery',
        sub: '',
        when: 'Sun, Nov 1 – Wed, Nov 4',
        code: null,
      },
    ];
    const doc = parse(ledgerHtml(rows, tr));

    expect(texts(doc, '.sec-title')).toEqual(['pdf.bookings']);
    expect(texts(doc, '.ledger-title')).toEqual(['LH716 <FRA>', 'Hotel Gracery']);
    expect(texts(doc, '.ledger-sub')).toEqual(['FRA → HND']);
    expect(texts(doc, '.ledger-when .code-chip')).toEqual(['ABC123']);
    expect(doc.querySelectorAll('.ledger-when')[1]?.textContent).toBe('Sun, Nov 1 – Wed, Nov 4');
    expect(doc.querySelectorAll('.code-chip')).toHaveLength(1);
    expect(doc.querySelector('.ledger-row')?.getAttribute('style')).toBe('--kind:#3b82f6');
  });

  it('FE-PDFOVERVIEW-005: a trip without bookings or stays prints no list at all', () => {
    expect(ledgerHtml([], tr)).toBe('');
  });
});
