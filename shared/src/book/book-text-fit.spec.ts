import { bookLetterMm, textHeightNeeded } from './book-findings';
import { blankBook } from './book-pages';
import {
  bookCasedText,
  bookDrawnLines,
  bookTextFits,
  bookTextRunMm,
  fitBookTexts,
  fitSpreadTexts,
  solveBookTextFit,
} from './book-text-fit';
import { bookTextElementSchema, type BookSpread, type BookTextElement } from './book.schema';

import { describe, expect, it } from 'vitest';

/** Text set to fit its frame: solved on edit, stored in `size`, the choice kept in `fitMax`. */

const text = (over: Record<string, unknown> = {}): BookTextElement =>
  bookTextElementSchema.parse({
    id: 't1',
    kind: 'text',
    frame: { x: 0, y: 0, w: 80, h: 20 },
    text: 'Lisbon',
    size: 40,
    leading: 1,
    ...over,
  });

const spreadOf = (...elements: BookTextElement[]): BookSpread => ({
  id: 'sp',
  role: 'inner',
  background: null,
  elements,
  parked: [],
  entryId: null,
});

describe('how a text is cased and lined up for drawing', () => {
  it('BKFIT-001: cases the words as the page shows them, and joins a curved text into one line', () => {
    expect(bookCasedText({ text: 'Rua Augusta', transform: 'upper' })).toBe('RUA AUGUSTA');
    expect(bookCasedText({ text: 'Rua Augusta', transform: 'lower' })).toBe('rua augusta');
    expect(bookCasedText({ text: 'Rua Augusta', transform: 'smallcaps' })).toBe('Rua Augusta');
    expect(bookDrawnLines({ text: 'One\n\nTwo  ' })).toEqual(['One', '', 'Two']);
    expect(bookDrawnLines({ text: 'One\n\nTwo', curve: { type: 'arc', bend: 10, start: 0 } })).toEqual(['One Two']);
  });
});

describe('the fit solver', () => {
  it('BKFIT-002: keeps the chosen size when the words hold the frame at it', () => {
    const el = text({ size: 20 });
    expect(bookTextFits(el)).toBe(true);
    expect(solveBookTextFit(el)).toBe(20);
  });

  it('BKFIT-003: finds the largest quarter point that holds a frame too small, and the overflow check agrees', () => {
    const el = text({ text: 'Two weeks along the Portuguese coast', size: 60 });
    expect(bookTextFits(el)).toBe(false);
    const size = solveBookTextFit(el);
    expect(size).toBeLessThan(60);
    expect(size * 4).toBe(Math.round(size * 4));
    expect(bookTextFits({ ...el, size })).toBe(true);
    expect(bookTextFits({ ...el, size: size + 0.25 })).toBe(false);
    expect(textHeightNeeded({ ...el, size })).toBeLessThanOrEqual(el.frame.h * 1.02);
  });

  it('BKFIT-004: never sets a word wider than its frame, even when the height would allow it', () => {
    const el = text({ text: 'Mediterranean', frame: { x: 0, y: 0, w: 40, h: 200 }, size: 80 });
    expect(solveBookTextFit(el)).toBeLessThan(20);
  });

  it('BKFIT-005: stops at the document floor of 4 pt', () => {
    const el = text({
      text: 'A very long sentence that will never fit in this small frame',
      frame: { x: 0, y: 0, w: 5, h: 2 },
    });
    expect(solveBookTextFit(el)).toBe(4);
  });

  it('BKFIT-006: measures a curved text along its curve and a photo-filled one by its widest line', () => {
    const curved = text({
      text: 'Postmark from Lisbon',
      curve: { type: 'circle', bend: 0, start: 0 },
      frame: { x: 0, y: 0, w: 60, h: 60 },
    });
    const size = solveBookTextFit(curved);
    expect(bookTextFits({ ...curved, size })).toBe(true);
    const filled = text({ text: 'LISBON\nPORTO', fillPaint: { type: 'photo', photoId: 2 }, size: 200 });
    expect(solveBookTextFit(filled)).toBeLessThan(200);
    expect(bookTextFits({ ...filled, text: '   ' })).toBe(true);
  });

  it('BKFIT-011: leaves room for type that sets wider than the average letter of its family', () => {
    const el = text({ text: 'Lisbon', frame: { x: 0, y: 0, w: 80, h: 200 }, size: 200 });
    const size = solveBookTextFit(el);
    const measured = bookTextRunMm({ ...el, size }, 'Lisbon');
    expect(measured * 1.08).toBeLessThanOrEqual(el.frame.w + 0.01);
    expect(measured * 1.08).toBeGreaterThan(el.frame.w * 0.97);
    expect(bookTextFits({ ...el, size, frame: { ...el.frame, w: measured } })).toBe(false);
  });
});

