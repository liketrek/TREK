// FE-REPO-PLUGINPOI-001 to FE-REPO-PLUGINPOI-005
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PluginPoi } from '@trek/shared'
import { pluginPoiRepo } from './pluginPoiRepo'
import { isEffectivelyOffline } from '../sync/networkMode'
import { pluginPoisApi } from '../api/pluginPois'

vi.mock('../sync/networkMode', () => ({ isEffectivelyOffline: vi.fn(() => false) }))
vi.mock('../api/pluginPois', () => ({ pluginPoisApi: { search: vi.fn() } }))

const BBOX = { south: 47.1, west: 11.2, north: 47.3, east: 11.5 }

const row: PluginPoi = {
  osm_id: 'plugin:trail-finder:th-1', name: 'Hochalm trailhead', lat: 47.2, lng: 11.3,
  category: 'plugin:trail-finder/trailheads', poi_type: 'plugin:trail-finder/trailheads',
  address: 'Almweg 1', website: null, phone: null,
  opening_hours: null, cuisine: null, brand: null, brand_wikidata: null, charging: null,
  source: 'plugin:trail-finder', pluginId: 'trail-finder', rating: 4.5,
  details: [{ label: 'Parking', value: '40 spaces' }], icon: 'Signpost', color: '#2f855a',
}
const reply = { pois: [row], source: 'plugin:trail-finder', truncated: false, clamped: true }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(isEffectivelyOffline).mockReturnValue(false)
  vi.mocked(pluginPoisApi.search).mockResolvedValue(reply)
})

describe('pluginPoiRepo.search', () => {
  it('FE-REPO-PLUGINPOI-001: asks the api for the one plugin and category, with the signal', async () => {
    const signal = new AbortController().signal
    const found = await pluginPoiRepo.search('trail-finder', 'trailheads', BBOX, 'de', signal)
    expect(pluginPoisApi.search).toHaveBeenCalledWith('trail-finder', 'trailheads', BBOX, 'de', signal)
    expect(found).toEqual(reply)
  })

  it('FE-REPO-PLUGINPOI-002: offline it refuses without making the request', async () => {
    vi.mocked(isEffectivelyOffline).mockReturnValue(true)
    await expect(pluginPoiRepo.search('trail-finder', 'trailheads', BBOX, 'en', new AbortController().signal))
      .rejects.toThrow('requires a connection')
    expect(pluginPoisApi.search).not.toHaveBeenCalled()
  })

  it('FE-REPO-PLUGINPOI-003: an answer off the contract is rejected, not drawn', async () => {
    // A colour that is not #rrggbb would end up inside marker markup.
    vi.mocked(pluginPoisApi.search).mockResolvedValue({ ...reply, pois: [{ ...row, color: 'red;background:url(x)' }] })
    await expect(pluginPoiRepo.search('trail-finder', 'trailheads', BBOX, 'en', new AbortController().signal)).rejects.toThrow()
    vi.mocked(pluginPoisApi.search).mockResolvedValue({ ...reply, pois: [{ ...row, icon: 'Skull' }] } as never)
    await expect(pluginPoiRepo.search('trail-finder', 'trailheads', BBOX, 'en', new AbortController().signal)).rejects.toThrow()
  })

  it('FE-REPO-PLUGINPOI-004: an api failure reaches the caller unchanged', async () => {
    const failure = Object.assign(new Error('Request failed with status code 404'), { response: { status: 404 } })
    vi.mocked(pluginPoisApi.search).mockRejectedValue(failure)
    await expect(pluginPoiRepo.search('trail-finder', 'trailheads', BBOX, 'en', new AbortController().signal)).rejects.toBe(failure)
  })

  it('FE-REPO-PLUGINPOI-005: hands back the rows as the map draws them, contact fields kept or null', async () => {
    const contact = { ...row, osm_id: 'plugin:trail-finder:th-2', address: null, website: 'https://example.test/th-2', phone: '+43 1 234' }
    vi.mocked(pluginPoisApi.search).mockResolvedValue({ ...reply, pois: [row, contact] })
    const { pois } = await pluginPoiRepo.search('trail-finder', 'trailheads', BBOX, 'en', new AbortController().signal)
    expect(pois.map(p => [p.address, p.website, p.phone])).toEqual([
      ['Almweg 1', null, null],
      [null, 'https://example.test/th-2', '+43 1 234'],
    ])
    expect(pois[1]).toMatchObject({ details: row.details, icon: 'Signpost', color: '#2f855a', pluginId: 'trail-finder' })
  })
})
