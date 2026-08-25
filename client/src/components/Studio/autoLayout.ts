import type {
  BookDocument, BookElement, BookMetric, BookPageSetup, BookSpread, JourneyStats,
} from '@trek/shared'
import { SPREAD_TEMPLATES } from './bookTemplates.data'
import { applyTemplate, templateFit } from './applyTemplate'
import { formatBookCoords, formatBookDate } from './entryText'

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
  /**
   * Where this stop is, when the journey's figures know.
   *
   * Filled from the stats points rather than carried on the entry: the entry
   * knows a place name, the stats know what that place resolved to. A page can
   * then print the flag, the country outline and the coordinates — which is
   * most of what makes a printed travel page look like one.
   */
  lat?: number | null
  lng?: number | null
  country?: string | null
  /** Which day of the journey this is, 1-based. Null when the dates do not say. */
  dayNumber?: number | null
  /** How many days the journey runs, for the progress rule along the foot. */
  dayCount?: number | null
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
  /**
   * The heading over a list of bare stops, already translated.
   *
   * Passed in rather than looked up: this module builds a document and has no
   * business reaching for a translation context — the same reason it takes the
   * locale instead of reading it.
   */
  stationsLabel: string
  /** The word before a day number on a chip — "DAY 5". Already translated. */
  dayLabel: string
  /**
   * The real geometry of the route, when the journey has any.
   *
   * GPX and KML imports are the only thing in TREK that stores an actual path
   * — every other route is a straight line between stops. The editor already
   * fetches it for the Travel panel; an auto-laid-out book used to hard-code an
   * empty array here and throw it away, which is why the one journey with a
   * recorded track still printed a map drawn with a ruler.
   */
  path?: [number, number][][]
  /** "TRIP SUMMARY" over the figures. */
  summaryLabel: string
  /** "COUNTRIES" over the outlines. */
  countriesLabel: string
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

/**
 * A picture, or the place one goes.
 *
 * `photoId` may be null: that is an empty frame, which the renderer draws as an
 * outline saying a photograph belongs here and which takes one by drag. A page
 * laid out with frames is a page somebody can finish; the same page with the
 * pictures simply left out is a page they have to design.
 */
function photo(
  frame: { x: number; y: number; w: number; h: number },
  photoId: number | null,
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
  // Ink, not the app's orange — see the note on `accent` in the contract.
  accent: INK,
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
    // The drawn line, for the same reason the panel places one: the contract
    // stays plain so old books do not change, and new books look like a book.
    routeStyle: 'drawn',
    routeArc: 'bow',
    routeDash: 'arcs',
    pinStyle: 'photo',
    countries: stats.countries.map(c => c.code),
    points: stats.points.map(pt => ({
      lat: pt.lat, lng: pt.lng, label: pt.label, photoId: pt.photoId ?? null,
    })),
    /*
     * The fields the contract would default for a parsed element, spelled out
     * because this one is cast. `path` in particular is read as an array while
     * the map draws, so leaving it out is not a cosmetic difference.
     */
    path: [],
    roads: [],
    fitPadding: 0.5,
    fitToCountries: true,
    clip: 'rect',
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
    // Built by hand rather than parsed, so the contract's defaults do not
    // apply: left out, a mark reads as having been given a colour, and a chip
    // draws its words in ink on an ink-coloured capsule.
    autoColor: true,
    showIcon: true,
    showLabel: true,
    autoIconColor: true,
    iconColor: INK,
    ...opts,
  } as BookElement
}

/**
 * ── The marks a printed travel page is made of ──────────────────────────
 *
 * Individually trivial: a flag beside a country's name, a line of coordinates
 * under a place, a chip saying which day this is, a rule along the foot with a
 * dot on it. Collectively they are the difference between a page that was
 * designed and a page that was filled in — which is the whole of what these
 * books look like, and none of it is expensive.
 */

/** A country's flag with its name beside it, the way a page opens. */
function flagRow(
  frame: { x: number; y: number; w: number; h: number },
  code: string | null,
  name: string,
): BookElement | null {
  if (!code && !name) return null
  // A badge centres what is in it, so the frame is cut to the words rather than
  // given the column: a flag floating in the middle of a text page reads as a
  // mistake, and there is no alignment on the badge contract to say otherwise.
  frame = { ...frame, w: Math.min(frame.w, 14 + name.length * 1.7) }
  return badgeEl(frame, 'flag', { text: name.toUpperCase(), code }, {
    style: 'plain',
    textScale: 0.85,
  })
}

/** Where on earth this is, set small under the name. */
function coordsMark(
  frame: { x: number; y: number; w: number; h: number },
  lat: number | null | undefined,
  lng: number | null | undefined,
): BookElement | null {
  if (lat == null || lng == null) return null
  return badgeEl(frame, 'coords', {
    text: formatBookCoords(lat, lng),
  }, { style: 'plain', textScale: 0.7 })
}

/** The "DAY 5" chip. Small, solid, and the only filled shape on most pages. */
function dayChip(
  frame: { x: number; y: number; w: number; h: number },
  day: number | null | undefined,
  label: string,
): BookElement | null {
  if (!day) return null
  return badgeEl(frame, 'day', { text: `${label} ${day}` }, { style: 'chip', textScale: 0.75 })
}

/**
 * A rule along the foot with a dot showing how far into the journey this is.
 *
 * Two elements and a division, and it turns a page from one of many into the
 * ninth of fourteen. Drawn rather than an element type of its own: it is a line
 * and a dot, and a new element kind for that would be a schema entry nobody
 * would ever set by hand.
 */
