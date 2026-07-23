import { describe, it, expect } from 'vitest'
import { filterPool, poolCounts } from './placesBrowserModel'
import type { Place } from '../../../../types'

const mkPlace = (id: number, over: Partial<Place> = {}): Place =>
  ({ id, name: `Place ${id}`, lat: 0, lng: 0, address: null, category_id: null, ...over } as Place)

describe('placesBrowserModel — planned pool', () => {
  const places = [mkPlace(1), mkPlace(2), mkPlace(3)]
  const plannedIds = new Set([1, 3]) // 1 and 3 are assigned to a day
  const noCats = new Set<string>()

  it('MOBILE-POOL-planned: keeps only planned places', () => {
    const out = filterPool(places, { filter: 'planned', categoryFilters: noCats, search: '', plannedIds })
    expect(out.map(p => p.id)).toEqual([1, 3])
  })

  it('MOBILE-POOL-unplanned: keeps only unplanned places (unchanged)', () => {
    const out = filterPool(places, { filter: 'unplanned', categoryFilters: noCats, search: '', plannedIds })
    expect(out.map(p => p.id)).toEqual([2])
  })

  it('MOBILE-POOL-all: keeps everything', () => {
    const out = filterPool(places, { filter: 'all', categoryFilters: noCats, search: '', plannedIds })
    expect(out.map(p => p.id)).toEqual([1, 2, 3])
  })

  it('MOBILE-POOL-planned+search: planned pool still honors the search box', () => {
    const named = [mkPlace(1, { name: 'Louvre' }), mkPlace(3, { name: 'Eiffel' })]
    const out = filterPool(named, { filter: 'planned', categoryFilters: noCats, search: 'eiff', plannedIds })
    expect(out.map(p => p.id)).toEqual([3])
  })

  it('MOBILE-POOL-counts: poolCounts reports planned alongside all/unplanned', () => {
    const c = poolCounts(places, noCats, '', plannedIds)
    expect(c.all).toBe(3)
    expect(c.planned).toBe(2)
    expect(c.unplanned).toBe(1)
  })
})
