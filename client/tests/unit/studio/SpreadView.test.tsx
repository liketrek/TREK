import { describe, it, expect } from 'vitest'
import type { BookElement, BookPageSetup, BookSpread } from '@trek/shared'
import { render } from '../../helpers/render'
import { SpreadView } from '../../../src/components/Studio/SpreadView'
import { bookPageSetupSchema } from '@trek/shared'

/**
 * The page renderer, with the elements added in #1973.
 *
 * `SpreadView` is the *only* renderer — headless Chromium runs this same
 * component tree to make the PDF — so what these check is not "does the editor
 * look right" but "would this print". The two questions that matter are whether
 * an element draws at all, and whether it draws in millimetres.
 */

const page: BookPageSetup = bookPageSetupSchema.parse({
  preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5,
})

const frame = { x: 10, y: 20, w: 80, h: 60 }
const common = { frame, rotation: 0, opacity: 1, locked: false }
const typeset = { font: 'sans' as const, color: '#1a1a1a', accent: '#c2410c', textScale: 1, stale: false }

function spread(elements: BookElement[]): BookSpread {
  return { id: 's1', role: 'inner', background: null, elements, parked: [], entryId: null }
}

function draw(elements: BookElement[], props: { print?: boolean } = {}) {
  return render(<SpreadView spread={spread(elements)} page={page} {...props} />)
}

/**
 * The first element on the sheet.
 *
 * `SpreadView` renders the sheet as one absolutely-positioned div and the
 * elements inside it, so a plain `div > div` selector finds the sheet — which
 * is a div inside Testing Library's own container. This walks in one more.
 */
function firstElement(container: HTMLElement): HTMLElement | null {
  const sheet = container.firstElementChild
  return (sheet?.firstElementChild as HTMLElement) ?? null
}

const photo = (over: Record<string, unknown> = {}): BookElement => ({
  ...common, id: 'p1', kind: 'photo', photoId: 42, fit: 'cover',
  focalX: 0.5, focalY: 0.5, radius: 0, filter: 'none', mask: null, frameStyle: 'none',
  ...over,
} as BookElement)

const shape = (over: Record<string, unknown> = {}): BookElement => ({
  ...common, id: 's1', kind: 'shape', shape: 'rect', fill: '#112233', gradient: 'none',
  stroke: null, strokeWidth: 0, strokeStyle: 'solid', radius: 0,
  ...over,
} as BookElement)

describe('shapes', () => {
  it('draws a rectangle as a box, which is what CSS is good at', () => {
    const { container } = draw([shape()])
    expect(container.querySelector('svg')).toBeNull()
    expect(firstElement(container)!.style.width).toBe('80mm')
  })

  it('draws anything else as an SVG path', () => {
    const { container } = draw([shape({ shape: 'heart' })])
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg!.querySelector('path')?.getAttribute('d')).toMatch(/^M/)
  })

  /*
   * The viewBox is in millimetres and the element is that many millimetres
   * wide, so one user unit is one millimetre. That is what keeps a stroke the
   * same width on every side of a non-square frame — the whole reason the path
   * is scaled rather than the coordinate system.
   */
  it('gives the SVG a viewBox in millimetres, matching its own size', () => {
    const { container } = draw([shape({ shape: 'star-5' })])
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('viewBox')).toBe('0 0 80 60')
    expect(svg.getAttribute('width')).toBe('80mm')
    expect(svg.getAttribute('height')).toBe('60mm')
  })

  it('scales the path to the frame, so the drawing fills the box it was snapped to', () => {
    const { container } = draw([shape({ shape: 'diamond' })])
    const d = container.querySelector('path')!.getAttribute('d')!
    const nums = (d.match(/-?\d*\.?\d+/g) ?? []).map(Number)
    const xs = nums.filter((_, i) => i % 2 === 0)
    const ys = nums.filter((_, i) => i % 2 === 1)
    expect(Math.max(...xs)).toBeCloseTo(80, 1)
    expect(Math.max(...ys)).toBeCloseTo(60, 1)
  })

  it('insets the path by half the stroke, keeping the outline inside the frame', () => {
    const { container } = draw([shape({ shape: 'pentagon', stroke: '#000000', strokeWidth: 2 })])
    const path = container.querySelector('path')!
    expect(path.getAttribute('transform')).toBe('translate(1 1)')
    expect(path.getAttribute('stroke-width')).toBe('2')
  })

  it('turns a dashed stroke into a dash pattern proportional to its width', () => {
    const { container } = draw([shape({ shape: 'hexagon', stroke: '#000000', strokeWidth: 1, strokeStyle: 'dashed' })])
    expect(container.querySelector('path')!.getAttribute('stroke-dasharray')).toBe('3 2')
  })

  it('gives a gear the even-odd rule so its middle is a hole', () => {
    const { container } = draw([shape({ shape: 'gear', fill: '#000000' })])
    expect(container.querySelector('path')!.getAttribute('fill-rule')).toBe('evenodd')
  })

  it('leaves a heart alone, so its subpaths do not knock holes in each other', () => {
    const { container } = draw([shape({ shape: 'heart', fill: '#000000' })])
    expect(container.querySelector('path')!.getAttribute('fill-rule')).toBeNull()
  })
})

