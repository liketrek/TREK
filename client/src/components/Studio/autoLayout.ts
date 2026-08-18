import type { BookDocument, BookElement, BookPageSetup, BookSpread } from '@trek/shared'

/**
 * The auto mode: turn a journey into a book.
 *
 * The one rule that shapes everything else is that this produces an **ordinary
 * document**. There is no "auto layout" state that locks, no template engine
 * that re-runs behind the user's back — it lays the pages out once, and from
 * that moment every element is as editable as one dragged in by hand. That is
 * what makes an auto mode feel generous rather than restrictive.
 *
 * The colours in here are print ink, not app chrome, and deliberately do not
 * follow the user's theme: a book is printed once and read on paper, where an
 * accent colour chosen for a dark UI means nothing — and the renderer has no
 * theme to ask. Hence the theme-lint exemptions below.
 *
 * Templates are chosen by what the material actually is: how many photos the
 * entry has, whether they are portrait or landscape, how much story there is to
 * set. A page of three landscape photos wants a different grid than a page of
 * one portrait, and picking by shape is the difference between a book that looks
 * arranged and one that looks poured in.
 */

export interface AutoPhoto {
  photoId: number
  width: number | null
  height: number | null
  caption?: string | null
}

export interface AutoEntry {
  id: number
  title: string | null
  story: string | null
  location: string | null
  date: string | null
  photos: AutoPhoto[]
}

export interface AutoInput {
  /**
   * The app's language, not the browser's. A book whose captions are dated in
   * the reader's OS locale while the rest of it is written in the app's is a
   * mismatch nobody asked for.
   */
  locale: string
  title: string
  subtitle: string | null
  coverPhotoId: number | null
  entries: AutoEntry[]
  page: BookPageSetup
}

let seq = 0
const uid = (p: string) => `${p}-${(seq++).toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`

const isPortrait = (p: AutoPhoto) => (p.width && p.height ? p.height > p.width * 1.08 : false)
const isPano = (p: AutoPhoto) => (p.width && p.height ? p.width > p.height * 2 : false)

function text(
  frame: { x: number; y: number; w: number; h: number },
  value: string,
  opts: Partial<Extract<BookElement, { kind: 'text' }>> = {},
): BookElement {
  return {
    id: uid('t'),
    kind: 'text',
    frame,
    rotation: 0,
    opacity: 1,
    locked: false,
    text: value,
    font: 'sans',
    size: 11,
    weight: 400,
    italic: false,
    align: 'left',
    leading: 1.45,
    tracking: 0,
    color: '#1a1a1a', // theme-lint-disable — book ink, not app chrome
    binding: null,
    overridden: false,
    ...opts,
  } as BookElement
}

function photo(
  frame: { x: number; y: number; w: number; h: number },
  photoId: number,
  opts: Partial<Extract<BookElement, { kind: 'photo' }>> = {},
): BookElement {
  return {
    id: uid('p'),
    kind: 'photo',
    frame,
    rotation: 0,
    opacity: 1,
    locked: false,
    photoId,
    fit: 'cover',
    focalX: 0.5,
    focalY: 0.5,
    radius: 0,
    filter: 'none',
    ...opts,
  } as BookElement
}

function shape(
  frame: { x: number; y: number; w: number; h: number },
  fill: string | null,
  opts: Partial<Extract<BookElement, { kind: 'shape' }>> = {},
): BookElement {
  return {
    id: uid('s'),
    kind: 'shape',
    frame,
    rotation: 0,
    opacity: 1,
    locked: false,
    shape: 'rect',
    fill,
    gradient: 'none',
    stroke: null,
    strokeWidth: 0,
    radius: 0,
    ...opts,
  } as BookElement
}

function formatDate(iso: string | null, locale: string): string {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
}

/** A full-bleed frame: out past the trim on every side the page is cut on. */
function bleedFrame(page: BookPageSetup, spread: boolean) {
  const w = spread ? page.pageWidth * 2 : page.pageWidth
  return { x: -page.bleed, y: -page.bleed, w: w + page.bleed * 2, h: page.pageHeight + page.bleed * 2 }
}

function coverSpread(input: AutoInput): BookSpread {
  const { page } = input
  const m = 18
  const els: BookElement[] = []

  if (input.coverPhotoId != null) {
    els.push(photo(bleedFrame(page, false), input.coverPhotoId, { focalY: 0.42 }))
    // A scrim so the title survives whatever the photo does underneath it —
    // faded, not a flat panel, or it would cut the picture in half.
    els.push(shape(
      { x: -page.bleed, y: page.pageHeight * 0.38, w: page.pageWidth + page.bleed * 2, h: page.pageHeight * 0.62 + page.bleed },
      '#000000', // theme-lint-disable — book ink, not app chrome
      { opacity: 0.72, gradient: 'down' },
    ))
  }

  const light = input.coverPhotoId != null
  els.push(text(
    { x: m, y: page.pageHeight - m - 46, w: page.pageWidth - m * 2, h: 30 },
    input.title,
    {
      size: 34, weight: 700, leading: 1.05, tracking: -0.02,
      color: light ? '#ffffff' : '#111111', // theme-lint-disable — book ink, not app chrome
      binding: { source: 'journey.title' },
    },
  ))
  if (input.subtitle) {
    els.push(text(
      { x: m, y: page.pageHeight - m - 12, w: page.pageWidth - m * 2, h: 8 },
      input.subtitle,
      { size: 12, weight: 400, color: light ? '#ffffff' : '#444444', opacity: light ? 0.85 : 1, binding: { source: 'journey.subtitle' } }, // theme-lint-disable — book ink, not app chrome
    ))
  }

  return { id: uid('sp'), role: 'cover', background: input.coverPhotoId != null ? null : '#f4f2ee', elements: els, parked: [], entryId: null } // theme-lint-disable — book ink, not app chrome
}

