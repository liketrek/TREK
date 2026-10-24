import { describe, expect, it } from 'vitest';

import type { BookSpread } from '@trek/shared';
import { bookSpreadSchema, journeyStatsSchema } from '@trek/shared';

import { pageKind, studioTemplateWords, templateTravel, templatesForSpread } from './templatesModel';

/**
 * What the Templates panel lays a page out with: which templates a page
 * takes, the words their empty roles take (the same the assistant's layout
 * gives), and the journey's figures for a template's map.
 */

const t = (k: string) => `[${k}]`;
const spread = (role: BookSpread['role'], entryId: number | null = null) =>
  bookSpreadSchema.parse({ id: `sp-${role}`, role, entryId, elements: [] });
const source = {
  title: 'Azores',
  subtitle: 'Nine islands in the Atlantic',
  entries: [{ id: 4, title: 'Sintra', story: 'Up through the fog.', location: 'Serra de Sintra', date: '2026-05-14' }],
};

describe('the templates a page takes', () => {
  it('takes the covers on every single page and the spreads on a double one', () => {
    for (const role of ['cover', 'first', 'last', 'back'] as const) expect(pageKind(spread(role))).toBe('single');
    expect(pageKind(spread('inner'))).toBe('inner');
    expect(templatesForSpread(spread('back'), 'all').every((tpl) => tpl.kind === 'single')).toBe(true);
    expect(templatesForSpread(spread('inner'), 'postcard').every((tpl) => tpl.archetype === 'postcard')).toBe(true);
  });
});

describe('the words of a template', () => {
  it("sets a cover in the book's title, the journey's when the book has none, and the journey's subtitle bound to it", () => {
    const own = studioTemplateWords('  Portugal ', spread('cover'), source, 'en');
    expect(own.title).toEqual({ text: 'Portugal' });
    expect(own.subtitle).toEqual({ text: 'Nine islands in the Atlantic', binding: { source: 'journey.subtitle' } });
    expect(own.date).toEqual({ text: '2026' });
    expect(studioTemplateWords('', spread('cover'), source, 'en').title).toEqual({ text: 'Azores' });
  });

  it('leaves a cover without a title when neither the book nor the journey has one, rather than a sample word', () => {
    const words = studioTemplateWords('', spread('cover'), { ...source, title: '', subtitle: null }, 'en');
    expect(words.title).toBeUndefined();
    expect(words.subtitle).toBeUndefined();
  });

  it('sets a page made from an entry in that entry, bound to it', () => {
    const words = studioTemplateWords('Portugal', spread('inner', 4), source, 'en');
    expect(words.title).toEqual({ text: 'Sintra', binding: { source: 'entry.title', entryId: 4 } });
    expect(words.date?.binding).toEqual({ source: 'entry.date', entryId: 4, value: '2026-05-14' });
    expect(studioTemplateWords('Portugal', spread('inner'), source, 'en')).toEqual({});
  });
});

describe('the journey of a template map', () => {
  it('has none while the figures load, and the travel words of the reader once they are in', () => {
    expect(templateTravel(null, [], 'en', t)).toBeNull();
    const stats = journeyStatsSchema.parse({
      journeyId: 1,
      distance: 1200,
      days: 3,
      steps: 2,
      photos: 0,
      places: 0,
      furthest: 900,
      countries: [],
      points: [],
      start: '2026-05-12',
      end: '2026-05-14',
    });
    const travel = templateTravel(stats, [[[38.7, -9.1]]], 'de', t);
    expect(travel).toMatchObject({ locale: 'de', stats, path: [[[38.7, -9.1]]], entries: [] });
    expect(travel?.labels).toEqual({
      day: '[journey.studio.day]',
      stations: '[journey.studio.stations]',
      summary: '[journey.studio.summary]',
      countries: '[journey.studio.countries]',
      distance: '[journey.studio.metric.distance]',
      pros: '[journey.editor.pros]',
      cons: '[journey.editor.cons]',
    });
  });
});
