import type { BookElement, BookPageSetup, BookSpread } from '@trek/shared'

/**
 * Layout templates for a spread.
 *
 * A template is not a special mode and not a locked page — it is a set of frames
 * with the pictures left out. Applying one keeps the photos and the words that
 * are already on the spread and pours them into the new arrangement, in order;
 * anything the new layout has room for but the old one did not fill stays an
 * empty frame you can drop a picture onto.
 *
 * Content the new layout has no room for is **parked, not deleted**. Trying a
 * text-only layout and then changing your mind must not cost you the pictures:
 * they come straight back the moment a layout with frames is applied. Undo would
 * technically get them back too, but "I clicked the wrong card" should not need
 * a rescue.
 *
 * That is the difference between a template system that helps and one that
 * fights you: nothing here is remembered as a mode. Once applied, the spread is
 * an ordinary spread.
 */

export interface Template {
  id: string
  labelKey: string
  /** How many pictures the layout has room for. */
  photoSlots: number
  /**
   * Which spreads this arrangement is for.
   *
   * A cover is one page rather than two, and it is the one page where the type
   * is the subject — a layout built for a spread lands half of itself in the
   * fold, so the two sets have to be kept apart. Everything without this is an
   * inner layout, which is what all of them were.
   */
  role?: 'inner' | 'single'
  /** Draw the frames for a page of this size. */
  build: (page: BookPageSetup) => TemplateSlot[]
}

export type TemplateSlot =
  | { kind: 'photo'; frame: Frame }
  | { kind: 'heading'; frame: Frame }
  | { kind: 'body'; frame: Frame }
  | { kind: 'meta'; frame: Frame }

interface Frame { x: number; y: number; w: number; h: number }

const M = 16
const G = 6

function grid(page: BookPageSetup, cols: number, rows: number, opts: { bleed?: boolean } = {}): Frame[] {
  const W = page.pageWidth * 2
  const H = page.pageHeight
  const pad = opts.bleed ? -page.bleed : M
  const availW = (opts.bleed ? W + page.bleed * 2 : W - M * 2) - G * (cols - 1)
  const availH = (opts.bleed ? H + page.bleed * 2 : H - M * 2) - G * (rows - 1)
  const cw = availW / cols
  const ch = availH / rows
  const out: Frame[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out.push({ x: pad + c * (cw + G), y: pad + r * (ch + G), w: cw, h: ch })
    }
  }
  return out
}

