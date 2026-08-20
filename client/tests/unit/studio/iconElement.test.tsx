import { describe, it, expect } from 'vitest'
import type { BookElement, BookPageSetup, BookSpread } from '@trek/shared'
import { bookIconElementSchema, bookPageSetupSchema } from '@trek/shared'
import { render } from '../../helpers/render'
import { SpreadView } from '../../../src/components/Studio/SpreadView'
import {
  FEATURED_ICONS, ICON_NAMES, iconLabel, searchIcons,
} from '../../../src/components/Studio/iconLibrary'

/**
 * The icon element (#1973).
 *
 * An icon is the one thing on a Studio page that is not drawn in this repo. The
 * document stores a name and trusts lucide to still know it, which is what these
 * protect at both ends: that the mark reaches the page with the weight and the
 * colour somebody chose, and that a name the library has since renamed costs a
 * drawing rather than the page it stood on.
 *
 * The list the picker is built from matters for the same reason. lucide exports
 * every drawing three times, so a list taken straight from the namespace shows
 * every glyph three times and makes the search box look broken.
 */

const page: BookPageSetup = bookPageSetupSchema.parse({
  preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5,
})

/* Deliberately not square: an icon has to keep its shape in a frame that has not. */
const icon = (over: Record<string, unknown> = {}): BookElement => bookIconElementSchema.parse({
  id: 'i1', kind: 'icon', frame: { x: 10, y: 20, w: 80, h: 60 }, name: 'Compass', ...over,
})

function draw(elements: BookElement[]) {
  const spread: BookSpread = {
    id: 's1', role: 'inner', background: null, elements, parked: [], entryId: null,
  }
  return render(<SpreadView spread={spread} page={page} />)
}

/** The sheet is a div inside Testing Library's container; the elements sit inside it. */
function firstElement(container: HTMLElement): HTMLElement {
  return container.firstElementChild!.firstElementChild as HTMLElement
}

describe('an icon on the page', () => {
  it('draws the named lucide glyph as an SVG', () => {
    const { container } = draw([icon({ name: 'Compass' })])
    const svg = container.querySelector('svg')!
    expect(svg).not.toBeNull()
    // lucide names the drawing it rendered, which is how we know the stored
    // name was resolved rather than some default standing in for it.
    expect(svg.getAttribute('class')).toContain('lucide-compass')
    expect(svg.children.length).toBeGreaterThan(0)
  })

  it('strokes the drawing in the colour the element carries', () => {
    const { container } = draw([icon({ color: '#c81e4a' })])
    expect(container.querySelector('svg')!.getAttribute('stroke')).toBe('#c81e4a')
  })

  /*
   * The weight is against lucide's own 24-unit grid, not millimetres, so it has
   * to arrive unscaled: an icon set 60mm across with a hairline is a diagram
   * rather than a mark, and a stroke silently converted to a length would be
   * exactly that.
   */
  it('sets the stroke to the stored line width, against lucide\'s own grid', () => {
    const { container } = draw([icon({ lineWidth: 3.5 })])
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('stroke-width')).toBe('3.5')
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24')
  })

  it('carries a hairline through just as faithfully as a heavy stroke', () => {
    const { container } = draw([icon({ lineWidth: 0.25 })])
    expect(container.querySelector('svg')!.getAttribute('stroke-width')).toBe('0.25')
  })

  /*
   * A shape is scaled by moving its points and looks deliberate at any ratio.
   * A stroked drawing does not: a compass pulled to twice its width reads as a
   * mistake. So the drawing fills the frame but is never told to ignore its
   * aspect ratio, and the box centres what is left over.
   */
  it('fills the frame without being stretched out of shape', () => {
    const { container } = draw([icon()])
    const svg = container.querySelector('svg')!
    expect(svg.style.width).toBe('100%')
    expect(svg.style.height).toBe('100%')
    expect(svg.getAttribute('preserveAspectRatio')).toBeNull()

    const box = firstElement(container)
    expect(box.style.alignItems).toBe('center')
    expect(box.style.justifyContent).toBe('center')
  })

  it('sits where the frame puts it, in millimetres like everything else', () => {
    const box = firstElement(draw([icon()]).container)
    expect(box.style.left).toBe('10mm')
    expect(box.style.top).toBe('20mm')
    expect(box.style.width).toBe('80mm')
    expect(box.style.height).toBe('60mm')
  })

  /*
   * A book outlives the library it was made with. Whatever happens when a name
   * goes, the page has to keep printing, so the missing drawing becomes the same
   * fallback the plugin list uses rather than an empty rectangle.
   */
  it('draws the fallback, not a hole, when lucide no longer knows the name', () => {
    expect(ICON_NAMES).not.toContain('CarrierPigeon')

    const { container } = draw([icon({ name: 'CarrierPigeon', color: '#0f766e', lineWidth: 1.5 })])
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg!.children.length).toBeGreaterThan(0)
    expect(svg!.getAttribute('class')).toContain('lucide-blocks')
    // Still the element's own mark: the fallback inherits the choices made for
    // the drawing it stands in for.
    expect(svg!.getAttribute('stroke')).toBe('#0f766e')
    expect(svg!.getAttribute('stroke-width')).toBe('1.5')
  })
})

