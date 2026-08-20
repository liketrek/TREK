import { describe, it, expect } from 'vitest'
import type { BookDocument, BookElement } from '@trek/shared'
import { normalizeBookDocument } from '@trek/shared'
import {
  resolveBindings, coordValue, type BindingSource,
} from '../../../src/components/Studio/resolveBindings'

/**
 * A bound element catching up with the journal (#1973).
 *
 * The contract has promised since the format was written that fixing a typo in
 * an entry fixes it in the book, and nothing did it: the words placed from the
 * Entries tab were a copy taken once. What is protected here is that the link
 * now works AND that it is not eager — a resolver that rewrote more than it
 * should would repaint pages people have already set, and because the editor
 * autosaves, it would write those repaints down.
 *
 * The identity assertion at the end is the one to keep. `useBookStore` decides
 * whether a document is an edit by comparing object references, so a resolver
 * that always returned a new object would turn opening a book into saving it.
 */

const source: BindingSource = {
  title: 'Iceland, all the way round',
  subtitle: 'Two weeks in June',
  entries: [{
    id: 7,
    title: 'The black beach',
    story: '  Wind, and then more wind.  ',
    location: 'Reynisfjara',
    date: '2026-06-12',
    lat: 63.4027,
    lng: -19.0448,
  }],
  photos: [{ photoId: 31, caption: 'Basalt columns' }],
}

const common = { rotation: 0, opacity: 1, locked: false, frame: { x: 10, y: 10, w: 80, h: 12 } }

function text(over: Record<string, unknown>): BookElement {
  return {
    ...common,
    id: 't1', kind: 'text', text: '', font: 'sans', size: 11, weight: 400, italic: false,
    align: 'left', leading: 1.45, tracking: 0, color: '#1a1a1a',
    binding: null, overridden: false, ...over,
  } as unknown as BookElement
}

function doc(elements: BookElement[]): BookDocument {
  return normalizeBookDocument({
    version: 1,
    title: 'A book',
    spreads: [{ id: 's1', role: 'inner', background: null, elements, parked: [], entryId: null }],
  })
}

const firstText = (d: BookDocument) => d.spreads[0].elements[0] as Extract<BookElement, { kind: 'text' }>

describe('what a bound element picks up', () => {
  it('takes the entry title someone has since corrected', () => {
    const before = doc([text({ text: 'TEST1', binding: { source: 'entry.title', entryId: 7 } })])
    expect(firstText(resolveBindings(before, source, 'en-GB')).text).toBe('The black beach')
  })

  it('takes the story, trimmed the way the layout trims it', () => {
    const before = doc([text({ text: 'old', binding: { source: 'entry.story', entryId: 7 } })])
    expect(firstText(resolveBindings(before, source, 'en-GB')).text).toBe('Wind, and then more wind.')
  })

  it('falls back to the place name for a stop nobody has titled', () => {
    const src = { ...source, entries: [{ ...source.entries[0], title: null }] }
    const before = doc([text({ text: 'old', binding: { source: 'entry.title', entryId: 7 } })])
    expect(firstText(resolveBindings(before, src, 'en-GB')).text).toBe('Reynisfjara')
  })

  it('follows a renamed journey on the cover', () => {
    const before = doc([text({ text: 'Untitled', binding: { source: 'journey.title' } })])
    expect(firstText(resolveBindings(before, source, 'en-GB')).text).toBe('Iceland, all the way round')
  })

  it('follows a photo caption', () => {
    const before = doc([text({ text: 'old', binding: { source: 'photo.caption', entryId: 7, photoId: 31 } })])
    expect(firstText(resolveBindings(before, source, 'en-GB')).text).toBe('Basalt columns')
  })
})

describe('what it refuses to touch', () => {
  it('leaves an element alone once a human has edited it', () => {
    const before = doc([text({
      text: 'My own words', overridden: true, binding: { source: 'entry.title', entryId: 7 },
    })])
    expect(resolveBindings(before, source, 'en-GB')).toBe(before)
  })

  /*
   * A journal entry that has been deleted must not take a page down with it.
   * Blanking the words would turn a change in the journal into a hole in a book
   * nobody would connect back to it.
   */
  it('leaves an element whose entry is gone', () => {
    const before = doc([text({ text: 'The black beach', binding: { source: 'entry.title', entryId: 999 } })])
    expect(resolveBindings(before, source, 'en-GB')).toBe(before)
  })

  it('leaves a heading standing when the title has been cleared', () => {
    const cleared = { ...source, entries: [{ ...source.entries[0], title: null, location: null }] }
    const before = doc([text({ text: 'A heading somebody set', binding: { source: 'entry.title', entryId: 7 } })])
    // The same element does follow a title that still exists, so the case
    // below is the empty answer being refused rather than nothing happening.
    expect(firstText(resolveBindings(before, source, 'en-GB')).text).toBe('The black beach')
    expect(resolveBindings(before, cleared, 'en-GB')).toBe(before)
  })
})

