// FE-API-PLUGINPOIS-001 to FE-API-PLUGINPOIS-003
import { describe, it, expect, vi, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../tests/helpers/msw/server'
import { pluginPoisApi } from './pluginPois'

const BBOX = { south: 47.1, west: 11.2, north: 47.3, east: 11.5 }
const reply = {
  pois: [{
    osm_id: 'plugin:trail-finder:th-1', name: 'Hochalm trailhead', lat: 47.2, lng: 11.3,
    category: 'plugin:trail-finder/trailheads', poi_type: 'plugin:trail-finder/trailheads',
    address: null, website: null, phone: null,
    opening_hours: null, cuisine: null, brand: null, brand_wikidata: null, charging: null,
    source: 'plugin:trail-finder', pluginId: 'trail-finder', rating: null,
    details: [], icon: 'Signpost', color: '#2f855a',
  }],
  source: 'plugin:trail-finder',
  truncated: false,
  clamped: false,
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('pluginPoisApi.search', () => {
  it('FE-API-PLUGINPOIS-001: asks GET /api/plugin-pois with the plugin, category, box and language', async () => {
    let url = ''
    server.use(http.get('/api/plugin-pois', ({ request }) => {
      url = request.url
      return HttpResponse.json(reply)
    }))
    expect(await pluginPoisApi.search('trail-finder', 'trailheads', BBOX, 'de')).toEqual(reply)
    const params = new URL(url).searchParams
    expect(Object.fromEntries(params)).toEqual({
      pluginId: 'trail-finder', category: 'trailheads',
      south: '47.1', west: '11.2', north: '47.3', east: '11.5', lang: 'de',
    })
  })

  it('FE-API-PLUGINPOIS-002: a drifting answer still passes through, with a warning in development', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const drifted = { ...reply, pois: [{ ...reply.pois[0], color: 'red' }] }
    server.use(http.get('/api/plugin-pois', () => HttpResponse.json(drifted)))
    expect(await pluginPoisApi.search('trail-finder', 'trailheads', BBOX, undefined)).toEqual(drifted)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('pluginPois.search'), expect.anything())
  })

  it('FE-API-PLUGINPOIS-003: rejects with the server error', async () => {
    server.use(http.get('/api/plugin-pois', () => HttpResponse.json({ error: 'Unknown POI category' }, { status: 404 })))
    await expect(pluginPoisApi.search('trail-finder', 'gone', BBOX, 'en')).rejects.toMatchObject({ response: { status: 404 } })
  })
})
