// FE-COMP-PLACEPOPUP-001 to FE-COMP-PLACEPOPUP-014
import { describe, it, expect } from 'vitest'
import { buildPlacePopupHtml, buildPoiPopupHtml } from './placePopup'
import { buildPlace } from '../../../tests/helpers/factories'
import type { Poi } from './poiCategories'
import type { Place } from '../../types'

type PopupPlace = Place & {
  category_color?: string | null
  category_icon?: string | null
  category_name?: string | null
}

function popupPlace(overrides: Partial<PopupPlace> = {}): PopupPlace {
  return {
    ...buildPlace(),
    category_color: null,
    category_icon: null,
    category_name: null,
    ...overrides,
  } as PopupPlace
}

function poi(overrides: Partial<Poi> = {}): Poi {
  return {
    osm_id: 'node/1',
    name: 'Café Central',
    lat: 48.21,
    lng: 16.36,
    category: 'cafe',
    poi_type: 'cafe',
    address: null,
    website: null,
    phone: null,
    opening_hours: null,
    cuisine: null,
    source: 'openstreetmap',
    ...overrides,
  }
}

describe('buildPlacePopupHtml', () => {
  it('FE-COMP-PLACEPOPUP-001: renders the name and nothing else for a bare place', () => {
    const html = buildPlacePopupHtml(popupPlace({ name: 'Louvre', address: null }), null)
    expect(html).toContain('Louvre')
    expect(html).not.toContain('<img')
    expect(html).not.toContain('<svg')
  })

  it('FE-COMP-PLACEPOPUP-002: escapes HTML metacharacters in the name', () => {
    const html = buildPlacePopupHtml(popupPlace({ name: 'Bar & "Grill" <b>x</b>' }), null)
    expect(html).toContain('Bar &amp; &quot;Grill&quot; &lt;b&gt;x&lt;/b&gt;')
    expect(html).not.toContain('<b>x</b>')
  })

  it('FE-COMP-PLACEPOPUP-003: embeds a data: thumbnail as an img', () => {
    const html = buildPlacePopupHtml(popupPlace(), 'data:image/jpeg;base64,AAAA')
    expect(html).toContain('<img src="data:image/jpeg;base64,AAAA"')
  })

  it('FE-COMP-PLACEPOPUP-004: embeds a photo-proxy URL as an img', () => {
    const html = buildPlacePopupHtml(popupPlace(), '/api/maps/place-photo/abc123')
    expect(html).toContain('<img src="/api/maps/place-photo/abc123"')
  })

  it('FE-COMP-PLACEPOPUP-005: ignores a foreign photo URL — it is a fetch seed, not a src', () => {
    const html = buildPlacePopupHtml(popupPlace(), 'https://lh3.googleusercontent.com/p/AF1')
    expect(html).not.toContain('<img')
  })

  it('FE-COMP-PLACEPOPUP-006: renders the category row with an inline icon svg', () => {
    const html = buildPlacePopupHtml(
      popupPlace({ category_name: 'Museum', category_icon: 'Landmark', category_color: '#6366F1' }),
      null,
    )
    expect(html).toContain('Museum')
    expect(html).toContain('<svg')
    expect(html).toContain('#6366F1')
  })

  it('FE-COMP-PLACEPOPUP-007: an unknown icon name falls back to the MapPin glyph', () => {
    const known = buildPlacePopupHtml(popupPlace({ category_name: 'X', category_icon: 'MapPin' }), null)
    const unknown = buildPlacePopupHtml(popupPlace({ category_name: 'X', category_icon: 'NoSuchIcon' }), null)
    const svgOf = (s: string) => s.slice(s.indexOf('<svg'), s.indexOf('</svg>'))
    expect(svgOf(unknown)).toBe(svgOf(known))
  })

  it('FE-COMP-PLACEPOPUP-008: a category without an icon draws no category row', () => {
    const html = buildPlacePopupHtml(popupPlace({ category_name: 'Museum', category_icon: null }), null)
    expect(html).not.toContain('Museum')
    expect(html).not.toContain('<svg')
  })

  it('FE-COMP-PLACEPOPUP-009: an icon without a category name draws no category row', () => {
    const html = buildPlacePopupHtml(popupPlace({ category_name: null, category_icon: 'Landmark' }), null)
    expect(html).not.toContain('<svg')
  })

  it('FE-COMP-PLACEPOPUP-010: renders and escapes the address', () => {
    const html = buildPlacePopupHtml(popupPlace({ address: 'Rue <A> & B' }), null)
    expect(html).toContain('Rue &lt;A&gt; &amp; B')
  })

  it('FE-COMP-PLACEPOPUP-011: a category icon with no colour falls back to grey', () => {
    const html = buildPlacePopupHtml(
      popupPlace({ category_name: 'Museum', category_icon: 'Landmark', category_color: null }),
      null,
    )
    expect(html).toContain('#6b7280')
  })
})

describe('buildPoiPopupHtml', () => {
  it('FE-COMP-PLACEPOPUP-012: renders the POI name with its category-coloured icon', () => {
    const html = buildPoiPopupHtml(poi({ name: 'Café Central', category: 'cafe' }))
    expect(html).toContain('Café Central')
    expect(html).toContain('<svg')
    // cafe → #B45309 in POI_CATEGORIES
    expect(html).toContain('#B45309')
  })

  it('FE-COMP-PLACEPOPUP-013: an unknown category renders no icon and the grey fallback', () => {
    const html = buildPoiPopupHtml(poi({ category: 'not-a-category', name: 'Somewhere' }))
    expect(html).not.toContain('<svg')
    expect(html).toContain('Somewhere')
  })

  it('FE-COMP-PLACEPOPUP-014: escapes the POI address and omits it when absent', () => {
    expect(buildPoiPopupHtml(poi({ address: null }))).not.toContain('margin-top:3px')
    expect(buildPoiPopupHtml(poi({ address: 'Herrengasse 14 & 16' }))).toContain('Herrengasse 14 &amp; 16')
  })
})