/**
 * One entry, one spread. Which template depends on the material:
 * a panorama gets the width it needs, a portrait gets a tall column beside the
 * story, several photos get a grid, and no photos at all get a quiet text page
 * rather than an empty frame.
 */
function entrySpread(entry: AutoEntry, input: AutoInput): BookSpread {
  const { page } = input
  const W = page.pageWidth * 2
  const H = page.pageHeight
  const m = 16
  const gut = 6
  const els: BookElement[] = []

  const photos = entry.photos.slice(0, 5)
  const story = (entry.story || '').trim()
  const heading = entry.title || entry.location || ''
  const meta = [formatDate(entry.date, input.locale), entry.location].filter(Boolean).join('  ·  ')

  const pushHeading = (x: number, y: number, w: number) => {
    let cy = y
    if (meta) {
      els.push(text({ x, y: cy, w, h: 5 }, meta.toUpperCase(), {
        size: 7.5, weight: 600, tracking: 0.14, color: '#8a8578', // theme-lint-disable — book ink, not app chrome
        binding: { source: 'entry.date', entryId: entry.id },
      }))
      cy += 8
    }
    if (heading) {
      els.push(text({ x, y: cy, w, h: 12 }, heading, {
        size: 22, weight: 700, leading: 1.1, tracking: -0.02, color: '#141414', // theme-lint-disable — book ink, not app chrome
        binding: { source: 'entry.title', entryId: entry.id },
      }))
      cy += 16
    }
    return cy
  }

  if (photos.length === 0) {
    // A text page. Two columns, because a single 250mm line is unreadable.
    const cy = pushHeading(page.pageWidth * 0.5, m + 24, page.pageWidth - m)
    els.push(text({ x: page.pageWidth * 0.5, y: cy + 4, w: page.pageWidth * 0.5 - m, h: H - cy - m * 2 }, story, {
      size: 10.5, leading: 1.6, color: '#2a2a2a', // theme-lint-disable — book ink, not app chrome
      binding: { source: 'entry.story', entryId: entry.id },
    }))
    return { id: uid('sp'), role: 'inner', background: '#faf8f4', elements: els, parked: [], entryId: entry.id } // theme-lint-disable — book ink, not app chrome
  }

  const hero = photos[0]

  if (isPano(hero)) {
    // A panorama across the gutter, story beneath it.
    els.push(photo({ x: -page.bleed, y: -page.bleed, w: W + page.bleed * 2, h: H * 0.56 + page.bleed }, hero.photoId))
    const cy = pushHeading(m, H * 0.56 + 12, page.pageWidth - m * 2)
    if (story) {
      els.push(text({ x: m, y: cy + 2, w: page.pageWidth - m * 2, h: H - cy - m - 4 }, story, {
        size: 10, leading: 1.6, color: '#2a2a2a', // theme-lint-disable — book ink, not app chrome
        binding: { source: 'entry.story', entryId: entry.id },
      }))
    }
    const rest = photos.slice(1, 4)
    if (rest.length) {
      const cw = (page.pageWidth - m * 2 - gut * (rest.length - 1)) / rest.length
      rest.forEach((p, i) => {
        els.push(photo({ x: page.pageWidth + m + i * (cw + gut), y: H * 0.56 + 12, w: cw, h: H * 0.3 }, p.photoId))
      })
    }
    return { id: uid('sp'), role: 'inner', background: '#ffffff', elements: els, parked: [], entryId: entry.id } // theme-lint-disable — book ink, not app chrome
  }

  // The workhorse: hero photo bleeding off the outer edge of the left page,
  // story and the remaining photos on the right.
  //
  // It ends *exactly* on the gutter. A frame that overshoots the fold by a few
  // millimetres has no reading: it is neither a single-page picture nor one that
  // crosses the spread, and in the bound book that overhang disappears into the
  // spine anyway. Across the fold or up to it — never almost.
  els.push(photo(
    { x: -page.bleed, y: -page.bleed, w: page.pageWidth + page.bleed, h: H + page.bleed * 2 },
    hero.photoId,
    { focalX: isPortrait(hero) ? 0.5 : 0.55 },
  ))
  if (hero.caption) {
    els.push(text({ x: m, y: H - m - 6, w: page.pageWidth * 0.6, h: 5 }, hero.caption, {
      size: 7.5, weight: 500, color: '#ffffff', opacity: 0.9, // theme-lint-disable — book ink, not app chrome
      binding: { source: 'photo.caption', entryId: entry.id, photoId: hero.photoId },
    }))
  }

  const colX = page.pageWidth + m + 6
  const colW = page.pageWidth - m * 2 - 6
  const cy = pushHeading(colX, m + 18, colW)

  const rest = photos.slice(1, 4)
  const gridH = rest.length ? (rest.length === 1 ? H * 0.3 : H * 0.24) : 0
  const textH = H - cy - m - (gridH ? gridH + 10 : 0)

  if (story) {
    els.push(text({ x: colX, y: cy + 2, w: colW, h: Math.max(20, textH) }, story, {
      size: 10, leading: 1.62, color: '#2a2a2a', // theme-lint-disable — book ink, not app chrome
      binding: { source: 'entry.story', entryId: entry.id },
    }))
  }

  if (rest.length) {
    const cw = (colW - gut * (rest.length - 1)) / rest.length
    rest.forEach((p, i) => {
      els.push(photo({ x: colX + i * (cw + gut), y: H - m - gridH, w: cw, h: gridH }, p.photoId))
    })
  }

  return { id: uid('sp'), role: 'inner', background: '#ffffff', elements: els, parked: [], entryId: entry.id } // theme-lint-disable — book ink, not app chrome
}