describe('photo frames', () => {
  it('draws a plain photo without a clip path', () => {
    const { container } = draw([photo()])
    expect(container.querySelector('clipPath')).toBeNull()
    expect(container.querySelector('img')).not.toBeNull()
  })

  it('cuts a masked photo with an objectBoundingBox clip, so it follows a resize', () => {
    const { container } = draw([photo({ mask: 'heart' })])
    const clip = container.querySelector('clipPath')!
    expect(clip.getAttribute('clipPathUnits')).toBe('objectBoundingBox')
    // 0..1 coordinates, not 0..100 — that is what objectBoundingBox means.
    const nums = (clip.querySelector('path')!.getAttribute('d')!.match(/\d*\.?\d+/g) ?? []).map(Number)
    expect(Math.max(...nums)).toBeLessThanOrEqual(1.06)
  })

  it('treats a rect mask as no mask at all', () => {
    const { container } = draw([photo({ mask: 'rect' })])
    expect(container.querySelector('clipPath')).toBeNull()
  })

  it('gives a Polaroid a white body and a chin thicker than its sides', () => {
    const { container } = draw([photo({ frameStyle: 'polaroid' })])
    const outer = firstElement(container)!
    expect(outer.style.background).toContain('rgb(255, 255, 255)')
    const inner = outer.querySelector('div') as HTMLElement
    // 5.5% of the short side at the sides, 17% at the bottom.
    expect(inner.style.top).toBe('3.3mm')
    expect(inner.style.bottom).toBe('10.2mm')
  })

  it('gives film a dark body and sprocket holes', () => {
    const { container } = draw([photo({ frameStyle: 'film' })])
    const outer = firstElement(container)!
    expect(outer.style.background).toContain('rgb(20, 20, 20)')
    // The picture, plus the two sprocket strips.
    expect(outer.querySelectorAll('div').length).toBeGreaterThan(2)
  })

  /*
   * Two strips, each centred on its corner. Both halves matter: the panel
   * preview draws two as well, and a preview that disagrees with the result
   * makes the second strip look like a bug.
   */
  it('tapes both top corners, each strip centred on its corner', () => {
    const { container } = draw([photo({ frameStyle: 'tape' })])
    const strips = [...firstElement(container)!.querySelectorAll('div')]
      .filter(d => (d as HTMLElement).style.transform.includes('rotate'))
    expect(strips).toHaveLength(2)

    const [left, right] = strips as HTMLElement[]
    // 26% of the short side wide, 7.5% tall; half of each is the offset.
    expect(left.style.left).toBe('-7.8mm')
    expect(left.style.top).toBe('-2.25mm')
    expect(right.style.right).toBe('-7.8mm')
    // Mirrored, so the pair reads as symmetric rather than as two of the same.
    expect(left.style.transform).toBe('rotate(-45deg)')
    expect(right.style.transform).toBe('rotate(45deg)')
  })

  it('applies a filter to the image rather than to the frame around it', () => {
    const { container } = draw([photo({ filter: 'bw' })])
    expect((container.querySelector('img') as HTMLElement).style.filter).toContain('grayscale')
  })

  /*
   * An empty frame is an instruction to the person laying out the book. Printed,
   * it would be a hatched rectangle on a page somebody paid to have bound.
   */
  it('shows an empty frame while editing and prints nothing at all', () => {
    const { container: editing } = draw([photo({ photoId: null })], {})
    expect(firstElement(editing)).not.toBeNull()

    const { container: printing } = draw([photo({ photoId: null })], { print: true })
    expect(printing.querySelector('img')).toBeNull()
    expect(firstElement(printing)).toBeNull()
  })
})

