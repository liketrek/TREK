import {
  MAX_SPREAD_ELEMENTS,
  bookBadgeElementSchema,
  bookIconElementSchema,
  bookSpreadSchema,
  bookStatsElementSchema,
  bookTextElementSchema,
  normalizeBookDocument,
} from './book.schema';

import { describe, expect, it } from 'vitest';

/**
 * What a stored book is allowed to be, checked from the side that has to cope
 * with somebody else's data.
 *
 * Every book is read back through `normalizeBookDocument`: the editor calls it
 * when it opens one, and the server calls it on the way in and again on the way
 * out. So an element this contract cannot read is not a decoration that quietly
 * goes missing, it is a book that opens blank and is then saved back blank.
 * That is precisely what a mood mark did while badge codes were capped at two
 * characters, which is why most of what follows asks what happened to the rest
 * of the document rather than whether the bad element parsed.
 *
 * The narrower cases pin the fields the entry chips and the icon element added,
 * in the shape old documents turn up in, which is without them.
 */

const frame = { x: 12, y: 18, w: 60, h: 40 };

const text = (over: Record<string, unknown> = {}) => ({ id: 't1', kind: 'text', frame, ...over });
const badge = (over: Record<string, unknown> = {}) => ({ id: 'b1', kind: 'badge', frame, ...over });
const icon = (over: Record<string, unknown> = {}) => ({ id: 'i1', kind: 'icon', frame, name: 'Compass', ...over });

/** An element with a `kind` no version of the contract has ever known. */
const unreadable = { id: 'x1', kind: 'sticker', frame };

const doc = (elements: unknown[], parked: unknown[] = []) => ({
  version: 1,
  title: 'Iceland, end to end',
  page: { preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5 },
  spreads: [{ id: 's1', role: 'inner', background: null, entryId: 4, elements, parked }],
});

describe('a text element bound to the journey', () => {
  it('carries the notation a coordinate chip was set in, and the value it read', () => {
    const dms = bookTextElementSchema.parse(
      text({ binding: { source: 'entry.location', entryId: 7, format: 'dms', value: '64.1466,-21.9426' } }),
    );
    expect(dms.binding!.format).toBe('dms');
    expect(dms.binding!.value).toBe('64.1466,-21.9426');

    const decimal = bookTextElementSchema.parse(
      text({ binding: { source: 'entry.location', entryId: 7, format: 'decimal' } }),
    );
    expect(decimal.binding!.format).toBe('decimal');
  });

  it('refuses a notation nothing knows how to set the coordinates in', () => {
    const parsed = bookTextElementSchema.safeParse(text({ binding: { source: 'entry.location', format: 'utm' } }));
    expect(parsed.success).toBe(false);
  });

  it('leaves both keys off a binding written before they existed', () => {
    const parsed = bookTextElementSchema.parse(text({ binding: { source: 'entry.date', entryId: 7 } }));
    expect(parsed.binding!.source).toBe('entry.date');
    // Absent has to stay absent, because absent is the answer to both
    // questions: the place as the journal writes it, and a date the resolver
    // must leave exactly as somebody set it.
    expect('format' in parsed.binding!).toBe(false);
    expect('value' in parsed.binding!).toBe(false);
  });
});

describe('the icon element', () => {
  it('defaults its colour and its weight so a name is enough to place one', () => {
    const parsed = bookIconElementSchema.parse(icon());
    expect(parsed.name).toBe('Compass');
    expect(parsed.color).toBe('#111827');
    expect(parsed.lineWidth).toBe(2);
  });

  it('keeps a chosen weight and holds it to the drawable range', () => {
    expect(bookIconElementSchema.parse(icon({ lineWidth: 0.75 })).lineWidth).toBe(0.75);
    expect(bookIconElementSchema.safeParse(icon({ lineWidth: 0.1 })).success).toBe(false);
    expect(bookIconElementSchema.safeParse(icon({ lineWidth: 6 })).success).toBe(false);
  });

  it('takes a lucide export name and nothing that could not be one', () => {
    expect(bookIconElementSchema.safeParse(icon({ name: 'MountainSnow' })).success).toBe(true);
    expect(bookIconElementSchema.safeParse(icon({ name: 'compass' })).success).toBe(false);
    expect(bookIconElementSchema.safeParse(icon({ name: 'mountain-snow' })).success).toBe(false);
    expect(bookIconElementSchema.safeParse(icon({ name: '' })).success).toBe(false);
  });
});

