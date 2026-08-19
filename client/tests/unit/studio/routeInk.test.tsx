import { describe, it, expect } from 'vitest'
import type { BookElement } from '@trek/shared'
import { bookElementSchema } from '@trek/shared'
import { render } from '../../helpers/render'
import { TravelElementView } from '../../../src/components/Studio/TravelElements'

/** The renderer positions from the outside; a bare box is enough here. */
const box = { position: 'absolute' as const, width: '100mm', height: '80mm' }

/**
 * What the travel elements are drawn in (#1973).
 *
 * Ink by default rather than the app's orange: a book is printed, and a colour
 * that arrives without being chosen turns every element into the same accent
 * whether the book wants one or not. The one exception is the dark map, where
 * ink would be a black line on a near-black country.
 */

const mapEl = (over: Record<string, unknown> = {}): BookElement =>
  bookElementSchema.parse({
    id: 'm1', kind: 'map', frame: { x: 0, y: 0, w: 100, h: 80 },
    points: [
      { lat: 64.1, lng: -21.9, label: 'A' },
      { lat: 65.7, lng: -18.1, label: 'B' },
    ],
    countries: ['IS'],
    showRoute: true,
    showPins: true,
    ...over,
  })

const strokes = (container: HTMLElement) =>
  [...container.querySelectorAll('polyline')].map(p => p.getAttribute('stroke'))

describe('the default', () => {
  it('is ink, not the app accent', () => {
    const el = mapEl()
    expect((el as { accent: string }).accent).toBe('#111111')
  })

  it('draws the route in ink on a light map', () => {
    const { container } = render(<TravelElementView el={mapEl({ style: 'minimal' })} frameStyle={box} />)
    expect(strokes(container)).toContain('#111111')
  })
})

describe('the dark map', () => {
  /* Ink on near-black is a line nobody can see. */
  it('draws the route pale instead', () => {
    const { container } = render(<TravelElementView el={mapEl({ style: 'dark' })} frameStyle={box} />)
    expect(strokes(container)[0]).toBe('#f2efe9')
  })

  /*
   * Only the default is overridden. A colour somebody picked is theirs, even
   * when it is a poor choice on a dark map — that is their call to make.
   */
  it('leaves a chosen colour alone', () => {
    const { container } = render(<TravelElementView el={mapEl({ style: 'dark', accent: '#c2410c' })} frameStyle={box} />)
    expect(strokes(container)[0]).toBe('#c2410c')
  })
})
