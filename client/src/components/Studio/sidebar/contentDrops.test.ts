import { bookPageSetupSchema, normalizeBookDocument } from '@trek/shared';
import { describe, expect, it } from 'vitest';

import { centred, markDrop, photoDrop, prosConsDrop, textDrop, type DropPlace } from './contentDrops';

/**
 * FE-STUDIO-DROPS-001 to FE-STUDIO-DROPS-005: what the Content panel drops on
 * a page, centred on the open page, sized for what it is, and readable by the
 * document contract afterwards.
 */

const page = bookPageSetupSchema.parse({ preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5 });
const spread: DropPlace = { page, single: false };
const cover: DropPlace = { page, single: true };

describe('the drops of the Content panel', () => {
  it('FE-STUDIO-DROPS-001: centres a frame across a spread, and on the one page of a cover', () => {
    expect(centred(spread, 100, 50)).toEqual({ x: 160, y: 80, w: 100, h: 50 });
    expect(centred(cover, 100, 50)).toEqual({ x: 55, y: 80, w: 100, h: 50 });
  });

  it('FE-STUDIO-DROPS-002: drops a photo in a 4:3 frame a little over half the page', () => {
    const el = photoDrop(spread, 12);
    expect(el).toMatchObject({ kind: 'photo', photoId: 12, fit: 'cover', focalX: 0.5, focalY: 0.5 });
    expect(el.frame.w).toBeCloseTo(115.5, 5);
    expect(el.frame.h).toBeCloseTo(115.5 * 0.75, 5);
    expect(el.frame.x + el.frame.w / 2).toBeCloseTo(210, 5);
  });

  it('FE-STUDIO-DROPS-003: keeps a text bound to its entry, with the fact behind formatted words', () => {
    const title = textDrop(spread, 'Bergen', { size: 22, weight: 700 }, { entryId: 7, source: 'entry.title' });
    expect(title).toMatchObject({
      kind: 'text',
      text: 'Bergen',
      size: 22,
      weight: 700,
      leading: 1.1,
      tracking: -0.02,
      binding: { source: 'entry.title', entryId: 7 },
      overridden: false,
    });
    expect(title.frame.w).toBe(178);
    const point = textDrop(
      spread,
      '60° N',
      { size: 8, weight: 700 },
      { entryId: 7, source: 'entry.location', format: 'dms', value: '60.39,5.32' },
      75.6
    );
    expect(point).toMatchObject({
      binding: { source: 'entry.location', entryId: 7, format: 'dms', value: '60.39,5.32' },
    });
    expect(point.frame.w).toBe(75.6);
    const story = textDrop(spread, 'A long day', { size: 10, weight: 400 }, { entryId: 7, source: 'entry.story' });
    expect(story).toMatchObject({ leading: 1.55, tracking: 0, binding: { source: 'entry.story', entryId: 7 } });
    expect(story.kind === 'text' && story.binding).not.toHaveProperty('format');
  });

  it('FE-STUDIO-DROPS-004: drops a mood mark with its code and words, and both columns of pros and cons', () => {
    expect(markDrop(spread, 'mood', 'good', 'Good')).toMatchObject({
      kind: 'badge',
      variant: 'mood',
      code: 'good',
      text: 'Good',
      showIcon: true,
      showLabel: true,
    });
    const list = prosConsDrop(spread, { pros: ['Warm'], cons: ['Late', 'Loud'] }, { pro: 'Pros', con: 'Cons' });
    expect(list).toMatchObject({
      kind: 'list',
      layout: 'columns',
      proLabel: 'Pros',
      conLabel: 'Cons',
      items: [
        { text: 'Warm', tone: 'pro' },
        { text: 'Late', tone: 'con' },
        { text: 'Loud', tone: 'con' },
      ],
    });
    // Tall enough for the longer column, never past most of the page.
    expect(list.frame.h).toBeCloseTo(6 * (0.86 + 1.7 * 2), 5);
    const long = prosConsDrop(
      spread,
      { pros: Array.from({ length: 40 }, (_, i) => `p${i}`), cons: [] },
      {
        pro: 'Pros',
        con: 'Cons',
      }
    );
    expect(long.frame.h).toBeCloseTo(210 * 0.6, 5);
  });

  it('FE-STUDIO-DROPS-005: drops what the document contract reads back whole', () => {
    const elements = [
      photoDrop(spread, 3),
      textDrop(spread, 'Bergen', { size: 22, weight: 700 }, { entryId: 7, source: 'entry.title' }),
      markDrop(spread, 'weather', 'sunny', 'Sunny'),
      prosConsDrop(spread, { pros: ['Warm'], cons: [] }, { pro: 'Pros', con: 'Cons' }),
    ];
    const doc = normalizeBookDocument({
      version: 1,
      title: 'T',
      page,
      spreads: [{ id: 'sp1', role: 'inner', entryId: null, background: null, elements, parked: [] }],
    });
    expect(doc.spreads[0]?.elements.map((e) => e.kind)).toEqual(['photo', 'text', 'badge', 'list']);
  });
});
