// FE-REPO-PLUGINSEARCH-001 to FE-REPO-PLUGINSEARCH-006
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { delay, http, HttpResponse } from 'msw'
import type { PluginSearchHit } from '@trek/shared'
import { server } from '../../tests/helpers/msw/server'
import { PLUGIN_SUGGEST_DEADLINE_MS, pluginSearchRepo } from './pluginSearchRepo'
import { isEffectivelyOffline } from '../sync/networkMode'

vi.mock('../sync/networkMode', () => ({ isEffectivelyOffline: vi.fn(() => false) }))

const hit: PluginSearchHit = {
  osm_id: 'plugin:all-the-places:ichiran-shibuya', name: 'Ichiran Shibuya', address: 'Jinnan 1-22-7, Shibuya',
  lat: 35.6617, lng: 139.6993, rating: 4.4, website: 'https://ichiran.com', phone: null,
  category: 'restaurant', description: null, source: 'plugin:all-the-places', pluginId: 'all-the-places',
}

beforeEach(() => {
  vi.mocked(isEffectivelyOffline).mockReturnValue(false)
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('pluginSearchRepo.suggest', () => {
  it('FE-REPO-PLUGINSEARCH-001: asks the typed-ahead route with the query, language and bias, and hands back rows that carry their place', async () => {
    let url: URL | null = null
    server.use(http.get('/api/plugin-search/suggest', ({ request }) => {
      url = new URL(request.url)
      return HttpResponse.json({ places: [hit] })
    }))
    const rows = await pluginSearchRepo.suggest('ichi', 'ja', { lat: 35.66, lng: 139.7 }, new AbortController().signal)
    expect(Object.fromEntries(url!.searchParams)).toEqual({ q: 'ichi', lang: 'ja', lat: '35.66', lng: '139.7' })
    expect(rows).toEqual([{
      placeId: 'plugin:all-the-places:ichiran-shibuya',
      mainText: 'Ichiran Shibuya',
      secondaryText: 'Jinnan 1-22-7, Shibuya',
      source: 'plugin:all-the-places',
      lat: 35.6617,
      lng: 139.6993,
      place: hit,
    }])
  })

  it('FE-REPO-PLUGINSEARCH-002: sends no bias when the trip has nowhere to point to', async () => {
    let url: URL | null = null
    server.use(http.get('/api/plugin-search/suggest', ({ request }) => {
      url = new URL(request.url)
      return HttpResponse.json({ places: [] })
    }))
    await pluginSearchRepo.suggest('ichi', 'en', undefined, new AbortController().signal)
    expect(url!.searchParams.has('lat')).toBe(false)
    expect(url!.searchParams.has('lng')).toBe(false)
  })

  it('FE-REPO-PLUGINSEARCH-003: offline it answers empty without making the request', async () => {
    vi.mocked(isEffectivelyOffline).mockReturnValue(true)
    const asked = vi.fn()
    server.use(http.get('/api/plugin-search/suggest', () => { asked(); return HttpResponse.json({ places: [hit] }) }))
    expect(await pluginSearchRepo.suggest('ichi', 'en', undefined, new AbortController().signal)).toEqual([])
    expect(asked).not.toHaveBeenCalled()
  })

  it('FE-REPO-PLUGINSEARCH-004: an answer off the contract is dropped whole, not drawn', async () => {
    server.use(http.get('/api/plugin-search/suggest', () =>
      HttpResponse.json({ places: [{ ...hit, osm_id: 'node:1' }] })))
    expect(await pluginSearchRepo.suggest('ichi', 'en', undefined, new AbortController().signal)).toEqual([])
    server.use(http.get('/api/plugin-search/suggest', () =>
      HttpResponse.json({ places: [hit, hit, hit, hit] })))
    expect(await pluginSearchRepo.suggest('ichi', 'en', undefined, new AbortController().signal)).toEqual([])
  })

  it('FE-REPO-PLUGINSEARCH-005: a failing route or an aborted keystroke is an empty list, never a rejection', async () => {
    server.use(http.get('/api/plugin-search/suggest', () => HttpResponse.json({ error: 'boom' }, { status: 500 })))
    expect(await pluginSearchRepo.suggest('ichi', 'en', undefined, new AbortController().signal)).toEqual([])

    server.use(http.get('/api/plugin-search/suggest', () => HttpResponse.json({ places: [hit] })))
    const superseded = new AbortController()
    superseded.abort()
    expect(await pluginSearchRepo.suggest('ichi', 'en', undefined, superseded.signal)).toEqual([])
  })

  it('FE-REPO-PLUGINSEARCH-006: a plugin that misses the deadline costs its rows, not the list', async () => {
    server.use(http.get('/api/plugin-search/suggest', async () => {
      await delay(PLUGIN_SUGGEST_DEADLINE_MS + 500)
      return HttpResponse.json({ places: [hit] })
    }))
    const started = Date.now()
    expect(await pluginSearchRepo.suggest('ichi', 'en', undefined, new AbortController().signal)).toEqual([])
    expect(Date.now() - started).toBeLessThan(PLUGIN_SUGGEST_DEADLINE_MS + 400)
  })
})