function progressRule(
  x: number,
  y: number,
  w: number,
  day: number | null | undefined,
  total: number | null | undefined,
): BookElement[] {
  if (!day || !total || total < 2) return []
  const t = Math.min(1, Math.max(0, (day - 1) / (total - 1)))
  const dot = 2.2
  return [
    shape({ x, y, w, h: 0.3 }, '#cfc9bd'), // theme-lint-disable — book ink, not app chrome
    shape({ x: x + w * t - dot / 2, y: y - dot / 2 + 0.15, w: dot, h: dot }, ACCENT, { shape: 'ellipse' }),
  ]
}

/**
 * The country's outline, printed pale behind everything else.
 *
 * Polarsteps puts it on every place page and it is why those pages read as
 * belonging to somewhere. Opacity rather than a lighter colour, so it sits
 * under the type on any paper colour.
 */
function countryWatermark(
  frame: { x: number; y: number; w: number; h: number },
  code: string | null | undefined,
): BookElement | null {
  if (!code) return null
  return {
    ...travelBase,
    id: uid('wm'),
    kind: 'countries',
    frame,
    codes: [code],
    names: [''],
    layout: 'column',
    showOutline: true,
    showFlag: false,
    showName: false,
    align: 'center',
    opacity: 0.1,
  } as BookElement
}

