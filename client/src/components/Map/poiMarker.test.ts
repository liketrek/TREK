// FE-COMP-POIMARKER-001 to FE-COMP-POIMARKER-008
import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { Coffee, MapPin, Signpost, type LucideIcon } from 'lucide-react'
import { PLUGIN_POI_DETAILS_MAX } from '@trek/shared'
import { renderIconMarkup } from '../../utils/iconMarkup'
import { POI_CATEGORIES } from './poiCategories'
import { POI_DEFAULT_COLOR } from './pluginPoiIcons'
import { poiDetailRowKey, poiDetailRows, poiPinCacheKey, poiPinParts } from './poiMarker'

const PLUGIN_KEY = 'plugin:trail-finder/trailheads'
const coreColor = (key: string) => POI_CATEGORIES.find(c => c.key === key)?.color
const glyph = (Icon: LucideIcon) => renderIconMarkup(createElement(Icon, { size: 13, color: 'white', strokeWidth: 2.5 }))

describe('poiPinParts', () => {
  it('FE-COMP-POIMARKER-001: a core category keeps the colour and glyph it has always had', () => {
    expect(poiPinParts({ category: 'cafe' })).toEqual({ color: coreColor('cafe'), svg: glyph(Coffee) })
    // An unknown category is the grey disc without a glyph, as before.
    expect(poiPinParts({ category: 'spaceport' })).toEqual({ color: POI_DEFAULT_COLOR, svg: '' })
  })

  it('FE-COMP-POIMARKER-002: a plugin POI is drawn with its own colour and allow-listed icon', () => {
    expect(poiPinParts({ category: PLUGIN_KEY, color: '#2f855a', icon: 'Signpost' })).toEqual({ color: '#2f855a', svg: glyph(Signpost) })
  })

  it('FE-COMP-POIMARKER-003: a colour or icon that fails the checks never reaches the markup', () => {
    const parts = poiPinParts({ category: PLUGIN_KEY, color: 'red;background:url(https://evil.example/x)', icon: '<img src=x onerror=alert(1)>' })
    expect(parts).toEqual({ color: POI_DEFAULT_COLOR, svg: glyph(MapPin) })
    expect(parts.svg).not.toContain('evil')
    expect(parts.svg).not.toContain('<img')
  })
})

describe('poiPinCacheKey', () => {
  it('FE-COMP-POIMARKER-004: a core category is cached under its key alone', () => {
    expect(poiPinCacheKey({ category: 'museum', color: '#123456', icon: 'Star' })).toBe('museum')
    expect(poiPinCacheKey({ category: 'spaceport' })).toBe('spaceport')
  })

  it('FE-COMP-POIMARKER-005: a plugin category adds its checked colour and icon to the key', () => {
    const key = poiPinCacheKey({ category: PLUGIN_KEY, color: '#2f855a', icon: 'Signpost' })
    expect(key).toBe(`${PLUGIN_KEY}|#2f855a|Signpost`)
    // A plugin update that changes the look is a new pin, not the one cached before it.
    expect(poiPinCacheKey({ category: PLUGIN_KEY, color: '#c53030', icon: 'Signpost' })).not.toBe(key)
    expect(poiPinCacheKey({ category: PLUGIN_KEY, color: '#2f855a', icon: 'Mountain' })).not.toBe(key)
    // Values that fail the checks are keyed by what is drawn instead: the grey and no icon name.
    expect(poiPinCacheKey({ category: PLUGIN_KEY, color: 'url(x)', icon: 'Skull' })).toBe(`${PLUGIN_KEY}|${POI_DEFAULT_COLOR}|`)
  })
})

describe('poiDetailRows', () => {
  it('FE-COMP-POIMARKER-006: a POI without details has no rows', () => {
    expect(poiDetailRows({})).toEqual([])
    expect(poiDetailRows({ details: undefined })).toEqual([])
    expect(poiDetailRows({ details: 'Length: 3 km' as never })).toEqual([])
  })

  it('FE-COMP-POIMARKER-007: rows are capped at the contract limit and a repeated one shows once', () => {
    const rows = Array.from({ length: PLUGIN_POI_DETAILS_MAX + 3 }, (_, i) => ({ label: `L${i}`, value: `V${i}` }))
    expect(poiDetailRows({ details: rows })).toEqual(rows.slice(0, PLUGIN_POI_DETAILS_MAX))
    const repeated = [{ label: 'Length', value: '3 km' }, { label: 'Length', value: '3 km' }, { label: 'Length', value: '5 km' }]
    expect(poiDetailRows({ details: repeated })).toEqual([repeated[0], repeated[2]])
  })

  it('FE-COMP-POIMARKER-008: the row key tells label and value apart', () => {
    expect(poiDetailRowKey({ label: 'a', value: 'bc' })).not.toBe(poiDetailRowKey({ label: 'ab', value: 'c' }))
  })
})