describe('a date, which is formatted rather than copied', () => {
  it('is left alone when the element predates the stored raw value', () => {
    // Every date in every book made so far is in this state, and most of them
    // are set in another language or in small caps by the auto layout. Reading
    // them would rewrite pages that are finished.
    const before = doc([text({ text: 'MAY 28, 2026', binding: { source: 'entry.date', entryId: 7 } })])
    expect(resolveBindings(before, source, 'de-DE')).toBe(before)
  })

  it('is left alone when the day has not moved, whatever language the reader has', () => {
    const before = doc([text({
      text: '12 June 2026',
      binding: { source: 'entry.date', entryId: 7, value: '2026-06-12' },
    })])
    expect(resolveBindings(before, source, 'de-DE')).toBe(before)
  })

  it('is re-set when the day itself moved', () => {
    const src = { ...source, entries: [{ ...source.entries[0], date: '2026-06-14' }] }
    const before = doc([text({
      text: '12 June 2026',
      binding: { source: 'entry.date', entryId: 7, value: '2026-06-12' },
    })])
    const after = firstText(resolveBindings(before, src, 'en-GB'))
    expect(after.text).toBe('14 June 2026')
    // And the raw value moves with it, or the next open would do it all again.
    expect(after.binding?.value).toBe('2026-06-14')
  })
})

describe('coordinates', () => {
  it('are re-set when the stop moved, in the format the element was placed with', () => {
    const src = { ...source, entries: [{ ...source.entries[0], lat: 64.1466, lng: -21.9426 }] }
    const before = doc([text({
      text: `63° 24' 10" S   19° 2' 41" W`,
      binding: {
        source: 'entry.location', entryId: 7, format: 'decimal', value: coordValue(63.4027, -19.0448),
      },
    })])
    const after = firstText(resolveBindings(before, src, 'en-GB'))
    expect(after.text).toBe('64.1466° N  21.9426° W')
    expect(after.binding?.value).toBe('64.1466,-21.9426')
  })

  it('are left alone when the stop has not moved', () => {
    const before = doc([text({
      text: 'anything at all',
      binding: {
        source: 'entry.location', entryId: 7, format: 'dms', value: coordValue(63.4027, -19.0448),
      },
    })])
    expect(resolveBindings(before, source, 'en-GB')).toBe(before)
  })

  /*
   * The same source without a format is the place *name* — that is what the
   * "Place" chip has always placed, and it is words rather than a reading, so
   * it follows the journal directly.
   */
  it('are not what an unformatted location binding means', () => {
    const before = doc([text({ text: 'Vík', binding: { source: 'entry.location', entryId: 7 } })])
    expect(firstText(resolveBindings(before, source, 'en-GB')).text).toBe('Reynisfjara')
  })
})

describe('the document it hands back', () => {
  it('is the very same object when nothing resolved differently', () => {
    const before = doc([
      text({ id: 't1', text: 'The black beach', binding: { source: 'entry.title', entryId: 7 } }),
      text({ id: 't2', text: 'Iceland, all the way round', binding: { source: 'journey.title' } }),
    ])
    expect(resolveBindings(before, source, 'en-GB')).toBe(before)
  })

  it('shares through every spread and element it did not change', () => {
    const before = normalizeBookDocument({
      version: 1,
      title: 'A book',
      spreads: [
        {
          id: 's1', role: 'inner', background: null, entryId: null, parked: [],
          elements: [text({ id: 'keep', text: 'Iceland, all the way round', binding: { source: 'journey.title' } })],
        },
        {
          id: 's2', role: 'inner', background: null, entryId: null, parked: [],
          elements: [text({ id: 'move', text: 'TEST1', binding: { source: 'entry.title', entryId: 7 } })],
        },
      ],
    })
    const after = resolveBindings(before, source, 'en-GB')
    expect(after).not.toBe(before)
    expect(after.spreads[0]).toBe(before.spreads[0])
    expect(after.spreads[1]).not.toBe(before.spreads[1])
  })
})
