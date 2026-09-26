// FE-COMP-POIAPPEAR-001 to FE-COMP-POIAPPEAR-005
import { describe, it, expect } from 'vitest'
import { Coffee, Fuel, MapPin, Signpost } from 'lucide-react'
import { poiAppearance, POI_CATEGORIES, ROADTRIP_POI_CATEGORIES } from './poiCategories'
import { POI_DEFAULT_COLOR } from './pluginPoiIcons'

const PLUGIN_KEY = 'plugin:trail-finder/trailheads'
const coreColor = (key: string) => [...POI_CATEGORIES, ...ROADTRIP_POI_CATEGORIES].find(c => c.key === key)?.color

describe('poiAppearance', () => {
  it('FE-COMP-POIAPPEAR-001: a core category is drawn with its own colour and icon', () => {
    expect(poiAppearance({ category: 'cafe' })).toEqual({ color: coreColor('cafe'), Icon: Coffee })
  })

  it('FE-COMP-POIAPPEAR-002: a road trip category keeps its look, even for a plugin hit with its own colour', () => {
    // The corridor search asks plugins for core kinds; their hits answer `fuel`, not a plugin key.
    expect(poiAppearance({ category: 'fuel', color: '#123456', icon: 'Star' })).toEqual({ color: coreColor('fuel'), Icon: Fuel })
  })

  it('FE-COMP-POIAPPEAR-003: a plugin category is drawn with the colour and icon its POI carries', () => {
    expect(poiAppearance({ category: PLUGIN_KEY, color: '#2f855a', icon: 'Signpost' })).toEqual({ color: '#2f855a', Icon: Signpost })
  })

  it('FE-COMP-POIAPPEAR-004: a plugin POI with a colour or icon that fails the checks is grey with a pin', () => {
    expect(poiAppearance({ category: PLUGIN_KEY, color: 'red;background:url(x)', icon: 'Skull' })).toEqual({ color: POI_DEFAULT_COLOR, Icon: MapPin })
    expect(poiAppearance({ category: PLUGIN_KEY })).toEqual({ color: POI_DEFAULT_COLOR, Icon: MapPin })
  })

  it('FE-COMP-POIAPPEAR-005: an unknown category, prototype names included, is the plain grey disc', () => {
    for (const category of ['unknown', 'constructor', 'toString', 'plugin:trail-finder', 'plugin:TF/x']) {
      expect(poiAppearance({ category, color: '#2f855a', icon: 'Signpost' })).toEqual({ color: POI_DEFAULT_COLOR, Icon: null })
    }
  })
})
