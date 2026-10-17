// FE-COMP-PLACEPOPUP-001 to FE-COMP-PLACEPOPUP-021
import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { Coffee, MapPin, Signpost, type LucideIcon } from 'lucide-react'
import { renderIconMarkup } from '../../utils/iconMarkup'
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

  it('FE-COMP-PLACEPOPUP-021: a place without a name keeps an empty name line, never the word undefined', () => {
    const html = buildPlacePopupHtml(popupPlace({ name: undefined as never, address: null }), null)
    // The name line is there and empty.
    expect(html).toContain('white-space:nowrap;"></div>')
    expect(html).not.toContain('undefined')
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

describe('buildPoiPopupHtml looks and plugin details', () => {
  const PLUGIN_KEY = 'plugin:trail-finder/trailheads'
  const icon = (Icon: LucideIcon, color: string) => renderIconMarkup(createElement(Icon, { size: 12, color, strokeWidth: 2 }))
  const parse = (html: string) => {
    const box = document.createElement('div')
    box.innerHTML = html
    return box
  }

  it('FE-COMP-PLACEPOPUP-015: a core POI card is the one it always was, with no details block', () => {
    const html = buildPoiPopupHtml(poi({ name: 'Café Central', category: 'cafe', address: 'Herrengasse 14' }))
    expect(html).toBe(
      '<div style="font-family:var(--font-system);max-width:220px;">'
      + `<div style="display:flex;align-items:center;gap:5px;"><span style="flex-shrink:0;display:inline-flex;line-height:0;">${icon(Coffee, '#B45309')}</span>`
      + '<span style="font-weight:600;font-size:12.5px;color:#111827;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">Café Central</span></div>'
      + '<div style="font-size:11px;color:#9ca3af;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">Herrengasse 14</div></div>',
    )
  })

  it('FE-COMP-PLACEPOPUP-016: shows the icon and colour the POI carries and its detail rows in order', () => {
    const html = buildPoiPopupHtml(poi({
      category: PLUGIN_KEY, name: 'Trailhead', color: '#2f855a', icon: 'Signpost',
      details: [{ label: 'Length', value: '12.4 km' }, { label: 'Step-free', value: 'Yes' }],
    }))
    expect(html).toContain(icon(Signpost, '#2f855a'))
    const cells = [...parse(html).querySelectorAll('div[style*="grid-template-columns"] > span')].map(el => el.textContent)
    expect(cells).toEqual(['Length', '12.4 km', 'Step-free', 'Yes'])
  })

  it('FE-COMP-PLACEPOPUP-017: markup in the name, the address and the details stays text', () => {
    const html = buildPoiPopupHtml(poi({
      category: PLUGIN_KEY,
      name: '<img src=x onerror=alert(1)>',
      address: '</div><script>alert(2)</script>',
      color: '#2f855a', icon: 'Signpost',
      details: [{ label: '<b onclick=alert(3)>Fee</b>', value: '"><svg onload=alert(4)>' }],
    }))
    const box = parse(html)
    expect(box.querySelectorAll('img, script, b')).toHaveLength(0)
    // The only svg is the category glyph, never one a value smuggled in.
    expect(box.querySelectorAll('svg')).toHaveLength(1)
    expect(box.textContent).toContain('<img src=x onerror=alert(1)>')
    expect(box.textContent).toContain('<b onclick=alert(3)>Fee</b>')
    expect(box.textContent).toContain('"><svg onload=alert(4)>')
  })

  it('FE-COMP-PLACEPOPUP-018: a colour or icon that fails the checks is drawn grey with a pin', () => {
    const html = buildPoiPopupHtml(poi({
      category: PLUGIN_KEY, color: 'red;background:url(https://evil.example/x)', icon: '<img src=x onerror=alert(1)>',
    }))
    expect(html).toContain(icon(MapPin, '#6b7280'))
    expect(html).not.toContain('evil.example')
    expect(parse(html).querySelectorAll('img')).toHaveLength(0)
  })

  it('FE-COMP-PLACEPOPUP-019: shows at most the six rows the contract allows', () => {
    const details = Array.from({ length: 9 }, (_, i) => ({ label: `Row ${i}`, value: String(i) }))
    const html = buildPoiPopupHtml(poi({ category: PLUGIN_KEY, color: '#2f855a', icon: 'Signpost', details }))
    expect(parse(html).querySelectorAll('div[style*="grid-template-columns"] > span')).toHaveLength(12)
    expect(html).not.toContain('Row 6')
  })

  it('FE-COMP-PLACEPOPUP-020: a long label wraps inside a capped column and leaves its value the wider share', () => {
    const html = buildPoiPopupHtml(poi({
      category: PLUGIN_KEY, color: '#2f855a', icon: 'Signpost',
      details: [{ label: 'Wheelchair accessible toilet, ground fl', value: 'Step-free via the side door on the left' }],
    }))
    const grid = parse(html).querySelector<HTMLElement>('div[style*="grid-template-columns"]')!
    expect(grid.style.gridTemplateColumns).toBe('fit-content(45%) 1fr')
    const [label, value] = [...grid.querySelectorAll<HTMLElement>(':scope > span')]
    expect(label.style.overflowWrap).toBe('anywhere')
    expect(value.style.overflowWrap).toBe('anywhere')
  })
})
