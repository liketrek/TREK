/**
 * FE-PLACESUGG-001 to FE-PLACESUGG-006: the typed-ahead list both place search
 * shells read from (#2221).
 *
 * The desktop form and the phone sheet both call this hook, so what is pinned here
 * holds for both: plugins are only asked while a search plugin is installed, their
 * rows come after the core ones, a plugin that finds nothing leaves the core answer
 * untouched, a superseded keystroke never lands, and a plugin row is labelled with
 * the plugin's name.
 */
import { createElement, type ReactNode } from 'react'
import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TranslationProvider } from '../i18n/TranslationContext'
import { usePluginStore, type ActivePlugin } from '../store/pluginStore'
import { usePlaceSuggestions } from './usePlaceSuggestions'

const autocomplete = vi.fn()
vi.mock('../api/client', () => ({
  mapsApi: { autocomplete: (...args: unknown[]) => autocomplete(...args) },
  abortedError: () => Object.assign(new Error('canceled'), { name: 'CanceledError', code: 'ERR_CANCELED' }),
}))
const suggest = vi.fn()
vi.mock('../repo/pluginSearchRepo', () => ({ pluginSearchRepo: { suggest: (...args: unknown[]) => suggest(...args) } }))

const BOX = { low: { lat: 35.6, lng: 139.6 }, high: { lat: 35.7, lng: 139.8 } }
const core = {
  suggestions: [{ placeId: 'gers:1', mainText: 'Ichiran', secondaryText: 'Shibuya', source: 'trek-places' }],
  source: 'trek-places',
}
const pluginRow = {
  placeId: 'plugin:all-the-places:ichiran-ueno', mainText: 'Ichiran Ueno', secondaryText: 'Ueno 6-11',
  source: 'plugin:all-the-places', lat: 35.71, lng: 139.77, place: { osm_id: 'plugin:all-the-places:ichiran-ueno' },
}
const plugin = (over: Partial<ActivePlugin>): ActivePlugin => ({ id: 'p', name: 'P', type: 'integration', icon: null, ...over })

const wrapper = ({ children }: { children: ReactNode }) => createElement(TranslationProvider, null, children)

beforeEach(() => {
  autocomplete.mockResolvedValue(core)
  suggest.mockResolvedValue([pluginRow])
})

afterEach(() => {
  vi.clearAllMocks()
  usePluginStore.setState({ plugins: [] })
})

describe('usePlaceSuggestions', () => {
  it('FE-PLACESUGG-001: without a search plugin installed, the plugin route is never asked', async () => {
    usePluginStore.setState({ plugins: [plugin({ id: 'remote-api', name: 'Remote API' })] })
    const { result } = renderHook(() => usePlaceSuggestions(), { wrapper })
    const signal = new AbortController().signal
    expect(await result.current.autocomplete('ichi', 'ja', BOX, signal, 'session-1')).toBe(core)
    expect(autocomplete).toHaveBeenCalledWith('ichi', 'ja', BOX, signal, 'session-1')
    expect(suggest).not.toHaveBeenCalled()
  })

  it('FE-PLACESUGG-002: with one, its rows follow the core rows and it is asked at the centre of the bias', async () => {
    usePluginStore.setState({ plugins: [plugin({ id: 'all-the-places', name: 'All the Places', searchProvider: true })] })
    const { result } = renderHook(() => usePlaceSuggestions(), { wrapper })
    const signal = new AbortController().signal
    const answer = await result.current.autocomplete('ichi', 'ja', BOX, signal)
    expect(answer).toEqual({ ...core, suggestions: [...core.suggestions, pluginRow] })
    expect(suggest).toHaveBeenCalledWith('ichi', 'ja', expect.objectContaining({ lat: expect.closeTo(35.65, 6), lng: expect.closeTo(139.7, 6) }), signal)
  })

  it('FE-PLACESUGG-003: a plugin that finds nothing leaves the core answer as it was', async () => {
    usePluginStore.setState({ plugins: [plugin({ id: 'all-the-places', searchProvider: true })] })
    suggest.mockResolvedValue([])
    const { result } = renderHook(() => usePlaceSuggestions(), { wrapper })
    expect(await result.current.autocomplete('ichi', 'ja', undefined, new AbortController().signal)).toBe(core)
    expect(suggest).toHaveBeenCalledWith('ichi', 'ja', undefined, expect.any(AbortSignal))
  })

  it('FE-PLACESUGG-004: a failing core call still fails the list, whatever the plugins found', async () => {
    usePluginStore.setState({ plugins: [plugin({ id: 'all-the-places', searchProvider: true })] })
    autocomplete.mockRejectedValue(new Error('Network Error'))
    const { result } = renderHook(() => usePlaceSuggestions(), { wrapper })
    await expect(result.current.autocomplete('ichi', 'ja', BOX, new AbortController().signal)).rejects.toThrow('Network Error')
  })

  it('FE-PLACESUGG-006: an answer to a keystroke that was superseded rejects as cancelled, even when both halves arrived', async () => {
    usePluginStore.setState({ plugins: [plugin({ id: 'all-the-places', searchProvider: true })] })
    const superseded = new AbortController()
    suggest.mockImplementation(async () => { superseded.abort(); return [] })
    const { result } = renderHook(() => usePlaceSuggestions(), { wrapper })
    await expect(result.current.autocomplete('ichi', 'ja', BOX, superseded.signal)).rejects.toMatchObject({ name: 'CanceledError' })
  })

  it('FE-PLACESUGG-005: a plugin row is marked with the name the plugin was installed under', () => {
    usePluginStore.setState({ plugins: [plugin({ id: 'all-the-places', name: 'All the Places', searchProvider: true })] })
    const { result } = renderHook(() => usePlaceSuggestions(), { wrapper })
    expect(result.current.sourceLabel(pluginRow, 'trek-places')).toBe('All the Places')
    expect(result.current.sourceLabel(core.suggestions[0], 'trek-places')).toBe('TREK')
  })
})