/** The spread layouts. `COVER_TEMPLATES` holds the single-page set. */
export const TEMPLATES: Template[] = [
  {
    id: 'hero-story',
    labelKey: 'journey.studio.tpl.heroStory',
    photoSlots: 4,
    build: page => {
      const W = page.pageWidth
      const H = page.pageHeight
      const col = W + M + 6
      const colW = W - M * 2 - 6
      const gridH = H * 0.24
      return [
        // Exactly up to the gutter — see the note in autoLayout.ts.
        { kind: 'photo', frame: { x: -page.bleed, y: -page.bleed, w: W + page.bleed, h: H + page.bleed * 2 } },
        { kind: 'meta', frame: { x: col, y: M + 18, w: colW, h: 5 } },
        { kind: 'heading', frame: { x: col, y: M + 26, w: colW, h: 12 } },
        { kind: 'body', frame: { x: col, y: M + 44, w: colW, h: H - M * 2 - 44 - gridH - 10 } },
        { kind: 'photo', frame: { x: col, y: H - M - gridH, w: (colW - G * 2) / 3, h: gridH } },
        { kind: 'photo', frame: { x: col + (colW - G * 2) / 3 + G, y: H - M - gridH, w: (colW - G * 2) / 3, h: gridH } },
        { kind: 'photo', frame: { x: col + ((colW - G * 2) / 3 + G) * 2, y: H - M - gridH, w: (colW - G * 2) / 3, h: gridH } },
      ]
    },
  },
  {
    id: 'full-bleed',
    labelKey: 'journey.studio.tpl.fullBleed',
    photoSlots: 1,
    build: page => [
      { kind: 'photo', frame: { x: -page.bleed, y: -page.bleed, w: page.pageWidth * 2 + page.bleed * 2, h: page.pageHeight + page.bleed * 2 } },
      { kind: 'heading', frame: { x: M, y: page.pageHeight - M - 22, w: page.pageWidth - M, h: 12 } },
    ],
  },
  {
    id: 'two-up',
    labelKey: 'journey.studio.tpl.twoUp',
    photoSlots: 2,
    build: page => {
      const H = page.pageHeight
      const W = page.pageWidth
      return [
        { kind: 'photo', frame: { x: -page.bleed, y: -page.bleed, w: W + page.bleed, h: H + page.bleed * 2 } },
        { kind: 'photo', frame: { x: W, y: -page.bleed, w: W + page.bleed, h: H + page.bleed * 2 } },
      ]
    },
  },
  {
    id: 'grid-4',
    labelKey: 'journey.studio.tpl.grid4',
    photoSlots: 4,
    build: page => grid(page, 2, 2).map(frame => ({ kind: 'photo' as const, frame })),
  },
  {
    id: 'grid-6',
    labelKey: 'journey.studio.tpl.grid6',
    photoSlots: 6,
    build: page => grid(page, 3, 2).map(frame => ({ kind: 'photo' as const, frame })),
  },
  {
    id: 'strip',
    labelKey: 'journey.studio.tpl.strip',
    photoSlots: 3,
    build: page => {
      const H = page.pageHeight
      const W = page.pageWidth * 2
      const stripH = H * 0.52
      const cw = (W + page.bleed * 2 - G * 2) / 3
      return [
        { kind: 'photo', frame: { x: -page.bleed, y: -page.bleed, w: cw, h: stripH + page.bleed } },
        { kind: 'photo', frame: { x: -page.bleed + cw + G, y: -page.bleed, w: cw, h: stripH + page.bleed } },
        { kind: 'photo', frame: { x: -page.bleed + (cw + G) * 2, y: -page.bleed, w: cw, h: stripH + page.bleed } },
        { kind: 'meta', frame: { x: M, y: stripH + 14, w: page.pageWidth - M * 2, h: 5 } },
        { kind: 'heading', frame: { x: M, y: stripH + 22, w: page.pageWidth - M * 2, h: 12 } },
        { kind: 'body', frame: { x: page.pageWidth + M, y: stripH + 14, w: page.pageWidth - M * 2, h: H - stripH - 14 - M } },
      ]
    },
  },
  {
    id: 'quiet-text',
    labelKey: 'journey.studio.tpl.quietText',
    photoSlots: 0,
    build: page => {
      const W = page.pageWidth
      const H = page.pageHeight
      return [
        { kind: 'meta', frame: { x: W + M, y: M + 26, w: W - M * 2, h: 5 } },
        { kind: 'heading', frame: { x: W + M, y: M + 34, w: W - M * 2, h: 14 } },
        { kind: 'body', frame: { x: W + M, y: M + 54, w: W - M * 2, h: H - M * 2 - 54 } },
      ]
    },
  },
  {
    id: 'full-text',
    labelKey: 'journey.studio.tpl.fullText',
    photoSlots: 1,
    build: page => {
      // A picture that owns the left page and a column of story on the right,
      // set narrow. The arrangement for an entry with one photograph worth
      // looking at and something to say about it.
      const W = page.pageWidth
      const H = page.pageHeight
      return [
        { kind: 'photo', frame: { x: -page.bleed, y: -page.bleed, w: W + page.bleed, h: H + page.bleed * 2 } },
        { kind: 'meta', frame: { x: W + M, y: H * 0.28, w: W - M * 2, h: 5 } },
        { kind: 'heading', frame: { x: W + M, y: H * 0.28 + 8, w: W - M * 2, h: 14 } },
        { kind: 'body', frame: { x: W + M, y: H * 0.28 + 26, w: (W - M * 2) * 0.82, h: H * 0.4 } },
      ]
    },
  },
  {
    id: 'grid-9',
    labelKey: 'journey.studio.tpl.grid9',
    photoSlots: 9,
    build: page => grid(page, 3, 3).map(frame => ({ kind: 'photo' as const, frame })),
  },
  {
    id: 'mosaic',
    labelKey: 'journey.studio.tpl.mosaic',
    photoSlots: 5,
    build: page => {
      const W = page.pageWidth * 2
      const H = page.pageHeight
      const availW = W - M * 2 - G * 2
      const big = availW * 0.5
      const small = (availW - big) / 2
      const rowH = (H - M * 2 - G) / 2
      return [
        { kind: 'photo', frame: { x: M, y: M, w: big, h: rowH * 2 + G } },
        { kind: 'photo', frame: { x: M + big + G, y: M, w: small, h: rowH } },
        { kind: 'photo', frame: { x: M + big + G * 2 + small, y: M, w: small, h: rowH } },
        { kind: 'photo', frame: { x: M + big + G, y: M + rowH + G, w: small, h: rowH } },
        { kind: 'photo', frame: { x: M + big + G * 2 + small, y: M + rowH + G, w: small, h: rowH } },
      ]
    },
  },
  {
    id: 'band-quote',
    labelKey: 'journey.studio.tpl.bandQuote',
    photoSlots: 2,
    build: page => {
      // Two pictures with the words between them, set large. For the entry that
      // said something worth reading twice.
      const W = page.pageWidth
      const H = page.pageHeight
      const band = H * 0.34
      const top = (H - band) / 2
      return [
        { kind: 'photo', frame: { x: -page.bleed, y: -page.bleed, w: W + page.bleed, h: top + page.bleed } },
        { kind: 'photo', frame: { x: W, y: -page.bleed, w: W + page.bleed, h: top + page.bleed } },
        { kind: 'heading', frame: { x: M * 2, y: top + band * 0.24, w: W * 2 - M * 4, h: 16 } },
        { kind: 'body', frame: { x: W * 0.5, y: top + band * 0.62, w: W, h: band * 0.3 } },
      ]
    },
  },
  {
    id: 'stagger-four',
    labelKey: 'journey.studio.tpl.staggerFour',
    photoSlots: 4,
    build: page => {
      // Alternate frames drop, which is what stops four squares in a row
      // reading as a contact sheet.
      const W = page.pageWidth * 2
      const H = page.pageHeight
      const cw = (W - M * 2 - G * 3) / 4
      const ch = H * 0.62
      return [0, 1, 2, 3].map(i => ({
        kind: 'photo' as const,
        frame: { x: M + i * (cw + G), y: M + (i % 2 ? H * 0.16 : 0), w: cw, h: ch },
      }))
    },
  },
  {
    id: 'portrait-pair',
    labelKey: 'journey.studio.tpl.portraitPair',
    photoSlots: 2,
    build: page => {
      const W = page.pageWidth
      const H = page.pageHeight
      const pw = W - M * 2
      const ph = H - M * 2 - 24
      return [
        { kind: 'photo', frame: { x: M, y: M, w: pw, h: ph } },
        { kind: 'photo', frame: { x: W + M, y: M, w: pw, h: ph } },
        { kind: 'meta', frame: { x: M, y: H - M - 16, w: pw, h: 5 } },
        { kind: 'body', frame: { x: W + M, y: H - M - 16, w: pw, h: 12 } },
      ]
    },
  },
]