describe('the icon list the picker is built from', () => {
  it('holds the whole of lucide, over a thousand drawings', () => {
    expect(ICON_NAMES.length).toBeGreaterThan(1000)
    expect(ICON_NAMES).toContain('Plane')
    expect(ICON_NAMES).toContain('MountainSnow')
  })

  it('leaves out the Lucide-prefixed alias of a name it already has', () => {
    expect(ICON_NAMES).not.toContain('LucidePlane')

    const present = new Set(ICON_NAMES)
    const aliases = ICON_NAMES.filter(n => n.startsWith('Lucide') && present.has(n.slice(6)))
    expect(aliases).toEqual([])
  })

  it('leaves out the Icon-suffixed alias of a name it already has', () => {
    expect(ICON_NAMES).not.toContain('PlaneIcon')

    const present = new Set(ICON_NAMES)
    const aliases = ICON_NAMES.filter(n => n.endsWith('Icon') && present.has(n.slice(0, -4)))
    expect(aliases).toEqual([])
  })

  it('comes out sorted, so the grid does not have to sort it again', () => {
    const outOfOrder = ICON_NAMES.filter((name, i) => i > 0 && ICON_NAMES[i - 1].localeCompare(name) > 0)
    expect(outOfOrder).toEqual([])
  })
})

describe('searching the icon list', () => {
  it('finds a compound name by its first word', () => {
    expect(searchIcons('mountain')).toContain('MountainSnow')
  })

  /* The second half is the part somebody types when they want the snowy one. */
  it('finds a compound name by its second word', () => {
    expect(searchIcons('snow')).toContain('MountainSnow')
  })

  it('finds it from both words, in either order', () => {
    expect(searchIcons('snow mountain')).toContain('MountainSnow')
    expect(searchIcons('mountain snow')).toContain('MountainSnow')
  })

  it('ignores case and stray spacing', () => {
    expect(searchIcons('MOUNTAIN')).toContain('MountainSnow')
    expect(searchIcons('  Snow  ')).toContain('MountainSnow')
  })

  it('narrows as words are added rather than widening', () => {
    const snow = searchIcons('snow')
    const both = searchIcons('snow mountain')
    expect(snow.length).toBeGreaterThan(both.length)
    expect(both.every(name => snow.includes(name))).toBe(true)
  })

  it('returns the whole library when nothing has been typed', () => {
    expect(searchIcons('')).toEqual(ICON_NAMES)
    expect(searchIcons('   ')).toEqual(ICON_NAMES)
  })

  it('returns nothing for a word no drawing has', () => {
    expect(searchIcons('zzzznotathing')).toEqual([])
  })
})

describe('names and the starter shelf', () => {
  it('spaces a PascalCase name out for the tooltip', () => {
    expect(iconLabel('MountainSnow')).toBe('Mountain Snow')
    expect(iconLabel('CloudRain')).toBe('Cloud Rain')
    expect(iconLabel('Plane')).toBe('Plane')
  })

  /*
   * The shelf is a hand-written list, so it is the one place a lucide rename
   * would show up as a row of fallback glyphs. It is filtered against the real
   * exports, and this is what keeps that filter honest.
   */
  it('opens on drawings this version of lucide really has', () => {
    expect(FEATURED_ICONS.length).toBeGreaterThan(0)
    const missing = FEATURED_ICONS.filter(name => !ICON_NAMES.includes(name))
    expect(missing).toEqual([])
  })
})