describe('a badge code', () => {
  it('takes the journal key a mood or weather mark is drawn from', () => {
    expect(bookBadgeElementSchema.parse(badge({ variant: 'mood', code: 'amazing' })).code).toBe('amazing');
    expect(bookBadgeElementSchema.parse(badge({ variant: 'weather', code: 'partly' })).code).toBe('partly');
  });

  it('still takes a two-letter country code, which is what it was for', () => {
    expect(bookBadgeElementSchema.parse(badge({ variant: 'flag', code: 'IS' })).code).toBe('IS');
    expect(bookBadgeElementSchema.parse(badge({ variant: 'flag' })).code).toBeNull();
  });

  it('stops short of a code no mark could be keyed by', () => {
    expect(bookBadgeElementSchema.safeParse(badge({ code: 'x'.repeat(25) })).success).toBe(false);
  });

  it('keeps a whole book that has a mood mark on a page', () => {
    // The regression itself: this document refused to save, and the refusal
    // was answered with an empty book rather than with an error.
    const out = normalizeBookDocument(doc([badge({ variant: 'mood', code: 'amazing', text: 'Amazing' })]));
    expect(out.spreads[0]!.elements).toHaveLength(1);
    const mark = out.spreads[0]!.elements[0]!;
    expect(mark.kind === 'badge' && mark.code).toBe('amazing');
  });

  it('draws its icon and its words for a badge written before the switches existed', () => {
    const parsed = bookBadgeElementSchema.parse(badge({ variant: 'mood', code: 'good' }));
    expect(parsed.showIcon).toBe(true);
    expect(parsed.showLabel).toBe(true);
    expect(parsed.autoIconColor).toBe(true);
    expect(parsed.iconColor).toBe('#111111');
  });

  it('remembers a mark set to icon only in a chosen colour', () => {
    const parsed = bookBadgeElementSchema.parse(
      badge({ variant: 'mood', showLabel: false, autoIconColor: false, iconColor: '#c2410c' }),
    );
    expect(parsed.showIcon).toBe(true);
    expect(parsed.showLabel).toBe(false);
    expect(parsed.autoIconColor).toBe(false);
    expect(parsed.iconColor).toBe('#c2410c');
  });
});

describe('the figures a stats element carries', () => {
  const stats = (over: Record<string, unknown> = {}) => ({ id: 's1', kind: 'stats', frame, ...over });

  it('keeps the metrics it is drawn from', () => {
    const parsed = bookStatsElementSchema.parse(stats({ values: { distance: 1420000, days: 12 } }));
    expect(parsed.values).toEqual({ distance: 1420000, days: 12 });
  });

  it('drops a key no reader could ever index by, without failing the element', () => {
    // Dropped rather than rejected: a rejected stats element is stripped as
    // unreadable, which loses the page the figures were on.
    const parsed = bookStatsElementSchema.parse(stats({ values: { distance: 12, sneaky: 1, ['x'.repeat(5000)]: 2 } }));
    expect(parsed.values).toEqual({ distance: 12 });
  });
});

