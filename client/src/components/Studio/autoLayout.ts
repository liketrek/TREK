import type {
  BookDocument, BookElement, BookMetric, BookPageSetup, BookSpread, JourneyStats,
} from '@trek/shared'

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
  /**
   * What the journey adds up to. Null when the figures could not be fetched —
   * the book then simply has no summary pages rather than pages with nothing
   * on them.
   */
  stats: JourneyStats | null
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
    mask: null,
    frameStyle: 'none',
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

/**
 * Ink for the travel elements.
 *
 * A single warm accent against near-black, chosen once here so the summary
 * spread, the country page and the marks on the entries read as one book rather
 * than as three features that happen to share a document.
 */
const INK = '#1a1a1a' // theme-lint-disable — book ink, not app chrome
const ACCENT = '#c2410c' // theme-lint-disable — book ink, not app chrome

const travelBase = {
  rotation: 0,
  opacity: 1,
  locked: false,
  font: 'sans' as const,
  color: INK,
  accent: ACCENT,
  textScale: 1,
  stale: false,
}

function statsEl(
  frame: { x: number; y: number; w: number; h: number },
  stats: JourneyStats,
  metrics: BookMetric[],
  layout: 'grid' | 'row' | 'column' = 'grid',
  opts: Partial<Extract<BookElement, { kind: 'stats' }>> = {},
): BookElement {
  return {
    ...travelBase,
    id: uid('st'),
    kind: 'stats',
    frame,
    metrics,
    layout,
    showIcons: true,
    units: 'metric',
    values: {
      distance: stats.distance,
      days: stats.days,
      steps: stats.steps,
      photos: stats.photos,
      countries: stats.countries.length,
      places: stats.places,
      furthest: stats.furthest,
    },
    ...opts,
  } as BookElement
}

function mapEl(
  frame: { x: number; y: number; w: number; h: number },
  stats: JourneyStats,
  opts: Partial<Extract<BookElement, { kind: 'map' }>> = {},
): BookElement {
  return {
    ...travelBase,
    id: uid('mp'),
    kind: 'map',
    frame,
    style: 'minimal',
    showLand: true,
    showRoute: true,
    showPins: true,
    showLabels: false,
    countries: stats.countries.map(c => c.code),
    points: stats.points.map(pt => ({ lat: pt.lat, lng: pt.lng, label: pt.label })),
    ...opts,
  } as BookElement
}

function countriesEl(
  frame: { x: number; y: number; w: number; h: number },
  stats: JourneyStats,
  names: string[],
  opts: Partial<Extract<BookElement, { kind: 'countries' }>> = {},
): BookElement {
  return {
    ...travelBase,
    id: uid('co'),
    kind: 'countries',
    frame,
    codes: stats.countries.map(c => c.code),
    names,
    layout: 'list',
    showOutline: true,
    showFlag: false,
    showName: true,
    align: 'center',
    ...opts,
  } as BookElement
}

function badgeEl(
  frame: { x: number; y: number; w: number; h: number },
  variant: 'flag' | 'date' | 'day' | 'coords' | 'country' | 'distance',
  value: { text?: string; sub?: string; code?: string | null },
  opts: Partial<Extract<BookElement, { kind: 'badge' }>> = {},
): BookElement {
  return {
    ...travelBase,
    id: uid('bd'),
    kind: 'badge',
    frame,
    variant,
    text: value.text ?? '',
    sub: value.sub ?? '',
    code: value.code ?? null,
    style: 'plain',
    ...opts,
  } as BookElement
}

/**
 * The day of the month, set as a numeral with its month beneath.
 *
 * A date line reading "12 June 2026" is information; the same date as a figure
 * is a mark on the page. Travel books have set dates this way for as long as
 * they have existed, and it is the cheapest thing in this file that makes a
 * spread look composed.
 */
