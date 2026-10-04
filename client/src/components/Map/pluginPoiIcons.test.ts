// FE-COMP-PLUGINPOIICON-001 to FE-COMP-PLUGINPOIICON-004
import { describe, it, expect } from 'vitest'
import * as Lucide from 'lucide-react'
import { MapPin, Signpost } from 'lucide-react'
import { PLUGIN_POI_ICONS } from '@trek/shared'
import { POI_DEFAULT_COLOR, pluginPoiColor, resolvePluginPoiIcon } from './pluginPoiIcons'

describe('resolvePluginPoiIcon', () => {
  it('FE-COMP-PLUGINPOIICON-001: every allow-listed name resolves to the lucide icon of that name', () => {
    const lucide = Lucide as unknown as Record<string, unknown>
    for (const name of PLUGIN_POI_ICONS) expect(resolvePluginPoiIcon(name)).toBe(lucide[name])
    expect(resolvePluginPoiIcon('Signpost')).toBe(Signpost)
  })

  it('FE-COMP-PLUGINPOIICON-002: anything off the list is a pin, never a lucide export of that name', () => {
    // Real lucide exports, just not on the list, and names that are not icons at all.
    for (const name of ['Skull', 'Blocks', 'createLucideIcon', 'icons', 'toString', '', null, undefined, 42]) {
      expect(resolvePluginPoiIcon(name)).toBe(MapPin)
    }
  })
})

describe('pluginPoiColor', () => {
  it('FE-COMP-PLUGINPOIICON-003: a #rrggbb colour passes through unchanged', () => {
    expect(pluginPoiColor('#2f855a')).toBe('#2f855a')
    expect(pluginPoiColor('#2F855A')).toBe('#2F855A')
  })

  it('FE-COMP-PLUGINPOIICON-004: anything else is the default grey, markup included', () => {
    for (const value of ['red', '#fff', '#2f855a;background:url(https://x)', 'url(https://x)', '"><script>', '', null, 7]) {
      expect(pluginPoiColor(value)).toBe(POI_DEFAULT_COLOR)
    }
  })
})
