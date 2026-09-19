import { describe, expect, it, vi } from 'vitest'
import type { Poi } from './poiCategories'
import { clusterPois, poiClusterList } from './poiClusters'

const station = (id: string, lng: number): Poi => ({
  osm_id: id, name: id, lat: 48, lng, category: 'charging_station',
  poi_type: 'charging_station', address: null, website: null, phone: null,
  opening_hours: null, cuisine: null, source: 'openstreetmap',
})
const project = (poi: Poi) => ({ x: poi.lng, y: poi.lat })

describe('station clusters', () => {
  it('only clusters in the distant overview, even for coincident stations', () => {
    const pois = [station('a', 1), station('b', 1)]
    expect(clusterPois(pois, project, 8)).toHaveLength(1)
    expect(clusterPois(pois, project, 9)).toHaveLength(2)
    expect(clusterPois(pois, project, 14)).toHaveLength(2)
  })
  it('groups across grid edges, counts unique stations and preserves the originals', () => {
    const a = station('a', 47), b = station('b', 49), c = station('c', 150)
    const groups = clusterPois([c, b, a, a], project)
    expect(groups.map(group => group.pois.length)).toEqual([2, 1])
    expect(groups[0]).toMatchObject({ lat: 48, lng: 48 })
    expect(groups[0].pois[0]).toBe(a)
    expect(a.lng).toBe(47)
    expect(clusterPois([a, b, c], project)).toEqual(groups)
  })

  it('separates stations as their projected distance grows on zoom', () => {
    const pois = [station('a', 1), station('b', 2)]
    expect(clusterPois(pois, project)).toHaveLength(1)
    expect(clusterPois(pois, poi => ({ x: poi.lng * 100, y: 0 }))).toHaveLength(2)
  })

  it('keeps the center near the date line', () => {
    const groups = clusterPois([station('a', 179), station('b', -179)], () => ({ x: 0, y: 0 }))
    expect(groups[0].lng).toBe(180)
  })

  it('offers coincident stations individually without interpreting their names as HTML', () => {
    const poi = { ...station('a', 1), name: '<img src=x>' }
    const select = vi.fn()
    const list = poiClusterList([poi], select)
    expect(list.querySelector('img')).toBeNull()
    expect(list.textContent).toBe(poi.name)
    list.querySelector('button')!.click()
    expect(select).toHaveBeenCalledWith(poi)
  })
})

it('combines nearby small groups into one overview cluster', () => {
  const pois = [station('a', 0), station('b', 3), station('c', 20), station('d', 23), station('e', 40), station('f', 43)]
  expect(clusterPois(pois, project, 8).map(group => group.pois.length)).toEqual([6])
  expect(clusterPois(pois, project, 9)).toHaveLength(6)
})