/**
 * The back cover.
 *
 * A book that stops mid-page reads as unfinished, and a printer needs the
 * closing single page anyway — the cover sheet is one piece of card with a front
 * and a back. Quiet on purpose: the last thing a reader sees should be a full
 * stop, not another layout.
 */
function backSpread(input: AutoInput): BookSpread {
  const { page } = input
  const m = 18
  const els: BookElement[] = []

  const dates = input.entries
    .map(e => e.date)
    .filter((d): d is string => !!d)
    .sort()
  const span = dates.length
    ? [formatDate(dates[0], input.locale), formatDate(dates[dates.length - 1], input.locale)].filter(Boolean).join(' — ')
    : ''
  const places = new Set(input.entries.map(e => e.location).filter(Boolean)).size
  const photos = input.entries.reduce((n, e) => n + e.photos.length, 0)

  els.push(shape({ x: -page.bleed, y: -page.bleed, w: page.pageWidth + page.bleed * 2, h: page.pageHeight + page.bleed * 2 }, '#141414')) // theme-lint-disable — book ink, not app chrome

  els.push(text({ x: m, y: page.pageHeight * 0.5 - 16, w: page.pageWidth - m * 2, h: 12 }, input.title, {
    size: 15, weight: 600, align: 'center', color: '#ffffff', tracking: -0.01, // theme-lint-disable — book ink, not app chrome
    binding: { source: 'journey.title' },
  }))
  if (span) {
    els.push(text({ x: m, y: page.pageHeight * 0.5, w: page.pageWidth - m * 2, h: 6 }, span, {
      size: 8.5, align: 'center', color: '#ffffff', opacity: 0.55, // theme-lint-disable — book ink, not app chrome
    }))
  }
  const tally = [
    places ? `${places} Orte` : '',
    photos ? `${photos} Fotos` : '',
  ].filter(Boolean).join('   ·   ')
  if (tally) {
    els.push(text({ x: m, y: page.pageHeight * 0.5 + 10, w: page.pageWidth - m * 2, h: 6 }, tally.toUpperCase(), {
      size: 7, weight: 600, align: 'center', tracking: 0.16, color: '#ffffff', opacity: 0.4, // theme-lint-disable — book ink, not app chrome
    }))
  }

  return { id: uid('sp'), role: 'back', background: '#141414', elements: els, parked: [], entryId: null } // theme-lint-disable — book ink, not app chrome
}

export function buildBook(input: AutoInput): BookDocument {
  const spreads: BookSpread[] = [coverSpread(input)]
  for (const entry of input.entries) spreads.push(entrySpread(entry, input))
  spreads.push(backSpread(input))
  return {
    version: 1,
    title: input.title,
    page: input.page,
    spreads: spreads.slice(0, 150),
  }
}

/**
 * Hand the journey's loose gallery photos to the entries.
 *
 * Photos that already sit on an entry stay there. The rest are shared out in
 * order, so a book built from a journey whose pictures all live in the gallery
 * still gets pictures on its pages instead of a run of empty text spreads.
 */
export function distributeGallery(entries: AutoEntry[], gallery: AutoPhoto[]): AutoEntry[] {
  const taken = new Set(entries.flatMap(e => e.photos.map(p => p.photoId)))
  const loose = gallery.filter(p => !taken.has(p.photoId))
  if (!loose.length || !entries.length) return entries

  const per = Math.max(1, Math.floor(loose.length / entries.length))
  let i = 0
  return entries.map((e, idx) => {
    if (e.photos.length >= 4) return e
    const want = Math.min(4 - e.photos.length, idx === entries.length - 1 ? loose.length - i : per)
    const slice = loose.slice(i, i + Math.max(0, want))
    i += slice.length
    return { ...e, photos: [...e.photos, ...slice] }
  })
}
