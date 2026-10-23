import { designBook } from '../design/design-book';
import type { JourneyStats } from '../journey-stats.schema';
import { autoEntriesWithStops, buildBook, distributeGallery, emptyBook, relayoutSpread } from './auto-book';
import type { AutoEntry, AutoInput, AutoPhoto } from './auto-types';

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The auto layout moved here from the Studio still lays a journey out exactly
 * as the Studio's own copy did.
 *
 * `auto-layout.parity.json` holds a digest of every result the old client
 * functions gave on the three journeys in `auto-layout.parity-inputs.json`:
 * every spread of `buildBook` with the drawn templates and with none, every
 * entry spread laid out again, the empty book, the gallery shared out, and the
 * stops matched to the entries. Taken from the client code before it was
 * deleted. Ids the call mints are random and read as `#new`. A deliberate
 * change to a layout changes its digests: say so in the change and write the
 * new ones.
 */

interface Fixture {
  input: AutoInput;
  gallery?: AutoPhoto[];
}

const here = (file: string) => fileURLToPath(new URL(file, import.meta.url));
const fixtures = JSON.parse(readFileSync(here('./auto-layout.parity-inputs.json'), 'utf8')) as Record<string, Fixture>;
const expected = JSON.parse(readFileSync(here('./auto-layout.parity.json'), 'utf8')) as Record<string, string>;

function canonical(value: unknown): string {
  const walk = (v: unknown, key?: string): unknown => {
    if (Array.isArray(v)) return v.map((x) => walk(x));
    if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>;
      return Object.fromEntries(
        Object.keys(o)
          .sort()
          .map((k) => [k, walk(o[k], k)]),
      );
    }
    if (key === 'id' && typeof v === 'string') return '#new';
    return v;
  };
  return JSON.stringify(walk(value));
}

const digest = (v: unknown) => createHash('sha256').update(canonical(v)).digest('hex').slice(0, 16);

/** An entry as the journey has it, before the stops are matched to it. */
const bare = (e: AutoEntry): AutoEntry => ({
  id: e.id,
  title: e.title,
  story: e.story,
  location: e.location,
  date: e.date,
  photos: e.photos,
});

function cases(): Map<string, string> {
  const out = new Map<string, string>();
  for (const [name, fx] of Object.entries(fixtures)) {
    const put = (key: string, v: unknown) => out.set(`${name}/${key}`, digest(v));
    put('stops', autoEntriesWithStops(fx.input.entries.map(bare), fx.input.stats));
    const entries = fx.gallery ? distributeGallery(fx.input.entries, fx.gallery) : fx.input.entries;
    if (fx.gallery) put('distribute', entries);
    const input = { ...fx.input, entries };
    put('empty', emptyBook(input));
    const layouts = (tag: string, templates: AutoInput['templates']) => {
      const run = { ...input, templates };
      const doc = buildBook(run);
      put(`${tag}/head`, { version: doc.version, title: doc.title, page: doc.page, count: doc.spreads.length });
      doc.spreads.forEach((s, i) => {
        put(`${tag}/spread/${i}`, s);
        const again = relayoutSpread(s, run);
        if (again) put(`${tag}/relayout/${i}`, again);
      });
    };
    // With the drawn templates, and with none: the layouts written as code.
    layouts('full', undefined);
    layouts('plain', []);
  }
  return out;
}

describe('the auto layout moved from the Studio', () => {
  const actual = cases();

  it('AUTOPAR-001: covers the same cases the client code was measured on', () => {
    expect([...actual.keys()].sort()).toEqual(Object.keys(expected).sort());
    expect(actual.size).toBeGreaterThan(100);
  });

  it('AUTOPAR-002: lays out every fixture journey exactly as the client code did', () => {
    const differ = [...actual].filter(([key, value]) => expected[key] !== value).map(([key]) => key);
    expect(differ).toEqual([]);
  });

  it('AUTOPAR-003: mints its ids with the function it is given', () => {
    let n = 0;
    const fx = fixtures.A as Fixture;
    const doc = buildBook({ ...fx.input, newId: (p) => `${p}-c${++n}` });
    const ids = doc.spreads.flatMap((s) => [s.id, ...s.elements.map((e) => e.id)]);
    expect(ids.every((id) => /-c\d+$/.test(id))).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('AUTOPAR-004: counts the day of an entry in calendar days, a change to summer time between', () => {
    const stats: JourneyStats = {
      journeyId: 1,
      distance: 0,
      days: 10,
      steps: 1,
      photos: 0,
      places: 1,
      furthest: 0,
      countries: [],
      points: [],
      trips: [],
      excluded: [],
      start: '2026-03-27',
      end: '2026-04-05',
    };
    const entry: AutoEntry = {
      id: 1,
      title: 'Spring',
      story: null,
      location: null,
      date: '2026-03-30',
      photos: [],
      lat: null,
      lng: null,
      country: null,
      dayNumber: null,
      dayCount: null,
      pros: [],
      cons: [],
    };
    expect(autoEntriesWithStops([entry], stats)[0]).toMatchObject({ dayNumber: 4, dayCount: 10 });
  });

  it('AUTOPAR-010: the classic design is the Auto layout, page for page', () => {
    for (const [name, fx] of Object.entries(fixtures)) {
      const input = { ...fx.input, gallery: fx.gallery, candidates: [], photos: [] };
      const result = designBook(null, input, { style: 'classic' });
      const doc = result.doc;
      const head = { version: doc.version, title: doc.title, page: doc.page, count: doc.spreads.length };
      expect(digest(head)).toBe(expected[`${name}/full/head`]);
      doc.spreads.forEach((s, i) => expect(digest(s)).toBe(expected[`${name}/full/spread/${i}`]));
      expect(result.plan.map((r) => r.action).every((a) => a === 'insert')).toBe(true);
    }
  });
});