/**
 * Layouts for a single page — the cover and the back.
 *
 * Kept apart from the spread layouts because a cover is a different problem: it
 * is one page, the type is the subject rather than a caption to a photograph,
 * and the arrangements that work are the ones that leave a picture room to be
 * looked at while a title sits over it legibly. A spread layout applied here
 * would put half its frames past the edge of the page.
 */
export const COVER_TEMPLATES: Template[] = [
  {
    id: 'cover-full',
    labelKey: 'journey.studio.tpl.coverFull',
    photoSlots: 1,
    role: 'single',
    build: page => [
      { kind: 'photo', frame: { x: -page.bleed, y: -page.bleed, w: page.pageWidth + page.bleed * 2, h: page.pageHeight + page.bleed * 2 } },
      { kind: 'heading', frame: { x: M, y: page.pageHeight - M - 46, w: page.pageWidth - M * 2, h: 30 } },
      { kind: 'meta', frame: { x: M, y: page.pageHeight - M - 12, w: page.pageWidth - M * 2, h: 8 } },
    ],
  },
  {
    id: 'cover-band',
    labelKey: 'journey.studio.tpl.coverBand',
    photoSlots: 1,
    role: 'single',
    build: page => {
      // The picture stops short of the foot, and the title sits on the paper
      // rather than on the photograph — the safest cover there is, because it
      // is legible whatever the photograph turns out to be.
      const h = page.pageHeight * 0.68
      return [
        { kind: 'photo', frame: { x: -page.bleed, y: -page.bleed, w: page.pageWidth + page.bleed * 2, h: h + page.bleed } },
        { kind: 'heading', frame: { x: M, y: h + 16, w: page.pageWidth - M * 2, h: 26 } },
        { kind: 'meta', frame: { x: M, y: h + 44, w: page.pageWidth - M * 2, h: 8 } },
      ]
    },
  },
  {
    id: 'cover-window',
    labelKey: 'journey.studio.tpl.coverWindow',
    photoSlots: 1,
    role: 'single',
    build: page => {
      const inset = page.pageWidth * 0.13
      return [
        { kind: 'photo', frame: { x: inset, y: inset, w: page.pageWidth - inset * 2, h: page.pageHeight - inset * 2.6 } },
        { kind: 'heading', frame: { x: inset, y: page.pageHeight - inset * 1.4, w: page.pageWidth - inset * 2, h: 20 } },
      ]
    },
  },
  {
    id: 'cover-quiet',
    labelKey: 'journey.studio.tpl.coverQuiet',
    photoSlots: 0,
    role: 'single',
    build: page => [
      { kind: 'heading', frame: { x: M, y: page.pageHeight * 0.42, w: page.pageWidth - M * 2, h: 28 } },
      { kind: 'meta', frame: { x: M, y: page.pageHeight * 0.42 + 32, w: page.pageWidth - M * 2, h: 8 } },
    ],
  },
  {
    id: 'cover-half',
    labelKey: 'journey.studio.tpl.coverHalf',
    photoSlots: 2,
    role: 'single',
    build: page => {
      const half = page.pageHeight * 0.5
      return [
        { kind: 'photo', frame: { x: -page.bleed, y: -page.bleed, w: page.pageWidth + page.bleed * 2, h: half + page.bleed } },
        { kind: 'photo', frame: { x: -page.bleed, y: half, w: page.pageWidth + page.bleed * 2, h: page.pageHeight - half + page.bleed } },
        { kind: 'heading', frame: { x: M, y: half - 34, w: page.pageWidth - M * 2, h: 26 } },
      ]
    },
  },
]

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`

const HEADING = { size: 22, weight: 700 as const, leading: 1.1, tracking: -0.02, color: '#141414' }
const META = { size: 7.5, weight: 600 as const, tracking: 0.14, color: '#8a8578' }
const BODY = { size: 10, weight: 400 as const, leading: 1.6, color: '#2a2a2a' }

function textEl(frame: Frame, text: string, style: typeof HEADING | typeof META | typeof BODY, source: BookElement | null): BookElement {
  const base = source && source.kind === 'text' ? source : null
  return {
    id: uid('t'),
    kind: 'text',
    frame,
    rotation: 0,
    opacity: 1,
    locked: false,
    text,
    font: base?.font ?? 'sans',
    italic: false,
    align: base?.align ?? 'left',
    tracking: 0,
    binding: base?.binding ?? null,
    overridden: base?.overridden ?? false,
    ...style,
  } as BookElement
}

/**
 * Pour the spread's existing content into a different arrangement.
 *
 * Order is kept, because order is the only thing that survives a layout change
 * with its meaning intact: the first photo stays the first photo. Text keeps its
 * binding to the journal entry, so a re-laid page still updates when the entry
 * is edited.
 */
export function applyTemplate(spread: BookSpread, tpl: Template, page: BookPageSetup): BookSpread {
  const slots = tpl.build(page)
  // Placed content first, then whatever an earlier layout had to park: the
  // pictures on the page keep their order, and the ones that were set aside
  // queue up behind them.
  const pool = [...spread.elements, ...(spread.parked ?? [])]
  const photos = pool.filter(e => e.kind === 'photo')
  const texts = pool.filter(e => e.kind === 'text')

  /*
   * Which text is the heading, which the story, which the date line.
   *
   * Size decides the heading first, and length only sorts what is left. The
   * other way round — longest is the story, then look for a heading among the
   * rest — reads a spread with three texts correctly and gets a cover with one
   * exactly wrong: the single 30pt title becomes "the longest text", so it is
   * the story, so a cover layout with a heading slot and no body slot has
   * nowhere to put it and parks the title.
   */
  const heading = [...texts]
    .filter(t => t.kind === 'text' && t.size >= 14)
    .sort((a, b) => (b.kind === 'text' ? b.size : 0) - (a.kind === 'text' ? a.size : 0))[0] ?? null
  const rest = texts.filter(t => t !== heading)
  const body = [...rest]
    .sort((a, b) => (b.kind === 'text' ? b.text.length : 0) - (a.kind === 'text' ? a.text.length : 0))[0] ?? null
  const meta = rest.find(t => t !== body) ?? null

  let pi = 0
  const out: BookElement[] = []
  const usedText = new Set<BookElement>()

  for (const slot of slots) {
    if (slot.kind === 'photo') {
      const src = photos[pi++]
      out.push({
        id: uid('p'),
        kind: 'photo',
        frame: slot.frame,
        rotation: 0,
        opacity: 1,
        locked: false,
        photoId: src && src.kind === 'photo' ? src.photoId : null,
        fit: src && src.kind === 'photo' ? src.fit : 'cover',
        focalX: src && src.kind === 'photo' ? src.focalX : 0.5,
        focalY: src && src.kind === 'photo' ? src.focalY : 0.5,
        radius: src && src.kind === 'photo' ? src.radius : 0,
        filter: src && src.kind === 'photo' ? src.filter : 'none',
        // The cut and the decoration travel with the picture. A layout change
        // rearranges a page; it is not a reason for a photograph to come out of
        // its Polaroid.
        mask: src && src.kind === 'photo' ? src.mask : null,
        frameStyle: src && src.kind === 'photo' ? src.frameStyle : 'none',
      } as BookElement)
      continue
    }

    const src = slot.kind === 'heading' ? heading : slot.kind === 'meta' ? meta : body
    const value = src && src.kind === 'text' ? src.text : ''
    if (!value) continue
    if (src) usedText.add(src)
    out.push(textEl(
      slot.frame,
      value,
      slot.kind === 'heading' ? HEADING : slot.kind === 'meta' ? META : BODY,
      src,
    ))
  }

  // Everything the arrangement could not take. An empty photo frame carries no
  // picture, so it is not worth parking; a photo with an id and a text that was
  // never placed are.
  const parked = [
    ...photos.slice(pi).filter(e => e.kind === 'photo' && e.photoId != null),
    ...texts.filter(e => !usedText.has(e) && e.kind === 'text' && e.text.trim()),
  ].slice(0, 60)

  return { ...spread, elements: out, parked }
}
