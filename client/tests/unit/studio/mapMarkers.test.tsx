import { describe, it, expect } from 'vitest'
import type { BookElement, BookPageSetup, BookSpread } from '@trek/shared'
import { bookPageSetupSchema } from '@trek/shared'
import { render } from '../../helpers/render'
import { SpreadView } from '../../../src/components/Studio/SpreadView'

/**
 * The drawn route: photo markers, a bowed line and a casing (#1973).
 *
 * The stencil that rounds a photograph is the fragile part, and it failed
 * silently the first time: it was written inside the `defs` that belongs to
 * cutting a map to a coastline, so on an ordinary map the id it pointed at was
 * never written. A clip-path pointing at nothing is not an error, it is simply
 * no clip, and because the image is drawn with `slice` what showed was the
 * photograph standing proud of its circle with all four corners on the map.
 *
 * So these cases check that the id on the image and an id in the defs are the
 * same id, rather than checking that an image exists. The plain treatment is
 * checked too: every book made before this feature has to keep drawing exactly
 * as it did.
 */

const page: BookPageSetup = bookPageSetupSchema.parse({ preset: 'square-210' })

const STOPS = [
  { lat: 64.14, lng: -21.94, label: 'Reykjavík', photoId: 11 },
  { lat: 65.68, lng: -18.12, label: 'Akureyri', photoId: 12 },
  { lat: 38.72, lng: -9.14, label: 'Lisboa', photoId: null },
]

function map(over: Record<string, unknown> = {}): BookElement {
  return {
    id: 'mp1', kind: 'map', rotation: 0, opacity: 1, locked: false,
    font: 'sans', color: '#1a1a1a', accent: '#ffffff', textScale: 1, weight: 400, stale: false,
    frame: { x: 0, y: 0, w: 180, h: 140 },
    style: 'minimal', source: 'vector', tileUrl: '', attribution: '', zoom: null, clip: 'rect',
    showLand: true, showRoute: true, showPins: true, showLabels: false,
    routeStyle: 'drawn', routeArc: 'bow', routeDash: 'arcs', pinStyle: 'photo',
    countries: [], path: [], fitPadding: 0.5, fitToCountries: false, tripId: null,
    points: STOPS,
    ...over,
  } as unknown as BookElement
}

function draw(el: BookElement, big = true) {
  const spread: BookSpread = {
    id: 's1', role: 'inner', background: null, elements: [el], parked: [], entryId: null,
  }
  return render(<SpreadView spread={spread} page={page} big={big} />)
}

describe('a stop with a photograph', () => {
  it('is cut to a circle by a stencil that really exists', () => {
    const { container } = draw(map())
    const images = Array.from(container.querySelectorAll('image'))
    expect(images.length).toBe(2)

    const ids = new Set(
      Array.from(container.querySelectorAll('clipPath')).map(c => c.getAttribute('id')),
    )
    for (const im of images) {
      const ref = im.getAttribute('clip-path')!
      const id = ref.replace(/^url\(#/, '').replace(/\)$/, '')
      // The assertion that would have caught the square photographs.
      expect(ids.has(id), `no stencil for ${ref}`).toBe(true)
    }
  })

  it('asks for the thumbnail rather than the original, at every print size', () => {
    const { container } = draw(map())
    for (const im of Array.from(container.querySelectorAll('image'))) {
      expect(im.getAttribute('href')).toMatch(/^\/api\/photos\/\d+\/thumbnail$/)
    }
  })

  it('crops the picture to fill its circle rather than letterboxing it', () => {
    const { container } = draw(map())
    expect(container.querySelector('image')!.getAttribute('preserveAspectRatio')).toBe('xMidYMid slice')
  })

  /*
   * A stop with no photograph of its own is numbered rather than handed one
   * from somewhere else in the journey. That was the first design and it was a
   * caption that lies: a marker at the third stop showing a picture taken at
   * the seventh is wrong in the one place a reader most trusts that a picture
   * is OF what it sits on.
   */
  it('numbers a stop that has no photograph of its own', () => {
    const { container } = draw(map())
    expect(container.querySelectorAll('image').length).toBe(STOPS.filter(s => s.photoId).length)

    const numbers = Array.from(container.querySelectorAll('text')).map(t => t.textContent)
    // The third stop carries no photo id, so it prints its position.
    expect(numbers).toContain('3')
  })

  it('numbers nothing when the map was asked for dots', () => {
    const { container } = draw(map({ pinStyle: 'dot' }))
    expect(container.querySelectorAll('text').length).toBe(0)
    expect(container.querySelectorAll('image').length).toBe(0)
  })

  /*
   * Nobody prints the pages rail, and a thumbnail that fetched a photograph per
   * stop would cost a request per stop every time a panel opened.
   */
  it('costs nothing in a thumbnail', () => {
    const { container } = draw(map(), false)
    expect(container.querySelectorAll('image').length).toBe(0)
    expect(container.querySelectorAll('clipPath').length).toBe(0)
  })
})

describe('the drawn line', () => {
  it('is two strokes, so it stays legible over dark sea and bright desert alike', () => {
    const { container } = draw(map({ source: 'tiles', tileUrl: 'https://example.test/{z}/{x}/{y}.png' }))
    const strokes = Array.from(container.querySelectorAll('path'))
      .filter(p => p.getAttribute('fill') === 'none')
    expect(strokes.length).toBeGreaterThanOrEqual(2)
    // The casing is the wider of the pair, and it is the translucent one.
    const widths = strokes.map(p => Number(p.getAttribute('stroke-width')))
    expect(Math.max(...widths)).toBeGreaterThan(Math.min(...widths))
    expect(strokes.some(p => p.getAttribute('stroke-opacity'))).toBe(true)
  })

  it('bows a long leg and dashes it, since it is inferred rather than recorded', () => {
    const { container } = draw(map())
    const paths = Array.from(container.querySelectorAll('path'))
    expect(paths.some(p => (p.getAttribute('d') ?? '').includes('Q'))).toBe(true)
    expect(paths.some(p => p.getAttribute('stroke-dasharray'))).toBe(true)
  })

  it('never bows a recorded track, which would draw a journey that did not happen', () => {
    const { container } = draw(map({
      path: [[[64.14, -21.94], [64.5, -21.0], [65.68, -18.12]]],
    }))
    const ds = Array.from(container.querySelectorAll('path'))
      .filter(p => p.getAttribute('fill') === 'none')
      .map(p => p.getAttribute('d') ?? '')
    expect(ds.length).toBeGreaterThan(0)
    for (const d of ds) expect(d).not.toContain('Q')
  })
})

describe('a book made before any of this', () => {
  it('still draws one flat polyline and plain circles', () => {
    const { container } = draw(map({
      routeStyle: 'plain', routeArc: 'straight', routeDash: 'solid', pinStyle: 'dot',
    }))
    expect(container.querySelectorAll('polyline').length).toBe(1)
    expect(container.querySelectorAll('image').length).toBe(0)
    expect(container.querySelectorAll('circle').length).toBe(STOPS.length)
  })
})