/** The stop on a small map of its own, the way an entry page opens. */
function placeMap(
  frame: { x: number; y: number; w: number; h: number },
  entry: AutoEntry,
  stats: JourneyStats | null,
): BookElement | null {
  if (entry.lat == null || entry.lng == null) return null
  return {
    ...travelBase,
    id: uid('mp'),
    kind: 'map',
    frame,
    points: [{ lat: entry.lat, lng: entry.lng, label: entry.location ?? '', photoId: null }],
    countries: entry.country ? [entry.country] : (stats?.countries.map(c => c.code) ?? []),
    style: 'minimal',
    source: 'vector',
    tileUrl: '',
    attribution: '',
    zoom: 5,
    // Deliberately the plain treatment: this is one dot on a country outline,
    // and a bowed casing around a single stop would be decoration.
    routeStyle: 'plain',
    routeArc: 'straight',
    routeDash: 'solid',
    pinStyle: 'dot',
    path: [],
    roads: [],
    fitPadding: 0.5,
    /*
     * This one is the "where in the world was this" mark beside an entry, so it
     * wants the country whole with a dot in it — the opposite of the route map,
     * which wants the trip.
     */
    fitToCountries: true,
    clip: 'rect',
    showLand: true,
    showRoute: false,
    showPins: true,
    showLabels: false,
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
/**
 * Whether an entry has anything to fill a spread with.
 *
 * A journey built from a trip starts out as one skeleton entry per stop:
 * a date, a place name, and nothing else. Each of those used to get a spread
 * of its own — a numeral on the left, a heading on the right and two-thirds of
 * a metre of empty paper. Ten stops made ten of them.
 */
function hasSubstance(entry: AutoEntry): boolean {
  return entry.photos.length > 0 || !!(entry.story || '').trim()
}

/** How many stations one page holds before the type gets too tight. */
const STATIONS_PER_PAGE = 13

/**
 * The stops that had nothing to say, as a list.
 *
 * Two columns of date and place, which is what an itinerary looks like in every
 * printed travel book ever bound — and which turns ten near-empty spreads into
 * one page that means something. Consecutive ones only, so the book stays in
 * the order it happened.
 */
function stationsSpread(entries: AutoEntry[], input: AutoInput, label: string): BookSpread {
  const { page } = input
  const W = page.pageWidth
  const H = page.pageHeight
  const m = 18
  const els: BookElement[] = []

  els.push(shape({ x: m, y: m + 12, w: 14, h: 0.5 }, ACCENT))
  els.push(text({ x: m, y: m + 18, w: W - m * 2, h: 8 }, label.toUpperCase(), {
    size: 8, weight: 600, tracking: 0.16, color: '#8a8578', // theme-lint-disable — book ink, not app chrome
  }))

  const columns: AutoEntry[][] = [
    entries.slice(0, STATIONS_PER_PAGE),
    entries.slice(STATIONS_PER_PAGE, STATIONS_PER_PAGE * 2),
  ]
  const top = m + 34
  const step = Math.min(13, (H - top - m) / Math.max(1, STATIONS_PER_PAGE))

  columns.forEach((column, side) => {
    const x = side * W + m
    const w = W - m * 2
    column.forEach((entry, i) => {
      const y = top + i * step
      const date = formatBookDate(entry.date, input.locale)
      if (date) {
        // Set in small caps, so the words on the page are not the words in the
        // journal — and a bound element has to hold exactly its source or
        // opening the book would quietly rewrite it. See resolveBindings.ts.
        els.push(text({ x, y, w: w * 0.32, h: 5 }, date.toUpperCase(), {
          size: 7, weight: 600, tracking: 0.1, color: '#a09a8e', // theme-lint-disable — book ink, not app chrome
        }))
      }
      const name = entry.title || entry.location || ''
      if (name) {
        els.push(text({ x: x + w * 0.34, y: y - 1.5, w: w * 0.66, h: 7 }, name, {
          size: 11, weight: 600, color: '#141414', // theme-lint-disable — book ink, not app chrome
          binding: { source: 'entry.title', entryId: entry.id },
        }))
      }
      // A hairline under each row, the way a printed itinerary rules its lines.
      els.push(shape({ x, y: y + step - 4.5, w, h: 0.15 }, '#ddd8cf')) // theme-lint-disable — book ink, not app chrome
    })
  })

  return {
    id: uid('sp'),
    role: 'inner',
    background: '#faf8f4', // theme-lint-disable — book ink, not app chrome
    elements: els,
    parked: [],
    entryId: null,
  }
}

/**
 * ── The entry spreads ────────────────────────────────────────────────────
 *
 * Five layouts rather than one, chosen by what the entry actually has and
 * alternating as the book goes on. A book where every spread is built the same
 * way reads as a template even when each page is fine on its own; the variety
 * is not decoration, it is what makes the thing look printed.
 *
 * Each of them is built from the same parts a person would reach for in the
 * editor — a flag, a country outline, a small map, a date numeral, a day chip,
 * a rule along the foot. That is deliberate: what the auto layout produces has
 * to be something you can take apart and rearrange, not a special case the
 * panels cannot make.
 */

/**
 * ── The panels ───────────────────────────────────────────────────────────
 *
 * The thing the first version of this file was missing.
 *
 * A printed travel book is not photographs on paper with captions: it is
 * built out of *areas* — a page laid solid in ink with pale type on it, a band
 * down the outer edge, a picture that overruns the panel it sits against, a
 * box ruled around a block of text. Those areas are what carry the design, and
 * every one of them is a rectangle with a fill, drawn before the things that
 * sit on top of it.
 *
 * Which is all layering is: the document paints in array order, so a panel
 * pushed first is a panel everything else lands on. Nothing here needs a
 * feature the editor does not already have — it needed using.
 */

/** Near-black with a blue cast, the colour these books lay a page in. */
const PANEL_INK = '#12161d' // theme-lint-disable — book ink, not app chrome

/** Type on a panel, and the paper colour of the quiet pages. */
const PANEL_TYPE = '#f2efe9' // theme-lint-disable — book ink, not app chrome
const CREAM = '#faf8f4' // theme-lint-disable — book ink, not app chrome

/** A whole page laid in colour, bleeding off its three outer edges. */
function pagePanel(page: BookPageSetup, side: 'left' | 'right', fill: string): BookElement {
  const b = page.bleed
  return shape({
    x: side === 'left' ? -b : page.pageWidth,
    y: -b,
    w: page.pageWidth + b,
    h: page.pageHeight + b * 2,
  }, fill)
}

/** A band down the outer edge — the cheapest mark that says "designed". */
function edgeBand(page: BookPageSetup, side: 'left' | 'right', fill: string, width = 8): BookElement {
  const b = page.bleed
  return shape({
    x: side === 'left' ? -b : page.pageWidth * 2 - width,
    y: -b,
    w: width + b,
    h: page.pageHeight + b * 2,
  }, fill)
}

/** A box ruled around something, with nothing inside it. */
function ruleBox(
  frame: { x: number; y: number; w: number; h: number },
  colour: string,
  radius = 0,
): BookElement {
  return shape(frame, null, { stroke: colour, strokeWidth: 0.3, radius })
}

/**
 * Which page the picture is on. Alternating keeps the book moving.
 *
 * Named for the picture rather than the words because that is the half a reader
 * sees first, and because naming it the other way makes every call site below
 * read backwards.
 */
type Hand = 'left' | 'right'

interface EntryContext {
  entry: AutoEntry
  input: AutoInput
  /** Position in the book, for alternating the layouts. */
  index: number
  hand: Hand
}

/** The heading block: rule, date line, title. Returns where it ended. */
function headingBlock(
  els: BookElement[],
  entry: AutoEntry,
  input: AutoInput,
  x: number,
  y: number,
  w: number,
  opts: { size?: number; ink?: string; muted?: string } = {},
): number {
  const size = opts.size ?? 22
  const ink = opts.ink ?? '#141414' // theme-lint-disable — book ink, not app chrome
  const muted = opts.muted ?? '#8a8578' // theme-lint-disable — book ink, not app chrome
  const heading = entry.title || entry.location || ''
  const meta = [formatBookDate(entry.date, input.locale), entry.location].filter(Boolean).join('  ·  ')
  let cy = y

  if (meta || heading) {
    els.push(shape({ x, y: cy - 6, w: Math.min(14, w * 0.18), h: 0.5 }, ACCENT))
  }
  if (meta) {
    // Two facts run together and upper-cased: neither the date nor the place as
    // the journal holds them, so this line is not bound to either.
    els.push(text({ x, y: cy, w, h: 5 }, meta.toUpperCase(), {
      size: 7.5, weight: 600, tracking: 0.14, color: muted,
    }))
    cy += 8
  }
  if (heading) {
    els.push(text({ x, y: cy, w, h: size * 0.6 }, heading, {
      size, weight: 700, leading: 1.1, tracking: -0.02, color: ink,
      binding: { source: 'entry.title', entryId: entry.id },
    }))
    cy += size * 0.75
  }
  return cy
}

/** The foot: the day chip and the rule that says how far in this is. */
function footMarks(els: BookElement[], ctx: EntryContext, x: number, w: number, y: number) {
  const { entry, input } = ctx
  els.push(...progressRule(x, y, w, entry.dayNumber, entry.dayCount))

  // Above the dot, not above the middle: the chip and the rule are one mark
  // saying how far in this page is, and a chip parked at the centre of a line
  // whose dot is elsewhere says nothing at all.
  const day = entry.dayNumber
  const total = entry.dayCount
  if (!day) return
  const t = total && total > 1 ? Math.min(1, Math.max(0, (day - 1) / (total - 1))) : 0
  const cw = 24
  const cx = Math.min(x + w - cw, Math.max(x, x + w * t - cw / 2))
  const chip = dayChip({ x: cx, y: y - 11, w: cw, h: 7 }, day, input.dayLabel)
  if (chip) els.push(chip)
}

/**
 * A stop, with nothing written about it yet.
 *
 * The country pale behind, the name large, the coordinates beneath it, and the
 * picture page waiting as a frame. This is Polarsteps' place page, and it is
 * the answer to what a page should look like when the only thing known about a
 * day is where it was.
 */
function placeSpread(ctx: EntryContext): BookSpread {
  const { entry, input, hand } = ctx
  const { page } = input
  const H = page.pageHeight
  const m = 18
  const els: BookElement[] = []

  const photoPage = hand === 'left' ? 0 : page.pageWidth
  const textPage = hand === 'left' ? page.pageWidth : 0
  const tx = textPage + m
  const colW = page.pageWidth - m * 2

  const wm = countryWatermark({ x: tx, y: H * 0.22, w: colW, h: H * 0.4 }, entry.country)
  if (wm) els.push(wm)

  const flag = flagRow({ x: tx, y: m + 4, w: colW * 0.7, h: 7 }, entry.country ?? null, countryOf(entry, input))
  if (flag) els.push(flag)

  const name = entry.title || entry.location || ''
  if (name) {
    els.push(text({ x: tx, y: H * 0.42, w: colW, h: 20 }, name, {
      size: 26, weight: 700, tracking: -0.02, color: '#141414', // theme-lint-disable — book ink, not app chrome
      binding: { source: 'entry.title', entryId: entry.id },
    }))
  }
  const coords = coordsMark({ x: tx, y: H * 0.42 + 22, w: colW, h: 6 }, entry.lat, entry.lng)
  if (coords) els.push(coords)

  footMarks(els, ctx, tx, colW, H - m - 6)

  // The picture page: one frame, edge to edge, waiting.
  els.push(photo({ x: photoPage + m, y: m, w: page.pageWidth - m * 2, h: H - m * 2 }, null))

  return sheet(els, entry, '#faf8f4') // theme-lint-disable — book ink, not app chrome
}

/**
 * A day that was written about: words on one page, one picture on the other.
 *
 * The picture runs off three edges and stops dead on the gutter — across the
 * fold or up to it, never almost, because an overhang of a few millimetres has
 * no reading and disappears into the spine anyway.
 */
function storySpread(ctx: EntryContext): BookSpread {
  const { entry, input, hand } = ctx
  const { page } = input
  const H = page.pageHeight
  const m = 18
  const els: BookElement[] = []
  const hero = entry.photos[0]

  const textPage = hand === 'left' ? page.pageWidth : 0
  const tx = textPage + m
  const colW = page.pageWidth - m * 2
  const onLeft = hand === 'left'

  if (hero) {
    // Bleeding off the outer edge and the top and bottom, flush to the fold.
    els.push(photo(
      {
        x: onLeft ? -page.bleed : page.pageWidth,
        y: -page.bleed,
        w: page.pageWidth + page.bleed,
        h: H + page.bleed * 2,
      },
      hero.photoId,
      { focalX: isPortrait(hero) ? 0.5 : 0.55 },
    ))
    if (hero.caption) {
      els.push(text({ x: (onLeft ? 0 : page.pageWidth) + m, y: H - m - 6, w: page.pageWidth * 0.6, h: 5 }, hero.caption, {
        size: 7.5, weight: 500, color: '#ffffff', opacity: 0.9, // theme-lint-disable — book ink, not app chrome
        binding: { source: 'photo.caption', entryId: entry.id, photoId: hero.photoId },
      }))
    }
  } else {
    /*
     * No photograph yet, but the page it will sit on is already the page. An
     * empty frame is what the renderer draws as an outline and what a dragged
     * photo fills — so the layout is finished and the picture is the only thing
     * missing, rather than the other way round.
     */
    els.push(photo({
      x: (onLeft ? 0 : page.pageWidth) + m,
      y: m,
      w: page.pageWidth - m * 2,
      h: H - m * 2,
    }, null))
  }

  // A small map of the stop, top of the text page — the mark that says where.
  const map = placeMap({ x: tx, y: m, w: 26, h: 20 }, entry, input.stats)
  if (map) els.push(map)

  const flag = flagRow({ x: tx + (map ? 32 : 0), y: m + 6, w: colW - (map ? 32 : 0), h: 7 }, entry.country ?? null, countryOf(entry, input))
  if (flag) els.push(flag)

  const cy = headingBlock(els, entry, input, tx, m + 34, colW, { size: 20 })
  const story = (entry.story || '').trim()
  if (story) {
    els.push(text({ x: tx, y: cy + 3, w: colW, h: H - cy - m - 34 }, story, {
      size: 10, leading: 1.62, color: '#2a2a2a', // theme-lint-disable — book ink, not app chrome
      binding: { source: 'entry.story', entryId: entry.id },
    }))
  }

  const mark = dateMark(entry.date, input.locale, { x: tx, y: H - m - 30, w: 26, h: 20 })
  if (mark) els.push(mark)
  footMarks(els, ctx, tx, colW, H - m - 4)

  return sheet(els, entry, '#ffffff') // theme-lint-disable — book ink, not app chrome
}

/**
 * A panorama across the fold, with the day underneath it.
 *
 * The one case where the gutter is an asset rather than something to design
 * around: a wide picture wants the whole sheet.
 */
function panoSpread(ctx: EntryContext): BookSpread {
  const { entry, input } = ctx
  const { page } = input
  const W = page.pageWidth * 2
  const H = page.pageHeight
  const m = 18
  const gut = 6
  const els: BookElement[] = []
  const [hero, ...rest] = entry.photos

  els.push(photo({ x: -page.bleed, y: -page.bleed, w: W + page.bleed * 2, h: H * 0.58 + page.bleed }, hero.photoId))

  const cy = headingBlock(els, entry, input, m, H * 0.58 + 16, page.pageWidth - m * 2, { size: 18 })
  const story = (entry.story || '').trim()
  if (story) {
    els.push(text({ x: m, y: cy + 2, w: page.pageWidth - m * 2, h: H - cy - m - 12 }, story, {
      size: 10, leading: 1.6, color: '#2a2a2a', // theme-lint-disable — book ink, not app chrome
      binding: { source: 'entry.story', entryId: entry.id },
    }))
  }

  const strip = rest.slice(0, 3)
  if (strip.length) {
    const cw = (page.pageWidth - m * 2 - gut * (strip.length - 1)) / strip.length
    strip.forEach((p, i) => {
      els.push(photo({ x: page.pageWidth + m + i * (cw + gut), y: H * 0.58 + 16, w: cw, h: H * 0.26 }, p.photoId))
    })
  }

  const flag = flagRow({ x: page.pageWidth + m, y: H - m - 16, w: page.pageWidth - m * 2, h: 7 }, entry.country ?? null, countryOf(entry, input))
  if (flag) els.push(flag)
  footMarks(els, ctx, page.pageWidth + m, page.pageWidth - m * 2, H - m - 4)

  return sheet(els, entry, '#ffffff') // theme-lint-disable — book ink, not app chrome
}

/**
 * Several pictures: one large, the rest ruled beneath it.
 *
 * The hero takes a page and the others sit in a row under the text, which is
 * how a magazine sets a picture story and how these books do too.
 */
function gallerySpread(ctx: EntryContext): BookSpread {
  const { entry, input, hand } = ctx
  const { page } = input
  const H = page.pageHeight
  const m = 18
  const gut = 5
  const els: BookElement[] = []
  const [hero, ...rest] = entry.photos

  const heroOnLeft = hand === 'left'
  const heroX = heroOnLeft ? -page.bleed : page.pageWidth
  const textX = (heroOnLeft ? page.pageWidth : 0) + m
  const colW = page.pageWidth - m * 2

  els.push(photo(
    { x: heroX, y: -page.bleed, w: page.pageWidth + page.bleed, h: H + page.bleed * 2 },
    hero.photoId,
    { focalX: isPortrait(hero) ? 0.5 : 0.55 },
  ))

  const flag = flagRow({ x: textX, y: m + 2, w: colW, h: 7 }, entry.country ?? null, countryOf(entry, input))
  const cy = headingBlock(els, entry, input, textX, m + (flag ? 26 : 16), colW, { size: 19 })
  if (flag) els.push(flag)

  const strip = rest.slice(0, 3)
  const stripH = strip.length ? (strip.length === 1 ? H * 0.28 : H * 0.22) : 0
  // The foot carries the rule and the chip, so nothing else may end there.
  const footRoom = 22
  const story = (entry.story || '').trim()
  if (story) {
    const h = H - cy - m - (stripH ? stripH + 12 : 0) - footRoom
    els.push(text({ x: textX, y: cy + 2, w: colW, h: Math.max(18, h) }, story, {
      size: 10, leading: 1.62, color: '#2a2a2a', // theme-lint-disable — book ink, not app chrome
      binding: { source: 'entry.story', entryId: entry.id },
    }))
  }

  if (strip.length) {
    const cw = (colW - gut * (strip.length - 1)) / strip.length
    strip.forEach((p, i) => {
      els.push(photo({ x: textX + i * (cw + gut), y: H - m - footRoom - stripH, w: cw, h: stripH }, p.photoId))
    })
  }

  footMarks(els, ctx, textX, colW, H - m - 4)
  return sheet(els, entry, '#ffffff') // theme-lint-disable — book ink, not app chrome
}

/**
 * One picture over the whole sheet, the words set on top of it.
 *
 * Used sparingly — every few spreads — because it is the loudest page in the
 * book and a book of loud pages has no loud pages.
 */
function immersiveSpread(ctx: EntryContext): BookSpread {
  const { entry, input } = ctx
  const { page } = input
  const W = page.pageWidth * 2
  const H = page.pageHeight
  const m = 20
  const els: BookElement[] = []
  const hero = entry.photos[0]

  els.push(photo(bleedFrame(page, true), hero ? hero.photoId : null, { focalY: 0.45 }))

  // A panel behind the type: white on an unknown photograph is a coin toss.
  els.push(shape({ x: -page.bleed, y: H * 0.56, w: W + page.bleed * 2, h: H * 0.44 + page.bleed }, '#0d0d0f', { // theme-lint-disable — book ink, not app chrome
    gradient: 'up', opacity: 0.72,
  }))

  const cy = headingBlock(els, entry, input, m, H * 0.68, page.pageWidth - m * 2, {
    size: 24,
    ink: '#ffffff', // theme-lint-disable — book ink, not app chrome
    muted: '#d8d3ca', // theme-lint-disable — book ink, not app chrome
  })
  const story = (entry.story || '').trim()
  if (story) {
    els.push(text({ x: page.pageWidth + m, y: H * 0.68, w: page.pageWidth - m * 2, h: H * 0.26 }, story, {
      size: 9.5, leading: 1.6, color: '#efece6', // theme-lint-disable — book ink, not app chrome
      binding: { source: 'entry.story', entryId: entry.id },
    }))
  }
  void cy

  const coords = coordsMark({ x: m, y: H - m - 5, w: page.pageWidth - m * 2, h: 5 }, entry.lat, entry.lng)
  if (coords) els.push(coords)

  return sheet(els, entry, '#0d0d0f') // theme-lint-disable — book ink, not app chrome
}

/**
 * A page laid in ink, the picture overrunning it.
 *
 * The composition these books use more than any other: one page solid, the
 * other a photograph, and something crossing the join so the two halves read
 * as one sheet rather than as two pages that happen to be adjacent. Here the
 * crossing is a second picture, sitting half on the panel and half off it.
 */
function panelSpread(ctx: EntryContext): BookSpread {
  const { entry, input, hand } = ctx
  const { page } = input
  const H = page.pageHeight
  const m = 20
  const els: BookElement[] = []
  const [hero, ...rest] = entry.photos

  const panelSide = hand === 'left' ? 'right' : 'left'
  const panelX = panelSide === 'left' ? 0 : page.pageWidth
  const tx = panelX + m
  const colW = page.pageWidth - m * 2

  // The panel first: everything after it lands on top.
  els.push(pagePanel(page, panelSide, PANEL_INK))

  if (hero) {
    els.push(photo({
      x: panelSide === 'left' ? page.pageWidth : -page.bleed,
      y: -page.bleed,
      w: page.pageWidth + page.bleed,
      h: H + page.bleed * 2,
    }, hero.photoId, { focalX: isPortrait(hero) ? 0.5 : 0.55 }))
  } else {
    els.push(photo({
      x: (panelSide === 'left' ? page.pageWidth : 0) + m,
      y: m,
      w: colW,
      h: H - m * 2,
    }, null))
  }

  const flag = flagRow({ x: tx, y: m, w: colW, h: 7 }, entry.country ?? null, countryOf(entry, input))
  if (flag) els.push(flag)

  const cy = headingBlock(els, entry, input, tx, m + 30, colW, {
    size: 21, ink: PANEL_TYPE, muted: '#a8a094', // theme-lint-disable — book ink, not app chrome
  })
  const story = (entry.story || '').trim()
  if (story) {
    els.push(text({ x: tx, y: cy + 3, w: colW, h: H - cy - m - 46 }, story, {
      size: 9.5, leading: 1.66, color: '#d9d4cb', // theme-lint-disable — book ink, not app chrome
      binding: { source: 'entry.story', entryId: entry.id },
    }))
  }

  /*
   * A second picture across the fold, half on the panel.
   *
   * This is the whole point of the layout: without it the spread is two pages,
   * with it the spread is one. Pushed last so it sits over both.
   */
  const crossing = rest[0]
  if (crossing) {
    const cw = 62
    const ch = 46
    els.push(photo({
      x: page.pageWidth - cw * 0.55,
      y: H - m - ch - 14,
      w: cw,
      h: ch,
    }, crossing.photoId, { radius: 1 }))
  }

  footMarks(els, ctx, tx, colW, H - m - 4)
  return sheet(els, entry, CREAM)
}

/**
 * A band down the edge, a ruled box, and pictures at two sizes.
 *
 * The quiet counterpart to the panel spread — nothing solid across a whole
 * page, but enough drawing that it does not read as a photograph with a
 * caption. The box around the text is doing the same job a panel does: it
 * makes the words an object on the page rather than something poured onto it.
 */
function bandSpread(ctx: EntryContext): BookSpread {
  const { entry, input, hand } = ctx
  const { page } = input
  const H = page.pageHeight
  const m = 20
  const gut = 5
  const els: BookElement[] = []
  const photos = entry.photos

  const bandSide = hand === 'left' ? 'left' : 'right'
  els.push(edgeBand(page, bandSide, ACCENT, 6))

  // The big picture takes most of one page, off the top and the outer edge.
  const heroSide = hand === 'left' ? 'left' : 'right'
  const heroX = heroSide === 'left' ? 6 : page.pageWidth
  const heroW = page.pageWidth - 6 + (heroSide === 'left' ? 0 : page.bleed)
  if (photos[0]) {
    els.push(photo({ x: heroX, y: -page.bleed, w: heroW, h: H * 0.62 }, photos[0].photoId))
  } else {
    els.push(photo({ x: heroX + m, y: m, w: heroW - m * 2, h: H * 0.5 }, null))
  }

  const textPage = heroSide === 'left' ? page.pageWidth : 0
  const tx = textPage + m
  const colW = page.pageWidth - m * 2

  // The words in a ruled box, set in from it on every side.
  const boxY = m + 6
  const boxH = H * 0.52
  els.push(ruleBox({ x: tx, y: boxY, w: colW, h: boxH }, '#d8d2c6', 1.5)) // theme-lint-disable — book ink, not app chrome

  const flag = flagRow({ x: tx + 8, y: boxY + 8, w: colW - 16, h: 6 }, entry.country ?? null, countryOf(entry, input))
  if (flag) els.push(flag)

  const cy = headingBlock(els, entry, input, tx + 8, boxY + 30, colW - 16, { size: 18 })
  const story = (entry.story || '').trim()
  if (story) {
    els.push(text({ x: tx + 8, y: cy + 2, w: colW - 16, h: boxY + boxH - cy - 12 }, story, {
      size: 9.5, leading: 1.6, color: '#2a2a2a', // theme-lint-disable — book ink, not app chrome
      binding: { source: 'entry.story', entryId: entry.id },
    }))
  }

  // Two smaller pictures under the box, and one that overlaps the hero above.
  const rest = photos.slice(1, 3)
  if (rest.length) {
    const cw = (colW - gut * (rest.length - 1)) / rest.length
    rest.forEach((ph, i) => {
      els.push(photo({ x: tx + i * (cw + gut), y: boxY + boxH + 10, w: cw, h: H * 0.2 }, ph.photoId, { radius: 1 }))
    })
  }
  const overlap = photos[3]
  if (overlap) {
    els.push(photo({ x: heroX + 14, y: H * 0.62 - 26, w: 52, h: 40 }, overlap.photoId, { radius: 1 }))
  }

  const mark = dateMark(entry.date, input.locale, { x: heroX + 14, y: H - m - 34, w: 26, h: 22 })
  if (mark) els.push(mark)
  footMarks(els, ctx, tx, colW, H - m - 4)
  return sheet(els, entry, '#ffffff') // theme-lint-disable — book ink, not app chrome
}

/** The country a stop is in, named in the book's language. */
function countryOf(entry: AutoEntry, input: AutoInput): string {
  if (!entry.country) return ''
  const named = input.stats?.countries.find(c => c.code === entry.country)
  try {
    return new Intl.DisplayNames([input.locale], { type: 'region' }).of(entry.country) ?? named?.name ?? ''
  } catch {
    return named?.name ?? ''
  }
}

function sheet(els: BookElement[], entry: AutoEntry, background: string): BookSpread {
  return { id: uid('sp'), role: 'inner', background, elements: els, parked: [], entryId: entry.id }
}

/**
 * Pick a layout for an entry.
 *
 * By what it has first — a panorama wants the fold, a stop with no pictures
 * wants the place page — and by where it sits in the book second, so two
 * neighbours with the same contents do not come out identical. The hand
 * alternates for the same reason: a book whose pictures are all on the left is
 * a book you can feel the template through.
 */
/**
 * A hand-drawn template for this entry, if one of them fits.
 *
 * Tried before the layouts written below, and that order is the point: a page
 * somebody designed beats a page a function reasoned its way to, every time.
 * The built-in layouts are what an entry falls back on when no template suits
 * it — a book of six pictures has nowhere to go in a template drawn for two.
 *
 * Rotated by position so a run of similar entries does not come out as a run
 * of identical pages, which is the failure the built-ins had before them.
 */
function templateSpread(entry: AutoEntry, input: AutoInput, index: number): BookSpread | null {
  if (SPREAD_TEMPLATES.length === 0) return null

  const scored = SPREAD_TEMPLATES
    .map(t => ({ t, fit: templateFit(t, entry) }))
    .filter(x => x.fit >= 0)
    .sort((a, b) => b.fit - a.fit)
  if (scored.length === 0) return null

  // Everything within a few points of the best is equally suitable, so the
  // position picks between them rather than the order they happen to be in.
  const best = scored[0].fit
  const equals = scored.filter(x => x.fit >= best - 5)
  const pick = equals[index % equals.length]

  return applyTemplate(pick.t, entry, {
    page: input.page,
    locale: input.locale,
    stats: input.stats,
    dayLabel: input.dayLabel,
  })
}

function entrySpread(entry: AutoEntry, input: AutoInput, index = 0): BookSpread {
  const hand: Hand = index % 2 === 0 ? 'left' : 'right'
  const ctx: EntryContext = { entry, input, index, hand }
  const photos = entry.photos.slice(0, 5)
  const withPhotos = { ...entry, photos }
  const c = { ...ctx, entry: withPhotos }

  const story = (entry.story || '').trim()
  // The place page is for a stop nobody wrote about. Words want a page with
  // room for them, even when the pictures have not arrived.
  const fromTemplate = templateSpread(withPhotos, input, index)
  if (fromTemplate) return fromTemplate

  if (photos.length === 0 && !story) return placeSpread(c)
  // Guarded: an entry can have words and no pictures at all.
  if (photos.length > 0 && isPano(photos[0])) return panoSpread(c)

  /*
   * Six layouts on a rotation, so the book does not read as a template.
   *
   * By contents first — a panorama wants the fold, a stop with nothing said
   * about it wants the place page — and then by position, so two neighbours
   * with the same contents come out differently. The full-bleed page is kept
   * to every sixth and never the first: a book should not open at its own
   * volume, and a book of loud pages has no loud page.
   */
  switch (index % 6) {
    case 0: return photos.length > 1 ? gallerySpread(c) : storySpread(c)
    case 1: return panelSpread(c)
    case 2: return photos.length > 2 ? bandSpread(c) : storySpread(c)
    case 3: return photos.length ? immersiveSpread(c) : panelSpread(c)
    case 4: return photos.length > 1 ? bandSpread(c) : panelSpread(c)
    default: return photos.length > 1 ? gallerySpread(c) : storySpread(c)
  }
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
    // With the recorded track, when the journey has one: the editor fetches it
    // and this was the line that threw it away.
    els.push(mapEl({ x: m, y: m, w: W - m * 2, h: H - m * 2 }, stats, { path: input.path ?? [] }))
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

  const rx = W + m
  const colW = W - m * 2

  els.push(shape({ x: rx, y: m + 14, w: colW * 0.16, h: 0.5 }, ACCENT))
  els.push(text({ x: rx, y: m + 20, w: colW, h: 7 }, input.summaryLabel.toUpperCase(), {
    size: 9, weight: 700, tracking: 0.18, color: '#141414', // theme-lint-disable — book ink, not app chrome
  }))

  if (metrics.length) {
    els.push(statsEl(
      { x: rx, y: m + 36, w: colW, h: H * 0.42 },
      stats,
      metrics,
      'grid',
    ))
  }

  /*
   * The furthest point, drawn.
   *
   * Two dots, a line and a distance — the one figure on this page that is about
   * a relationship rather than a total, and the one Polarsteps gives its own
   * drawing to. It is worth the space for the same reason: "10,382 km" means
   * nothing until it is a line between two names.
   */
  const home = stats.points[0]
  const far = furthestPoint(stats)
  if (stats.furthest > 0 && home && far && far !== home) {
    const y = H - m - 26
    const lineW = colW - 16
    els.push(shape({ x: rx + 8, y, w: lineW, h: 0.3 }, '#cfc9bd')) // theme-lint-disable — book ink, not app chrome
    for (const t of [0, 1]) {
      els.push(shape(
        { x: rx + 8 + lineW * t - 1.4, y: y - 1.25, w: 2.8, h: 2.8 },
        t === 0 ? '#8a8578' : ACCENT, // theme-lint-disable — book ink, not app chrome
        { shape: 'ellipse' },
      ))
    }
    els.push(badgeEl(
      { x: rx + 8 + lineW * 0.5 - 17, y: y - 11, w: 34, h: 8 },
      'distance',
      { text: formatKm(stats.furthest, input.locale) },
      { style: 'chip', textScale: 0.7 },
    ))
    els.push(text({ x: rx + 4, y: y + 4, w: lineW * 0.5, h: 5 }, (home.label || '').toUpperCase(), {
      size: 6.5, weight: 600, tracking: 0.1, color: '#8a8578', // theme-lint-disable — book ink, not app chrome
    }))
    els.push(text({ x: rx + 4 + lineW * 0.5, y: y + 4, w: lineW * 0.5 + 4, h: 5 }, (far.label || '').toUpperCase(), {
      size: 6.5, weight: 600, tracking: 0.1, align: 'right', color: '#8a8578', // theme-lint-disable — book ink, not app chrome
    }))
  }

  return { id: uid('sp'), role: 'inner', background: null, elements: els, parked: [], entryId: null }
}

/** The stop that ended up furthest from the first one. */
function furthestPoint(stats: JourneyStats) {
  const home = stats.points[0]
  if (!home) return null
  let best = home
  let bestD = 0
  for (const p of stats.points) {
    const d = Math.hypot(p.lat - home.lat, (p.lng - home.lng) * Math.cos((home.lat * Math.PI) / 180))
    if (d > bestD) { bestD = d; best = p }
  }
  return best
}

/** Metres as the books print them: "1,189 km", in the book's own language. */
function formatKm(metres: number, locale: string): string {
  return `${Math.round(metres / 1000).toLocaleString(locale)} km`
}

function countriesSpread(input: AutoInput, names: string[]): BookSpread | null {
  const stats = input.stats
  if (!stats || stats.countries.length < 2) return null

  const { page } = input
  const W = page.pageWidth
  const H = page.pageHeight
  const m = 20
  const rows = stats.countries.length
  // Tall enough to breathe, but never taller than the page it sits on.
  const height = Math.min(H - m * 2 - 24, Math.max(H * 0.4, rows * 26))

  /*
   * Dark, because the printed one is.
   *
   * It is the single most recognisable page in these books: pale outlines on
   * near-black, names above them, nothing else on the sheet. On white it is a
   * list with pictures; on black it is the page people photograph.
   */
  const ink = '#f2efe9' // theme-lint-disable — book ink, not app chrome

  return {
    id: uid('sp'),
    role: 'inner',
    background: '#12161d', // theme-lint-disable — book ink, not app chrome
    elements: [
      text({ x: W + m, y: m + 16, w: W - m * 2, h: 8 }, input.countriesLabel.toUpperCase(), {
        size: 9, weight: 700, tracking: 0.2, align: 'center', color: ink,
      }),
      countriesEl(
        { x: W + m, y: (H - height) / 2 + 10, w: W - m * 2, h: height },
        stats,
        names,
        { color: ink, accent: ink },
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
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
  const span = dates.length
    ? [formatBookDate(dates[0], input.locale), formatBookDate(dates[dates.length - 1], input.locale)].filter(Boolean).join(' — ')
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
      ['places', input.stats.places],
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

  /*
   * Entries with something on them get a spread each; runs of bare ones share
   * a list. Consecutive runs only — a book of a journey is in the order it
   * happened, and gathering every bare entry at the end would break that.
   */
  let laid = 0
  let run: AutoEntry[] = []
  const flushRun = () => {
    if (run.length === 0) return
    // One bare entry between two real ones is not a list, it is a line. It gets
    // the same page as its neighbours would rather than a page of its own.
    for (let i = 0; i < run.length; i += STATIONS_PER_PAGE * 2) {
      spreads.push(stationsSpread(run.slice(i, i + STATIONS_PER_PAGE * 2), input, input.stationsLabel))
    }
    run = []
  }
  for (const entry of input.entries) {
    if (hasSubstance(entry)) {
      flushRun()
      spreads.push(entrySpread(entry, input, laid++))
    } else {
      run.push(entry)
    }
  }
  flushRun()
  spreads.push(backSpread(input))
  return {
    version: 1,
    title: input.title,
    page: input.page,
    spreads: spreads.slice(0, 150),
  }
}

/**
 * A book nobody has laid out yet.
 *
 * What a journey with no book now opens on. It used to open on the auto layout,
 * which was generous and wrong: it decided what the book was before its author
 * had said anything, and everything after that was undoing rather than making.
 * The layout is still one click away, on the Auto layout menu, and it reads
 * very differently when it is offered than when it has already happened.
 *
 * The covers are here rather than left out because a book has them and there is
 * no other way to add one: the pages rail only inserts inner spreads, between
 * the two. Empty, though, in the same way the page between them is.
 */
export function emptyBook(input: AutoInput): BookDocument {
  const blank = (role: BookSpread['role']): BookSpread => ({
    id: uid('sp'), role, background: null, elements: [], parked: [], entryId: null,
  })
  return {
    version: 1,
    title: input.title,
    page: input.page,
    spreads: [blank('cover'), blank('inner'), blank('back')],
  }
}

/**
 * Lay one spread out again, from the entry it came from.
 *
 * The whole-book version throws away everything; this is for the far more
 * common "this page came out wrong" — it rebuilds the spread its entry would
 * produce and leaves every other page alone.
 *
 * Returns null for a spread that has no entry behind it: the cover, the back
 * cover, the summary, the country page and anything added by hand. Those were
 * not generated from an entry, so there is nothing to regenerate them from, and
 * silently replacing them with a blank page would be worse than refusing.
 */
export function relayoutSpread(spread: BookSpread, input: AutoInput): BookSpread | null {
  if (spread.role !== 'inner' || spread.entryId == null) return null
  const entry = input.entries.find(e => e.id === spread.entryId)
  if (!entry) return null
  // Its own id is kept, so the pages rail does not scroll and the selection
  // does not jump — from the outside it is the same page, rearranged.
  const index = input.entries.indexOf(entry)
  return { ...entrySpread(entry, input, index < 0 ? 0 : index), id: spread.id }
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
