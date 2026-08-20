import { describe, it, expect } from 'vitest'
import { maxZoomFor, tileView } from '../../../src/components/Studio/mapTiles'

/**
 * How sharp a tiled map comes out on paper (#1973).
 *
 * The zoom used to be chosen so the route spanned the frame and nothing more,
 * which put about two tiles across the picture whatever its physical size: a
 * route across Iceland on a 210mm page arrived as 256 by 512 pixels stretched
 * over the sheet. Seventeen dots to the inch, on paper that holds three
 * hundred. It did not look like a bad map, it looked like a screenshot, which
 * is exactly what it was.
 *
 * These cases pin the sum rather than the picture: how many tile pixels end up
 * covering how many millimetres. A change that quietly puts the old behaviour
 * back would show up here as a number falling by a factor of ten.
 */

const OSM = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const RELIEF = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best'
  + '/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg'

/** A tile is 256 CSS pixels, or 512 when the template asked for retina. */
const tilePixels = (template: string) => (template.includes('{r}') ? 512 : 256)

/** Dots per inch the grid actually delivers over the frame it covers. */
function dpi(view: { size: number }, template: string): number {
  return tilePixels(template) / (view.size / 25.4)
}

const ICELAND = [
  { lat: 64.1466, lng: -21.9426 },
  { lat: 65.6885, lng: -18.1262 },
  { lat: 64.2539, lng: -15.2082 },
  { lat: 63.4194, lng: -19.0672 },
]

const BERLIN = [
  { lat: 52.5163, lng: 13.3777 },
  { lat: 52.5200, lng: 13.4050 },
  { lat: 52.5074, lng: 13.3904 },
]

describe('a full page of map', () => {
  it('is drawn at print resolution rather than at screen resolution', () => {
    const view = tileView(ICELAND, { w: 210, h: 297 }, OSM, null)!
    // The old sum landed at 17. Anything in this range is a printable page.
    expect(dpi(view, OSM)).toBeGreaterThan(250)
  })

  it('spends the tiles on the page it has, not on a fixed grid', () => {
    const small = tileView(ICELAND, { w: 60, h: 60 }, OSM, null)!
    const page = tileView(ICELAND, { w: 210, h: 297 }, OSM, null)!
    // Same route, bigger paper, more pictures. That is the whole idea.
    expect(page.tiles.length).toBeGreaterThan(small.tiles.length)
  })

  it('stays inside the request budget however large the page is', () => {
    const spread = tileView(ICELAND, { w: 420, h: 297 }, OSM, null)!
    expect(spread.tiles.length).toBeLessThanOrEqual(256)
  })

  it('asks for the retina tile a template offers, which is free resolution', () => {
    const retina = 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    const view = tileView(BERLIN, { w: 210, h: 210 }, retina, null)!
    expect(view.tiles[0].url).toContain('@2x')
    expect(view.tiles[0].url).not.toContain('{r}')
  })

  it('leaves a template with no retina placeholder alone', () => {
    const view = tileView(BERLIN, { w: 210, h: 210 }, OSM, null)!
    expect(view.tiles[0].url).not.toContain('@2x')
  })
})

describe('a source with a ceiling', () => {
  /*
   * NASA's imagery stops at level 8. Asking for 9 answers with an error image,
   * which arrives as a page-sized grey rectangle and no explanation.
   */
  it('never asks NASA for a zoom it does not have', () => {
    expect(maxZoomFor(RELIEF)).toBe(8)
    const view = tileView(BERLIN, { w: 420, h: 297 }, RELIEF, null)!
    expect(view.zoom).toBeLessThanOrEqual(8)
  })

  it('lets an ordinary tile source go further', () => {
    expect(maxZoomFor(OSM)).toBe(19)
    const relief = tileView(BERLIN, { w: 210, h: 210 }, RELIEF, null)!
    const tiles = tileView(BERLIN, { w: 210, h: 210 }, OSM, null)!
    expect(tiles.zoom).toBeGreaterThan(relief.zoom)
  })

  it('still honours a zoom the document asked for', () => {
    const view = tileView(ICELAND, { w: 210, h: 297 }, OSM, 6)!
    expect(view.zoom).toBe(6)
  })
})

describe('the credit', () => {
  it('names NASA for its imagery, because a printed book cannot add a footnote later', async () => {
    const { attributionFor } = await import('../../../src/components/Studio/mapTiles')
    expect(attributionFor(RELIEF)).toBe('NASA EOSDIS GIBS')
  })
})

describe('a thumbnail of the same map', () => {
  /*
   * The pages rail and the travel panel draw the same element at about 130px.
   * Cutting those to print resolution would mean a couple of hundred requests
   * for a picture the size of a stamp, every time a panel opens — which
   * against NASA or OpenStreetMap is the bulk fetching their policies ask
   * people not to do.
   */
  it('costs a handful of tiles rather than a page of them', () => {
    const page = tileView(ICELAND, { w: 210, h: 297 }, OSM, null)!
    const thumb = tileView(ICELAND, { w: 210, h: 297 }, OSM, null, undefined, 'preview')!
    expect(thumb.tiles.length).toBeLessThanOrEqual(16)
    expect(thumb.tiles.length).toBeLessThan(page.tiles.length / 4)
  })

  it('still covers the same ground, just less finely', () => {
    const thumb = tileView(ICELAND, { w: 210, h: 297 }, OSM, null, undefined, 'preview')!
    expect(thumb.tiles.length).toBeGreaterThan(0)
    expect(thumb.zoom).toBeLessThan(tileView(ICELAND, { w: 210, h: 297 }, OSM, null)!.zoom)
  })
})
