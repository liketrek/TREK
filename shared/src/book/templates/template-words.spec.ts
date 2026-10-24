import { bookSpreadSchema, bookTextElementSchema, type BookSpread, type BookTextElement } from '../book.schema';
import type { BookTemplateTextRole } from './template-format';
import { assignTemplateTexts, bookTemplateWords } from './template-words';

import { describe, expect, it } from 'vitest';

// TPLWORDS-001 to TPLWORDS-006

/**
 * Which of a page's words a template's roles take: the journal's bindings
 * first, then the largest type as the title, a line that says a date as the
 * date, a long text only as the story; and the words a role takes from the
 * book when the page has none.
 */

const text = (id: string, words: string, over: Partial<BookTextElement> = {}) =>
  bookTextElementSchema.parse({ id, kind: 'text', frame: { x: 0, y: 0, w: 100, h: 20 }, text: words, ...over });

const ALL = new Set<BookTemplateTextRole>(['title', 'subtitle', 'date', 'body', 'caption']);
const story = 'A long day on the water, from the harbour at first light to the islands and back. '.repeat(3);

const ids = (m: Map<BookTemplateTextRole, BookTextElement>) =>
  Object.fromEntries([...m].map(([role, el]) => [role, el.id]));

const page = (over: Partial<BookSpread>) => bookSpreadSchema.parse({ id: 'sp', ...over });

describe('the page words in the roles', () => {
  it('TPLWORDS-001: gives a bound text the role its source reads as, whatever its size', () => {
    const got = assignTemplateTexts(
      [
        text('loc', 'Hvar', { size: 40, binding: { source: 'entry.location', entryId: 1 } }),
        text('title', 'Islands', { size: 9, binding: { source: 'entry.title', entryId: 1 } }),
        text('day', 'Tuesday', { binding: { source: 'entry.date', entryId: 1 } }),
        text('cap', 'The harbour', { binding: { source: 'photo.caption', photoId: 3 } }),
      ],
      ALL,
    );
    expect(ids(got)).toEqual({ subtitle: 'loc', title: 'title', date: 'day', caption: 'cap' });
  });

  it('TPLWORDS-002: reads unbound words as a title, a date line and a story', () => {
    const got = assignTemplateTexts(
      [text('a', story), text('b', 'Croatia', { size: 30 }), text('c', '12.08.2025')],
      ALL,
    );
    expect(ids(got)).toEqual({ title: 'b', body: 'a', date: 'c' });
  });

  it('TPLWORDS-003: makes the first short line the title when nothing is set large, and a line without a date a subtitle', () => {
    const got = assignTemplateTexts([text('a', 'Split'), text('b', 'The old town')], ALL);
    expect(ids(got)).toEqual({ title: 'a', subtitle: 'b' });
  });

  it('TPLWORDS-004: never sets running text in a short role, and leaves out what no role takes', () => {
    const got = assignTemplateTexts([text('a', story), text('b', 'Croatia', { size: 30 })], new Set(['title', 'date']));
    expect(ids(got)).toEqual({ title: 'b' });
    const spare = assignTemplateTexts([text('a', 'One'), text('b', 'Two'), text('c', 'Three')], new Set(['title']));
    expect(ids(spare)).toEqual({ title: 'a' });
  });
});

describe('the book words for the roles a page has none for', () => {
  const entries = [
    { id: 4, title: 'Sintra', location: 'Serra de Sintra', date: '2026-05-14', story: 'Fog, then sun.' },
  ];

  it('TPLWORDS-005: sets a cover in the book title, the journey subtitle and the year of its first dated stop', () => {
    const words = bookTemplateWords(page({ role: 'cover' }), {
      bookTitle: '  Portugal  ',
      subtitle: 'Lisbon to the Algarve',
      locale: 'en',
      entries: [{ id: 1, date: null }, ...entries],
    });
    expect(words).toEqual({
      title: { text: 'Portugal' },
      subtitle: { text: 'Lisbon to the Algarve', binding: { source: 'journey.subtitle' } },
      date: { text: '2026' },
    });
    expect(bookTemplateWords(page({ role: 'back' }), { bookTitle: ' ', locale: 'en' })).toEqual({});
  });

  it('TPLWORDS-006: sets a page made from an entry in its words, bound to it, and a page from none in nothing', () => {
    const words = bookTemplateWords(page({ role: 'inner', entryId: 4 }), {
      bookTitle: 'Portugal',
      locale: 'en',
      entries,
    });
    expect(words.title).toEqual({ text: 'Sintra', binding: { source: 'entry.title', entryId: 4 } });
    expect(words.subtitle).toEqual({ text: 'Serra de Sintra', binding: { source: 'entry.location', entryId: 4 } });
    expect(words.date?.binding).toEqual({ source: 'entry.date', entryId: 4, value: '2026-05-14' });
    expect(words.date?.text).toMatch(/2026/);
    expect(words.body).toEqual({ text: 'Fog, then sun.', binding: { source: 'entry.story', entryId: 4 } });
    const placeOnly = bookTemplateWords(page({ role: 'inner', entryId: 5 }), {
      bookTitle: 'Portugal',
      locale: 'en',
      entries: [{ id: 5, title: null, location: 'Cascais', date: null, story: null }],
    });
    expect(placeOnly).toEqual({ title: { text: 'Cascais', binding: { source: 'entry.location', entryId: 5 } } });
    expect(bookTemplateWords(page({ role: 'inner' }), { bookTitle: 'Portugal', locale: 'en', entries })).toEqual({});
  });
});