describe('travel elements', () => {
  const map = (over: Record<string, unknown> = {}): BookElement => ({
    ...common, ...typeset, id: 'm1', kind: 'map', style: 'minimal',
    showLand: true, showRoute: true, showPins: true, showLabels: false,
    countries: ['IS'],
    points: [
      { lat: 64.14, lng: -21.94, label: 'Reykjavík' },
      { lat: 65.68, lng: -18.12, label: 'Akureyri' },
    ],
    ...over,
  } as BookElement)

  it('draws the route as a polyline and its stops as pins', () => {
    const { container } = draw([map()])
    expect(container.querySelector('polyline')).not.toBeNull()
    expect(container.querySelectorAll('circle')).toHaveLength(2)
  })

  it('draws the country outlines under the route', () => {
    const { container } = draw([map()])
    // One path for Iceland; the route itself is a polyline, not a path.
    expect(container.querySelectorAll('path').length).toBeGreaterThan(0)
  })

  it('leaves out the layers that are switched off', () => {
    const { container } = draw([map({ showRoute: false, showPins: false, showLand: false })])
    expect(container.querySelector('polyline')).toBeNull()
    expect(container.querySelectorAll('circle')).toHaveLength(0)
  })

  it('labels the stops only when asked', () => {
    expect(draw([map()]).container.querySelectorAll('text')).toHaveLength(0)
    const { container } = draw([map({ showLabels: true })])
    expect(container.textContent).toContain('Reykjavík')
  })

  it('survives a map with no stops and no countries rather than dividing by zero', () => {
    const { container } = draw([map({ points: [], countries: [] })])
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('viewBox')).toBe('0 0 80 60')
    expect(svg.innerHTML).not.toContain('NaN')
  })

  it('survives a single stop, where the bounds have no extent', () => {
    const { container } = draw([map({ points: [{ lat: 64.14, lng: -21.94, label: 'one' }] })])
    expect(container.querySelector('svg')!.innerHTML).not.toContain('NaN')
  })

  it('draws the figures with the values the document holds', () => {
    const stats = {
      ...common, ...typeset, id: 'st1', kind: 'stats',
      metrics: ['distance', 'days'], layout: 'grid', showIcons: true, units: 'metric',
      values: { distance: 1_189_000, days: 14 },
    } as unknown as BookElement
    const { container } = draw([stats])
    expect(container.textContent).toContain('1,189')
    expect(container.textContent).toContain('14')
  })

  it('converts distance to miles without touching the stored metres', () => {
    const stats = {
      ...common, ...typeset, id: 'st1', kind: 'stats',
      metrics: ['distance'], layout: 'row', showIcons: false, units: 'imperial',
      values: { distance: 1_609_344 },
    } as unknown as BookElement
    expect(draw([stats]).container.textContent).toContain('1,000')
  })

  it('names the countries and draws their silhouettes', () => {
    const countries = {
      ...common, ...typeset, id: 'c1', kind: 'countries',
      codes: ['IS', 'NO'], names: ['Iceland', 'Norway'],
      layout: 'list', showOutline: true, showFlag: false, showName: true, align: 'center',
    } as unknown as BookElement
    const { container } = draw([countries])
    expect(container.textContent).toContain('Iceland')
    expect(container.textContent).toContain('Norway')
    expect(container.querySelectorAll('svg').length).toBe(2)
  })

  /*
   * The bundled boundaries do not carry every dependency and territory as its
   * own feature, so some codes have no silhouette. The name still has to print
   * — a country page that silently drops a country would be worse than one
   * without a drawing next to it.
   */
  it('still names a country whose silhouette is not bundled', () => {
    const countries = {
      ...common, ...typeset, id: 'c1', kind: 'countries',
      codes: ['FO'], names: ['Faroe Islands'],
      layout: 'list', showOutline: true, showFlag: false, showName: true, align: 'center',
    } as unknown as BookElement
    const { container } = draw([countries])
    expect(container.textContent).toContain('Faroe Islands')
    expect(container.querySelectorAll('svg')).toHaveLength(0)
  })

  it('leaves out the outlines when they are switched off', () => {
    const countries = {
      ...common, ...typeset, id: 'c1', kind: 'countries',
      codes: ['IS'], names: ['Iceland'],
      layout: 'list', showOutline: false, showFlag: false, showName: true, align: 'center',
    } as unknown as BookElement
    expect(draw([countries]).container.querySelectorAll('svg')).toHaveLength(0)
  })

  it('draws a badge with its figure and its caption', () => {
    const badge = {
      ...common, ...typeset, id: 'b1', kind: 'badge',
      variant: 'date', text: '13', sub: 'APRIL', code: null, style: 'stacked',
    } as unknown as BookElement
    const { container } = draw([badge])
    expect(container.textContent).toContain('13')
    expect(container.textContent).toContain('APRIL')
  })

  /*
   * Drawn, not typed. A regional-indicator pair renders as the two letters on
   * Windows, which is where most readers are — see the note in flags.ts.
   */
  /*
   * ── What colour a mark's words are ────────────────────────────────────
   *
   * A chip is a filled capsule, so its words answer to the fill rather than to
   * the page. Ink on ink is the failure this prevents, and it is not a subtle
   * one: a black day counter on a black chip is an empty capsule.
   */
  it('sets a chip on a dark fill in paper, not in ink', () => {
    const badge = {
      ...common, ...typeset, id: 'b1', kind: 'badge',
      variant: 'day', text: 'DAY 1', sub: '', code: null, style: 'chip',
      accent: '#111111', color: '#111111', autoColor: true,
    } as unknown as BookElement
    const { container } = draw([badge])
    const html = container.innerHTML
    expect(html).toContain('rgb(255, 255, 255)')
  })

  it('sets a chip on a pale fill in ink', () => {
    const badge = {
      ...common, ...typeset, id: 'b1', kind: 'badge',
      variant: 'day', text: 'DAY 1', sub: '', code: null, style: 'chip',
      accent: '#f4efe6', color: '#ffffff', autoColor: true,
    } as unknown as BookElement
    expect(draw([badge]).container.innerHTML).toContain('rgb(28, 27, 25)')
  })

  /* Automatic is a good default and a bad cage: a chosen colour wins outright. */
  it('uses the chosen colour once automatic is off, fill or no fill', () => {
    const badge = {
      ...common, ...typeset, id: 'b1', kind: 'badge',
      variant: 'day', text: 'DAY 1', sub: '', code: null, style: 'chip',
      accent: '#111111', color: '#c81e4a', autoColor: false,
    } as unknown as BookElement
    // The badge's own words, not the page behind it — the paper is white here,
    // so asking the whole tree would pass whatever the mark did.
    const words = draw([badge]).getByText('DAY 1')
    expect(words.style.color).toBe('rgb(200, 30, 74)')
  })

  it('draws a flag badge as geometry rather than as an emoji', () => {
    const badge = {
      ...common, ...typeset, id: 'b1', kind: 'badge',
      variant: 'flag', text: '', sub: 'Iceland', code: 'IS', style: 'plain',
    } as unknown as BookElement
    const { container } = draw([badge])
    expect(container.textContent).not.toContain('\u{1F1EE}\u{1F1F8}')
    // Iceland is a Nordic cross: a field, an upright, a crossbar and two inner
    // bars, plus the hairline that keeps a white edge off a white page.
    expect(container.querySelectorAll('svg rect')).toHaveLength(6)
    expect(container.querySelector('svg')!.getAttribute('viewBox')).toBe('0 0 30 20')
  })

  it('falls back to the outline for a country whose flag it cannot draw exactly', () => {
    const badge = {
      ...common, ...typeset, id: 'b1', kind: 'badge',
      variant: 'flag', text: '', sub: 'United Kingdom', code: 'GB', style: 'plain',
    } as unknown as BookElement
    const { container } = draw([badge])
    // The silhouette, not a construction: one path, no bands.
    expect(container.querySelectorAll('svg rect')).toHaveLength(0)
    expect(container.querySelectorAll('svg path')).toHaveLength(1)
  })

  it('positions every travel element in millimetres, like everything else on the page', () => {
    const badge = {
      ...common, ...typeset, id: 'b1', kind: 'badge',
      variant: 'day', text: 'DAY 1', sub: '', code: null, style: 'chip',
    } as unknown as BookElement
    const el = firstElement(draw([badge]).container)!
    expect(el.style.left).toBe('10mm')
    expect(el.style.top).toBe('20mm')
    expect(el.style.width).toBe('80mm')
  })
})
