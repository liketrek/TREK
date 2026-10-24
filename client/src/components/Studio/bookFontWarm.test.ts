import { act, renderHook } from '@testing-library/react';
import { blankBook, bookTextElementSchema, type BookDocument, type BookElement, type BookSpread } from '@trek/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useStudioStore } from '../../store/studioStore';
import { bookSample, faceSpec, useWarmBookFaces, warmBookFaces } from './bookFontWarm';

/**
 * The open book's faces go into the offline cache as it opens
 * (FE-STUDIO-FONTWARM): each face it uses is asked for once, with the book's
 * own characters, and a face that does not load costs nothing.
 */

const frame = { x: 10, y: 10, w: 80, h: 20 };
const text = (id: string, words: string, over: Record<string, unknown> = {}) =>
  bookTextElementSchema.parse({ id, kind: 'text', frame, text: words, ...over }) as BookElement;

function book(elements: BookElement[]): BookDocument {
  const doc = blankBook({ title: 'Kraków', newId: (p) => `${p}-x` });
  const [cover, ...rest] = doc.spreads as [BookSpread, ...BookSpread[]];
  return { ...doc, spreads: [{ ...cover, elements }, ...rest] };
}

afterEach(() => {
  useStudioStore.setState({ doc: null });
});

describe('the faces of a book', () => {
  it('FE-STUDIO-FONTWARM-001: samples each character of the book once, the title and the figures with it', () => {
    const sample = bookSample(book([text('t1', 'Łódź Łódź'), text('t2', '  ')]));
    expect(sample).toContain('Ł');
    expect(sample).toContain('ó');
    expect(sample).toContain('K');
    expect(sample.startsWith('0123456789')).toBe(true);
    expect(new Set(sample).size).toBe(sample.length);
    expect(sample).not.toContain(' ');
  });

  it('FE-STUDIO-FONTWARM-002: names a face the way document.fonts reads it', () => {
    expect(faceSpec({ font: 'serif', weight: 700, italic: true })).toBe('italic 700 16px "Lora"');
    expect(faceSpec({ font: 'caveat', weight: 400, italic: false })).toBe('400 16px "Caveat"');
  });

  it('FE-STUDIO-FONTWARM-003: asks for every face once, counts the ones that loaded and never rejects', async () => {
    const doc = book([
      text('t1', 'Porto', { font: 'caveat', weight: 700 }),
      text('t2', 'Douro', { font: 'serif', italic: true }),
    ]);
    const load = vi.fn(async (spec: string, _text?: string) => (spec.includes('Caveat') ? [{} as FontFace] : []));
    expect(await warmBookFaces(doc, { load })).toBe(1);
    const specs = load.mock.calls.map(([spec]) => spec);
    expect(specs).toEqual(expect.arrayContaining(['700 16px "Caveat"', 'italic 400 16px "Lora"']));
    expect(load.mock.calls[0]?.[1]).toContain('P');

    const broken = vi.fn(async () => {
      throw new Error('offline');
    });
    expect(await warmBookFaces(doc, { load: broken })).toBe(0);
    expect(await warmBookFaces(doc, undefined)).toBe(0);
  });

  it('FE-STUDIO-FONTWARM-004: warms when the set of faces changes, not on every edit of the words', async () => {
    const load = vi.fn(async () => [] as FontFace[]);
    Object.defineProperty(document, 'fonts', { configurable: true, value: { load } });
    const doc = book([text('t1', 'Porto', { font: 'anton' })]);
    act(() => useStudioStore.setState({ doc }));
    renderHook(() => useWarmBookFaces());
    await act(async () => {});
    const first = load.mock.calls.length;
    expect(first).toBeGreaterThan(0);

    const retyped = book([text('t1', 'Porto, again', { font: 'anton' })]);
    await act(async () => useStudioStore.setState({ doc: retyped }));
    expect(load.mock.calls.length).toBe(first);

    const another = book([text('t1', 'Porto', { font: 'anton' }), text('t2', 'Lisboa', { font: 'vibes' })]);
    await act(async () => useStudioStore.setState({ doc: another }));
    expect(load.mock.calls.length).toBeGreaterThan(first);
  });
});