describe('normalizeBookDocument', () => {
  it('keeps the nine elements it can read when the tenth is from another version', () => {
    const nine = Array.from({ length: 9 }, (_, i) => text({ id: `t${i + 1}`, text: `line ${i + 1}` }));
    const out = normalizeBookDocument(doc([...nine, unreadable]));

    expect(out.title).toBe('Iceland, end to end');
    expect(out.spreads).toHaveLength(1);
    expect(out.spreads[0]!.entryId).toBe(4);
    expect(out.spreads[0]!.elements.map((el) => el.id)).toEqual(['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9']);
  });

  it('salvages the parked elements the same way it salvages the placed ones', () => {
    const out = normalizeBookDocument(doc([text({ id: 'kept' })], [text({ id: 'parked-kept' }), unreadable]));

    expect(out.spreads[0]!.elements.map((el) => el.id)).toEqual(['kept']);
    expect(out.spreads[0]!.parked.map((el) => el.id)).toEqual(['parked-kept']);
  });

  it('trims a spread of seventy elements to the cap rather than losing the spread', () => {
    const seventy = Array.from({ length: 70 }, (_, i) => text({ id: `t${i}` }));
    const out = normalizeBookDocument(doc(seventy));

    expect(out.spreads[0]!.elements).toHaveLength(MAX_SPREAD_ELEMENTS);
    // Back to front, so the ones that go are the ones on top.
    expect(out.spreads[0]!.elements[0]!.id).toBe('t0');
    expect(out.title).toBe('Iceland, end to end');
  });

  it('leaves a document it can read alone', () => {
    const input = doc([text({ id: 'a' }), badge({ id: 'b', variant: 'day', text: '5' })]);
    const out = normalizeBookDocument(input);

    expect(out.spreads[0]!.elements.map((el) => el.id)).toEqual(['a', 'b']);
    expect(out.page.pageWidth).toBe(210);
  });

  it('falls back to the preset for a page dimension nothing could be printed at', () => {
    // A page block that fails takes the whole document with it, and the empty
    // book that comes back is what the server then writes down. So each of
    // these degrades to its default and the spread survives.
    for (const bad of [0, -5, 1e12]) {
      const out = normalizeBookDocument({
        ...doc([text({ id: 'a' })]),
        page: { preset: 'square-210', pageWidth: bad, pageHeight: 210, bleed: 3, safe: 5 },
      });
      expect(out.page.pageWidth).toBe(210);
      expect(out.spreads[0]!.elements.map((el) => el.id)).toEqual(['a']);
    }

    const negativeBleed = normalizeBookDocument({
      ...doc([text({ id: 'a' })]),
      page: { preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: -3, safe: 5 },
    });
    expect(negativeBleed.page.bleed).toBe(3);
    expect(negativeBleed.spreads[0]!.elements).toHaveLength(1);
  });

  it('drops an element parked a kilometre off the spread rather than the book', () => {
    const out = normalizeBookDocument(doc([text({ id: 'a' }), text({ id: 'far', frame: { x: 1e9, y: 0, w: 60, h: 40 } })]));

    expect(out.spreads[0]!.elements.map((el) => el.id)).toEqual(['a']);
    expect(out.title).toBe('Iceland, end to end');
  });

  it('hands back an empty book for something that is not a document at all', () => {
    for (const junk of [undefined, null, 'a book, honestly', 42, [], { spreads: 'nope' }]) {
      const out = normalizeBookDocument(junk);
      expect(out.spreads).toEqual([]);
      expect(out.title).toBe('');
      expect(out.version).toBe(1);
    }
  });
});

describe('MAX_SPREAD_ELEMENTS', () => {
  it('is the cap both element arrays are held to, so neither can drift from it', () => {
    const many = (n: number) => Array.from({ length: n }, (_, i) => text({ id: `t${i}` }));

    expect(bookSpreadSchema.safeParse({ id: 's1', elements: many(MAX_SPREAD_ELEMENTS) }).success).toBe(true);
    expect(bookSpreadSchema.safeParse({ id: 's1', elements: many(MAX_SPREAD_ELEMENTS + 1) }).success).toBe(false);
    expect(bookSpreadSchema.safeParse({ id: 's1', parked: many(MAX_SPREAD_ELEMENTS) }).success).toBe(true);
    expect(bookSpreadSchema.safeParse({ id: 's1', parked: many(MAX_SPREAD_ELEMENTS + 1) }).success).toBe(false);
  });
});
