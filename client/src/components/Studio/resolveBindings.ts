import type { BookDocument } from '@trek/shared'
import { MAX_TEXT_LENGTH } from '@trek/shared'
import { formatBookCoords, formatBookDate } from './entryText'

/**
 * Reading a book's bound text back out of the journey.
 *
 * The contract has promised this since the format was written — "a bound
 * element re-reads its source when the book is opened, so fixing a typo in the
 * journal fixes it in the book" — and until now nothing did it. An element
 * placed from the Entries tab carried a `binding` that only `applyTemplate`
 * ever looked at, so correcting an entry's title left every page that quoted it
 * showing the old words, while the inspector went on telling people the link
 * existed. This is that link.
 *
 * ── Three rules, all of them load-bearing ────────────────────────────────
 *
 * **A missing value never blanks a page.** An entry that has been deleted, a
 * title that has been cleared, a photo whose caption is gone: the element keeps
 * the words it has. Overwriting them with an empty string would turn a data
 * change in the journal into a hole in a printed book, and nobody would connect
 * the two.
 *
 * **`overridden` wins.** Editing the text in Studio is a decision, and after it
 * the journal stops being the source. That flag is set by the canvas editor and
 * by the inspector, and read here — its only reader.
 *
 * **A formatted source is only re-read when the fact behind it moved.** A title
 * is its own value, so comparing the words is enough. A date is not: the same
 * day is "28. Mai 2026" here and "MAY 28, 2026" on a page set in English and in
 * small caps, and a resolver that compared the words would rewrite every such
 * line the moment somebody with another language opened the book — and the two
 * of them would then take turns doing it to each other. So date and coordinate
 * bindings carry the raw value they were set from and are compared against
 * that. An element written before that field existed has none, and is left
 * exactly as it is.
 *
 * **Nothing changed means the same object.** Not an optimisation: `useBookStore`
 * recognises the document it has agreed with the server by identity, so a
 * resolver that always returned a fresh object would make every open count as
 * an edit, and the autosave would write the book back every time somebody
 * looked at it. Spreads and elements are shared through untouched, too.
 */

/**
 * What the journey can answer with.
 *
 * Declared structurally rather than imported from the sidebar: this module
 * knows about the journal, not about the panel that browses it, and the source
 * the editor already builds satisfies this shape as it is.
 */
export interface BindingSource {
  title: string
  subtitle: string | null
  entries: {
    id: number
    title: string | null
    story: string | null
    location: string | null
    date: string | null
    lat: number | null
    lng: number | null
  }[]
  photos: { photoId: number; caption?: string | null }[]
}

export function resolveBindings(doc: BookDocument, src: BindingSource, locale: string): BookDocument {
  let documentChanged = false

  const spreads = doc.spreads.map(spread => {
    let spreadChanged = false

    const elements = spread.elements.map(el => {
      if (el.kind !== 'text' || !el.binding || el.overridden) return el

      const next = resolveOne(el.binding, src, locale)
      // A journal entry has no length limit and a text element does. Written
      // back whole, a long story is a book the save route refuses — and the
      // editor can only report that as a book that will not save.
      const value = next?.text.slice(0, MAX_TEXT_LENGTH)
      // An empty answer is not an answer — see the first rule above. A journey
      // with no subtitle, an entry whose title has been cleared and a photo
      // that lost its caption all arrive here as an empty string, and none of
      // them is a reason to blank a line somebody has set.
      if (!next || !value || value === el.text) return el

      spreadChanged = true
      return next.value === undefined
        ? { ...el, text: value }
        : { ...el, text: value, binding: { ...el.binding, value: next.value } }
    })

    if (!spreadChanged) return spread
    documentChanged = true
    return { ...spread, elements }
  })

  return documentChanged ? { ...doc, spreads } : doc
}

type Binding = NonNullable<Extract<BookDocument['spreads'][number]['elements'][number], { kind: 'text' }>['binding']>

/** The words, and — for a formatted source — the fact they were made from. */
interface Resolved {
  text: string
  value?: string
}

function resolveOne(binding: Binding, src: BindingSource, locale: string): Resolved | null {
  if (binding.source === 'journey.title') return { text: src.title }
  if (binding.source === 'journey.subtitle') return { text: src.subtitle ?? '' }

  if (binding.source === 'photo.caption') {
    const photo = src.photos.find(p => p.photoId === binding.photoId)
    return { text: photo?.caption ?? '' }
  }

  const entry = src.entries.find(e => e.id === binding.entryId)
  if (!entry) return null

  switch (binding.source) {
    // The same fallback the layout and the template filler use: a stop nobody
    // has written about is known by where it is.
    case 'entry.title': return { text: entry.title || entry.location || '' }
    case 'entry.story': return { text: (entry.story || '').trim() }

    case 'entry.date':
      // No stored value means an element older than this machinery, or one the
      // layout composed a longer line from. Either way its words are not this
      // function's to rewrite.
      if (!binding.value || !entry.date || binding.value === entry.date) return null
      return { text: formatBookDate(entry.date, locale), value: entry.date }

    case 'entry.location': {
      // With a format it is the point, without one it is the place name. A
      // hand-built element from the auto layout has never been through Zod, so
      // the field is genuinely absent rather than defaulted.
      if (!binding.format) return { text: entry.location ?? '' }
      if (entry.lat == null || entry.lng == null) return null
      const value = coordValue(entry.lat, entry.lng)
      if (!binding.value || binding.value === value) return null
      return { text: formatBookCoords(entry.lat, entry.lng, binding.format), value }
    }

    default: return null
  }
}

/** What a point is, as one string, for the comparison above. */
export function coordValue(lat: number, lng: number): string {
  return `${lat},${lng}`
}
