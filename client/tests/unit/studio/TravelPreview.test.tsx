import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { BookElement } from '@trek/shared'
import { render } from '../../helpers/render'
import { TravelPreview } from '../../../src/components/Studio/TravelPreview'

/**
 * The panel tiles (#1973).
 *
 * The point of these is that they are the real element at a smaller scale, not
 * an icon standing in for one — four map styles are four maps, and a generic
 * glyph cannot tell you which is which. So what is checked here is that the
 * element genuinely renders, that its proportions survive, and that the tile
 * takes its size from the element rather than from a number someone guessed.
 */

/*
 * The tile measures itself, and jsdom reports every element as zero-sized. This
 * gives the measured span a width the moment it is observed, which is what the
 * browser does on the first frame — see useElementSize.test.ts for the same
 * pattern applied to the hook itself.
 */
const OBSERVED_W = 190

class SizingResizeObserver {
  constructor(private cb: ResizeObserverCallback) {}
  observe(el: Element) {
    Object.defineProperty(el, 'offsetWidth', { value: OBSERVED_W, configurable: true })
    Object.defineProperty(el, 'offsetHeight', { value: 60, configurable: true })
    this.cb([], this as unknown as ResizeObserver)
  }
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    get() { return OBSERVED_W },
    configurable: true,
  })
  vi.stubGlobal('ResizeObserver', SizingResizeObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const typeset = { font: 'sans' as const, color: '#1a1a1a', accent: '#c2410c', textScale: 1, stale: false }
const common = { rotation: 0, opacity: 1, locked: false }

const statsEl = (w: number, h: number): BookElement => ({
  ...common, ...typeset, id: 'st1', kind: 'stats',
  frame: { x: 40, y: 90, w, h },
  metrics: ['distance', 'days'], layout: 'grid', showIcons: true, units: 'metric',
  values: { distance: 1_189_000, days: 14 },
} as unknown as BookElement)

const tileHeight = (container: HTMLElement) =>
  parseFloat((container.firstElementChild as HTMLElement).style.height)

describe('TravelPreview', () => {
  it('draws the element itself, with its real figures', () => {
    const { container } = render(<TravelPreview el={statsEl(200, 60)} />)
    expect(container.textContent).toContain('1,189')
    expect(container.textContent).toContain('14')
  })

  it('takes its height from the element, so a wide panel gets a shallow tile', () => {
    const wide = render(<TravelPreview el={statsEl(200, 50)} />)
    const tall = render(<TravelPreview el={statsEl(80, 120)} />)
    expect(tileHeight(wide.container)).toBeLessThan(tileHeight(tall.container))
  })

  it('clamps a very flat element rather than drawing a hairline', () => {
    const { container } = render(<TravelPreview el={statsEl(400, 8)} minHeight={30} />)
    expect(tileHeight(container)).toBe(30)
  })

  it('clamps a very tall element rather than running down the panel', () => {
    const { container } = render(<TravelPreview el={statsEl(40, 400)} maxHeight={80} />)
    expect(tileHeight(container)).toBe(80)
  })

  /*
   * The tile is the frame. An element sitting at x=40 on the spread must draw
   * at the tile's own origin, or half of it would be outside the preview.
   */
  it('draws at the origin, ignoring where the element sits on the spread', () => {
    const { container } = render(<TravelPreview el={statsEl(200, 60)} />)
    const drawn = container.querySelector('.st-travel-preview > span > div') as HTMLElement
    expect(drawn.style.left).toBe('0mm')
    expect(drawn.style.top).toBe('0mm')
  })

  it('scales rather than squashes — one factor, applied to both axes', () => {
    const { container } = render(<TravelPreview el={statsEl(200, 60)} />)
    const scaler = container.querySelector('.st-travel-preview > span') as HTMLElement
    const m = /scale\(([\d.]+)\)/.exec(scaler.style.transform)
    expect(m).not.toBeNull()
    expect(Number(m![1])).toBeGreaterThan(0)
    expect(Number(m![1])).toBeLessThan(1)
  })

  /*
   * The clipped right edge that started this: the drawn element must never be
   * wider than the tile it was measured against.
   */
  it('never draws wider than the width it measured', () => {
    const { container } = render(<TravelPreview el={statsEl(400, 60)} />)
    const scaler = container.querySelector('.st-travel-preview > span') as HTMLElement
    const scale = Number(/scale\(([\d.]+)\)/.exec(scaler.style.transform)![1])
    const drawnPx = 400 * (96 / 25.4) * scale
    expect(drawnPx).toBeLessThanOrEqual(OBSERVED_W + 0.5)
    expect(parseFloat(scaler.style.left)).toBeGreaterThanOrEqual(0)
  })

  it('renders a map tile without a broken coordinate', () => {
    const map = {
      ...common, ...typeset, id: 'mp1', kind: 'map',
      frame: { x: 0, y: 0, w: 150, h: 120 },
      style: 'paper', showLand: true, showRoute: true, showPins: true, showLabels: false,
      countries: ['IS'],
      points: [
        { lat: 64.14, lng: -21.94, label: 'a' },
        { lat: 65.68, lng: -18.12, label: 'b' },
      ],
    } as unknown as BookElement
    const { container } = render(<TravelPreview el={map} />)
    expect(container.querySelector('polyline')).not.toBeNull()
    expect(container.querySelector('svg')!.innerHTML).not.toContain('NaN')
  })
})
