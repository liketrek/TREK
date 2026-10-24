// FE-COMP-POICATS-001 to FE-COMP-POICATS-009
import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { MapPin, Signpost, Waves } from 'lucide-react'
import type { PluginPoiCategory } from '@trek/shared'
import { TranslationProvider } from '../../i18n'
import { usePluginStore, type ActivePlugin } from '../../store/pluginStore'
import { useSettingsStore } from '../../store/settingsStore'
import { POI_CATEGORIES } from './poiCategories'
import { POI_DEFAULT_COLOR } from './pluginPoiIcons'
import {
  corePoiCategories,
  findPoiCategory,
  pluginPoiCategories,
  usePoiCategories,
} from './usePoiCategories'

const TRAILHEADS: PluginPoiCategory = {
  id: 'trailheads', label: 'Trailheads', labels: { de: 'Wanderparkplätze' }, icon: 'Signpost', color: '#2f855a',
}
const SWIMMING: PluginPoiCategory = { id: 'swimming', label: 'Swimming spots', icon: 'Waves', color: '#0369a1' }

function plugin(id: string, poiCategories?: PluginPoiCategory[]): ActivePlugin {
  return { id, name: id, type: 'integration', icon: null, ...(poiCategories ? { poiCategories } : {}) }
}

const initialPlugins = usePluginStore.getState()
const initialSettings = useSettingsStore.getState()

// Reset before rather than after: an afterEach would change the language under a hook
// that is still mounted, and the provider would load the other locale outside act.
beforeEach(() => {
  usePluginStore.setState(initialPlugins, true)
  useSettingsStore.setState(initialSettings, true)
})

const wrapper = ({ children }: { children: React.ReactNode }) => <TranslationProvider>{children}</TranslationProvider>

describe('corePoiCategories', () => {
  it('FE-COMP-POICATS-001: the core list in its own order, labels translated', () => {
    const core = corePoiCategories(key => `t:${key}`)
    expect(core.map(c => c.key)).toEqual(POI_CATEGORIES.map(c => c.key))
    expect(core[0]).toEqual({ key: 'restaurant', label: 't:poi.cat.restaurants', Icon: POI_CATEGORIES[0].Icon, color: POI_CATEGORIES[0].color })
    expect(core.every(c => c.pluginId === undefined)).toBe(true)
  })
})

describe('pluginPoiCategories', () => {
  it('FE-COMP-POICATS-002: feed order, then declaration order, each under its namespaced key', () => {
    const cats = pluginPoiCategories([plugin('trail-finder', [TRAILHEADS, SWIMMING]), plugin('flights'), plugin('eco-map', [SWIMMING])], 'en')
    expect(cats.map(c => c.key)).toEqual([
      'plugin:trail-finder/trailheads',
      'plugin:trail-finder/swimming',
      'plugin:eco-map/swimming',
    ])
    expect(cats.map(c => c.pluginId)).toEqual(['trail-finder', 'trail-finder', 'eco-map'])
    expect(cats[0]).toMatchObject({ label: 'Trailheads', Icon: Signpost, color: '#2f855a' })
    expect(cats[1]).toMatchObject({ Icon: Waves, color: '#0369a1' })
  })

  it('FE-COMP-POICATS-003: the label follows the language and falls back to the default', () => {
    const plugins = [plugin('trail-finder', [TRAILHEADS, SWIMMING])]
    expect(pluginPoiCategories(plugins, 'de').map(c => c.label)).toEqual(['Wanderparkplätze', 'Swimming spots'])
    expect(pluginPoiCategories(plugins, 'fr').map(c => c.label)).toEqual(['Trailheads', 'Swimming spots'])
  })

  it('FE-COMP-POICATS-004: a colour or icon that got past the store is checked again', () => {
    const forged = { ...TRAILHEADS, color: 'red;background:url(https://x)', icon: 'Skull' } as unknown as PluginPoiCategory
    const [cat] = pluginPoiCategories([plugin('trail-finder', [forged])], 'en')
    expect(cat.color).toBe(POI_DEFAULT_COLOR)
    expect(cat.Icon).toBe(MapPin)
  })
})

describe('findPoiCategory', () => {
  it('FE-COMP-POICATS-005: finds a core and a plugin chip by key, and nothing for an unknown one', () => {
    const groups = { core: corePoiCategories(k => k), plugin: pluginPoiCategories([plugin('trail-finder', [TRAILHEADS])], 'en') }
    expect(findPoiCategory(groups, 'cafe')?.key).toBe('cafe')
    expect(findPoiCategory(groups, 'plugin:trail-finder/trailheads')?.label).toBe('Trailheads')
    expect(findPoiCategory(groups, 'plugin:trail-finder/swimming')).toBeUndefined()
    expect(findPoiCategory(groups, 'fuel')).toBeUndefined()
  })
})

describe('usePoiCategories', () => {
  it('FE-COMP-POICATS-006: without plugin categories only the core chips, translated', () => {
    const { result } = renderHook(() => usePoiCategories(), { wrapper })
    expect(result.current.core.map(c => c.key)).toEqual(POI_CATEGORIES.map(c => c.key))
    expect(result.current.core[1].label).toBe('Cafés')
    expect(result.current.plugin).toEqual([])
  })

  it('FE-COMP-POICATS-007: follows the plugin feed, so a plugin switched off takes its chips with it', () => {
    usePluginStore.setState({ plugins: [plugin('trail-finder', [TRAILHEADS])] })
    const { result } = renderHook(() => usePoiCategories(), { wrapper })
    expect(result.current.plugin.map(c => c.key)).toEqual(['plugin:trail-finder/trailheads'])

    act(() => { usePluginStore.setState({ plugins: [] }) })
    expect(result.current.plugin).toEqual([])
    expect(result.current.core).toHaveLength(POI_CATEGORIES.length)
  })

  it('FE-COMP-POICATS-008: core and plugin labels both follow the user language', async () => {
    useSettingsStore.setState(s => ({ settings: { ...s.settings, language: 'de' } }))
    usePluginStore.setState({ plugins: [plugin('trail-finder', [TRAILHEADS])] })
    const { result } = renderHook(() => usePoiCategories(), { wrapper })
    expect(result.current.plugin[0].label).toBe('Wanderparkplätze')
    await waitFor(() => expect(result.current.core[5].label).toBe('Museen & Kultur'))
  })

  it('FE-COMP-POICATS-009: keeps the same lists across renders while nothing changed', () => {
    usePluginStore.setState({ plugins: [plugin('trail-finder', [TRAILHEADS])] })
    const { result, rerender } = renderHook(() => usePoiCategories(), { wrapper })
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })
})