describe('fitting a page', () => {
  it('BKFIT-007: solves only the fitted texts and hands the same page back when nothing moved', () => {
    const plain = text({ id: 'plain', text: 'Two weeks along the Portuguese coast', size: 60 });
    const fit = text({ id: 'fit', text: 'Two weeks along the Portuguese coast', size: 60, fit: 'shrink' });
    const sp = spreadOf(plain, fit);
    const out = fitSpreadTexts(sp);
    expect(out.elements[0]).toBe(plain);
    const solved = out.elements[1] as BookTextElement;
    expect(solved.size).toBeLessThan(60);
    expect(solved.fitMax).toBe(60);
    expect(fitSpreadTexts(out)).toBe(out);
  });

  it('BKFIT-008: gives the words their size back when the frame grows again', () => {
    const fit = text({ text: 'Two weeks along the Portuguese coast', size: 60, fit: 'shrink' });
    const small = fitSpreadTexts(spreadOf(fit));
    const grown = small.elements.map((e) => ({ ...e, frame: { ...e.frame, w: 2000, h: 400 } })) as BookTextElement[];
    const back = fitSpreadTexts(spreadOf(...grown), small).elements[0] as BookTextElement;
    expect(back.size).toBe(60);
  });

  it('BKFIT-009: takes a size somebody set in the edit as the new choice', () => {
    const fit = fitSpreadTexts(spreadOf(text({ size: 20, fit: 'shrink' })));
    const chosen = fit.elements.map((e) => ({ ...e, size: 30 })) as BookTextElement[];
    const out = fitSpreadTexts(spreadOf(...chosen), fit).elements[0] as BookTextElement;
    expect(out.fitMax).toBe(30);
    expect(out.size).toBe(30);
  });

  it('BKFIT-010: fits only the spreads an edit touched, and keeps the document when nothing changed', () => {
    const doc = blankBook({ title: 'Lisbon', newId: (p) => `${p}-x` });
    expect(fitBookTexts(doc, doc)).toBe(doc);
    expect(fitBookTexts(doc, null)).toBe(doc);
    const fit = text({ text: 'Two weeks along the Portuguese coast', size: 60, fit: 'shrink' });
    const spreads = doc.spreads.map((sp, i) => (i === 0 ? { ...sp, elements: [fit] } : sp));
    const next = fitBookTexts({ ...doc, spreads }, doc);
    expect((next.spreads[0]?.elements[0] as BookTextElement).size).toBeLessThan(60);
    expect(next.spreads[1]).toBe(doc.spreads[1]);
  });

  it('BKFIT-011: a bold condensed face is measured at its own width, not the regular widened by a guess', () => {
    const oswald = (weight: number) => bookLetterMm(text({ font: 'oswald', weight, size: 20 }));
    // Oswald's 700 sets about 13% wider than its 400; a flat 6% would let a bold heading overrun its frame.
    expect(oswald(700) / oswald(400)).toBeGreaterThan(1.1);
    const vibes = (weight: number) => bookLetterMm(text({ font: 'vibes', weight, size: 20 }));
    expect(vibes(700) / vibes(400)).toBeCloseTo(1.06, 6);
  });
});