function dateMark(iso: string | null, locale: string, frame: { x: number; y: number; w: number; h: number }): BookElement | null {
  if (!iso) return null
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return null
  return badgeEl(frame, 'date', {
    text: String(d.getDate()),
    sub: d.toLocaleDateString(locale, { month: 'long' }).toUpperCase(),
  }, { style: 'stacked' })
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
    // A short accent rule above the date. One drawn element per entry, and the
    // cheapest thing in this file that makes a spread read as designed rather
    // than as text placed on a page — it gives the block a top edge to hang
    // from, which a line of grey capitals on white does not have.
    if (meta || heading) {
      els.push(shape({ x, y: cy - 6, w: Math.min(14, w * 0.18), h: 0.5 }, ACCENT))
    }
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
    /*
     * A text page — and the one spread with room to spare, since the left page
     * is otherwise blank. The date goes there as a numeral: large, quiet, and
     * the only thing on that page, which is what turns an entry with no
     * photographs from a gap in the book into a deliberate pause in it.
     */
    const mark = dateMark(entry.date, input.locale, {
      x: m + 6, y: H * 0.4, w: page.pageWidth * 0.42, h: H * 0.2,
    })
    if (mark) els.push(mark)

    // Two columns, because a single 250mm line is unreadable.
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
/**
 * The journey at a glance: the route drawn, and what it came to.
 *
 * This is the spread a travel book opens on and the one a photo album cannot
 * have — it is made entirely of facts the trip already carried. The map takes
 * the left page because a route is read before it is quantified, and the
 * figures sit on the right where the eye lands second.
 *
 * Omitted rather than left empty when there is nothing to draw: a journey whose
 * stops carry no coordinates has no route, and a page holding a blank frame
 * over the words "0 KM" is worse than no page.
 */
/**
 * Country names in the book's language.
 *
 * The API answers in English because it does not know who will read the book;
 * `Intl.DisplayNames` is the same CLDR data Atlas uses for regions, so a German
 * book says "Island" from the same two-letter code an English one reads as
 * "Iceland".
 */
function countryNames(input: AutoInput): string[] {
  const codes = input.stats?.countries ?? []
  let display: Intl.DisplayNames | null = null
  try {
    display = new Intl.DisplayNames([input.locale], { type: 'region' })
  } catch {
    display = null
  }
  return codes.map(c => display?.of(c.code.toUpperCase()) || c.name || c.code.toUpperCase())
}

function summarySpread(input: AutoInput): BookSpread | null {
  const stats = input.stats
  if (!stats) return null
  // Something has to be worth printing. One stop is a pin, not a journey.
  if (stats.points.length < 2 && !stats.distance && !stats.days) return null

  const { page } = input
  const W = page.pageWidth
  const H = page.pageHeight
  const m = 18
  const els: BookElement[] = []

  if (stats.points.length >= 2) {
    els.push(mapEl({ x: m, y: m, w: W - m * 2, h: H - m * 2 }, stats))
  }

  // Which figures are worth the space: everything the journey actually has.
  // A "0 PHOTOS" tile is a hole in a composition, not information.
  const metrics: BookMetric[] = ([
    ['distance', stats.distance],
    ['days', stats.days],
    ['steps', stats.steps],
    ['photos', stats.photos],
    ['countries', stats.countries.length],
    ['furthest', stats.furthest],
  ] as [BookMetric, number][])
    .filter(([, v]) => v > 0)
    .map(([k]) => k)
    .slice(0, 6)

  if (metrics.length) {
    els.push(statsEl(
      { x: W + m, y: H * 0.26, w: W - m * 2, h: H * 0.48 },
      stats,
      metrics,
      'grid',
    ))
  }

  // A hairline over the figures, the width of the text block — the one piece of
  // drawing on the page, and it is there to say the right-hand page is a
  // caption to the left-hand one rather than a second subject.
  els.push(shape(
    { x: W + m, y: H * 0.2, w: (W - m * 2) * 0.22, h: 0.4 },
    ACCENT,
  ))

  return { id: uid('sp'), role: 'inner', background: null, elements: els, parked: [], entryId: null }
}

/**
 * The countries, each name over its own outline.
 *
 * Only for a journey that crossed a border: one country listed on a page of its
 * own says nothing the cover did not already say. Polarsteps prints this page
 * and it is the single most recognisable thing in their books — a list of names
 * is a list, the same list over its silhouettes is a map of where you went.
 */
function countriesSpread(input: AutoInput, names: string[]): BookSpread | null {
  const stats = input.stats
  if (!stats || stats.countries.length < 2) return null

  const { page } = input
  const W = page.pageWidth
  const H = page.pageHeight
  const m = 20
  const rows = stats.countries.length
  // Tall enough to breathe, but never taller than the page it sits on.
  const height = Math.min(H - m * 2, Math.max(H * 0.4, rows * 26))

  return {
    id: uid('sp'),
    role: 'inner',
    background: null,
    elements: [
      countriesEl(
        { x: W + m, y: (H - height) / 2, w: W - m * 2, h: height },
        stats,
        names,
      ),
    ],
    parked: [],
    entryId: null,
  }
}

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
  /*
   * The closing tally, as a figures element rather than a built string.
   *
   * It used to be `${places} Orte` — German, hardcoded, in a book that follows
   * the app's language everywhere else. The element takes its labels from the
   * same translations as the rest of Studio, so the last page of a French book
   * is finally in French.
   */
  if (input.stats) {
    const closing: BookMetric[] = ([
      ['days', input.stats.days],
      ['places', input.stats.places || input.stats.steps],
      ['photos', input.stats.photos],
    ] as [BookMetric, number][])
      .filter(([, v]) => v > 0)
      .map(([k]) => k)

    if (closing.length) {
      els.push(statsEl(
        { x: m, y: page.pageHeight * 0.5 + 6, w: page.pageWidth - m * 2, h: 22 },
        input.stats,
        closing,
        'row',
        {
          showIcons: false,
          // Set against the dark card, and quiet: this is a full stop, not a
          // second summary page.
          color: '#ffffff', // theme-lint-disable — book ink, not app chrome
          accent: '#ffffff', // theme-lint-disable — book ink, not app chrome
          opacity: 0.55,
          textScale: 0.8,
        },
      ))
    }
  }

  return { id: uid('sp'), role: 'back', background: '#141414', elements: els, parked: [], entryId: null } // theme-lint-disable — book ink, not app chrome
}

export function buildBook(input: AutoInput): BookDocument {
  const spreads: BookSpread[] = [coverSpread(input)]

  /*
   * The summary and the countries open the book, before the entries.
   *
   * They are the answer to "where did you go", and a reader who has that
   * answer reads the entries as places on a route rather than as a sequence of
   * unrelated days. Both return null when the journey has nothing to say with
   * them, so a book is never padded with an empty page.
   */
  const summary = summarySpread(input)
  if (summary) spreads.push(summary)

  const countries = countriesSpread(input, countryNames(input))
  if (countries) spreads.push(countries)

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
