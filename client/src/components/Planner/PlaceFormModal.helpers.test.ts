import { describe, it, expect } from 'vitest'
import {
  DEFAULT_FORM, endsBeforeStart, findDuplicatePlace, isAmapUrl, isGoogleMapsUrl, isMapUrl, parseCoordinatePair,
  timeCollisions,
} from './PlaceFormModal.helpers'
import { formPin } from './PlaceFormModal.helpers'

describe('isGoogleMapsUrl', () => {
  it('accepts the short share hosts', () => {
    expect(isGoogleMapsUrl('https://maps.app.goo.gl/abc123')).toBe(true)
    expect(isGoogleMapsUrl('https://goo.gl/maps/xyz')).toBe(true)
  })

  it('rejects goo.gl links that are not /maps', () => {
    expect(isGoogleMapsUrl('https://goo.gl/something')).toBe(false)
  })

  it('accepts maps.google.<tld> and maps.google.<sld>.<tld>', () => {
    expect(isGoogleMapsUrl('https://maps.google.com/?q=eiffel')).toBe(true)
    expect(isGoogleMapsUrl('https://maps.google.co.uk/?q=eiffel')).toBe(true)
  })

  it('accepts google.<tld>/maps with optional www', () => {
    expect(isGoogleMapsUrl('https://google.com/maps/place/Eiffel')).toBe(true)
    expect(isGoogleMapsUrl('https://www.google.co.uk/maps')).toBe(true)
  })

  it('rejects google.<tld> without a /maps path', () => {
    expect(isGoogleMapsUrl('https://google.com/search?q=eiffel')).toBe(false)
  })

  it('rejects spoofed hosts like maps.google.evil.com', () => {
    expect(isGoogleMapsUrl('https://maps.google.evil.com/maps')).toBe(false)
  })

  it('returns false for non-URL input', () => {
    expect(isGoogleMapsUrl('not a url')).toBe(false)
    expect(isGoogleMapsUrl('')).toBe(false)
    expect(isGoogleMapsUrl('Eiffel Tower')).toBe(false)
  })

  it('trims surrounding whitespace before parsing', () => {
    expect(isGoogleMapsUrl('  https://maps.app.goo.gl/abc123  ')).toBe(true)
  })
})

describe('isAmapUrl', () => {
  it('accepts the share, web and short-link hosts', () => {
    expect(isAmapUrl('https://uri.amap.com/marker?position=116.397,39.908&name=天安门')).toBe(true)
    expect(isAmapUrl('https://www.amap.com/place/B000A7BD6C')).toBe(true)
    expect(isAmapUrl('https://surl.amap.com/abc')).toBe(true)
  })

  it('is an exact host list, so a lookalike stays a search query', () => {
    expect(isAmapUrl('https://amap.com.evil.example/place/x')).toBe(false)
    expect(isAmapUrl('https://restapi.amap.com/v3/place/text')).toBe(false)
    expect(isAmapUrl('天安门')).toBe(false)
  })
})

describe('isMapUrl', () => {
  it('sends either provider\'s link to the resolver and nothing else', () => {
    expect(isMapUrl('https://maps.app.goo.gl/abc123')).toBe(true)
    expect(isMapUrl('https://uri.amap.com/marker?position=116.397,39.908')).toBe(true)
    expect(isMapUrl('https://example.com/maps')).toBe(false)
  })
})

describe('findDuplicatePlace', () => {
  const form = (over: Partial<typeof DEFAULT_FORM>) => ({ ...DEFAULT_FORM, ...over })

  it('matches a name case- and space-insensitively', () => {
    expect(findDuplicatePlace(form({ name: '  louvre ' }), [{ name: 'Louvre' }])).toEqual({ name: 'Louvre' })
  })

  it('matches a shared Google place id whatever the name', () => {
    const hit = { name: 'Other', google_place_id: 'gp-1' }
    expect(findDuplicatePlace(form({ name: 'New', google_place_id: 'gp-1' }), [hit])).toBe(hit)
  })

  it('matches coordinates within about eleven metres, and not beyond', () => {
    const near = { name: 'Tour Eiffel', lat: 48.8584, lng: 2.2945 }
    expect(findDuplicatePlace(form({ name: 'Iron Lady', lat: '48.85845', lng: '2.29455' }), [near])).toBe(near)
    expect(findDuplicatePlace(form({ name: 'Iron Lady', lat: '48.8594', lng: '2.2945' }), [near])).toBeNull()
  })

  it('a stop on a drive ignores the name and compares the OSM object instead', () => {
    const aral = { name: 'Aral', osm_id: 'node:1' }
    const rules = { byName: false, byOsmId: true }
    expect(findDuplicatePlace(form({ name: 'Aral' }), [aral], rules)).toBeNull()
    expect(findDuplicatePlace(form({ name: 'Tankstelle', osm_id: 'node:1' }), [aral], rules)).toBe(aral)
    // The ordinary add place never looks at the OSM object.
    expect(findDuplicatePlace(form({ name: 'Tankstelle', osm_id: 'node:1' }), [aral])).toBeNull()
  })

  it('an empty list or a missing one finds nothing', () => {
    expect(findDuplicatePlace(form({ name: 'Louvre' }), [])).toBeNull()
    expect(findDuplicatePlace(form({ name: 'Louvre' }), null as never)).toBeNull()
  })
})

describe('parseCoordinatePair', () => {
  it('splits a pair on a comma, a semicolon or a space', () => {
    expect(parseCoordinatePair('48.8566, 2.3522')).toEqual(['48.8566', '2.3522'])
    expect(parseCoordinatePair(' -33.86;151.2 ')).toEqual(['-33.86', '151.2'])
    expect(parseCoordinatePair('35.68 139.77')).toEqual(['35.68', '139.77'])
  })

  it('leaves anything else to the field', () => {
    expect(parseCoordinatePair('48.8566')).toBeNull()
    expect(parseCoordinatePair('not a coordinate')).toBeNull()
    expect(parseCoordinatePair('48.8, 2.3, 7')).toBeNull()
  })
})

describe('endsBeforeStart', () => {
  it('only compares two complete clocks', () => {
    expect(endsBeforeStart('14:00', '13:00')).toBe(true)
    expect(endsBeforeStart('14:00', '14:00')).toBe(true)
    expect(endsBeforeStart('14:00', '15:00')).toBe(false)
    expect(endsBeforeStart('14:00', '1')).toBe(false)
    expect(endsBeforeStart('', '13:00')).toBe(false)
  })
})

describe('timeCollisions', () => {
  const visit = (id: number, day_id: number, place_time: string | null, end_time: string | null = null, name = `P${id}`) =>
    ({ id, day_id, place: { name, place_time, end_time } }) as never

  it('lists the overlapping visits of the same day only', () => {
    const day = [visit(1, 5, '12:30', '13:30'), visit(2, 5, '13:00', '14:00'), visit(3, 6, '13:00', '14:00'), visit(4, 5, null)]
    expect(timeCollisions(1, day, '12:30', '13:30').map((a: { id: number }) => a.id)).toEqual([2])
  })

  it('an open end is a point in time, and touching ends do not overlap', () => {
    const day = [visit(1, 5, '11:30'), visit(2, 5, '11:00', '12:00'), visit(3, 5, '11:00'), visit(4, 5, '12:00', '13:00')]
    expect(timeCollisions(1, day, '11:30', '').map((a: { id: number }) => a.id)).toEqual([2])
    // 12:00 to 13:00 starts where this one ends, and the point at 11:00 is where it starts.
    expect(timeCollisions(1, day, '11:00', '12:00').map((a: { id: number }) => a.id)).toEqual([2])
    expect(timeCollisions(1, day, '11:00', '12:30').map((a: { id: number }) => a.id)).toEqual([2, 4])
  })

  it('says nothing without an assignment, a start, or the assignment in the list', () => {
    const day = [visit(1, 5, '12:00', '13:00'), visit(2, 5, '12:30', '13:30')]
    expect(timeCollisions(null, day, '12:00', '13:00')).toEqual([])
    expect(timeCollisions(1, day, '', '13:00')).toEqual([])
    expect(timeCollisions(99, day, '12:00', '13:00')).toEqual([])
  })
})

describe('formPin', () => {
  it('FE-PLACEFORM-PIN-001: reads a pin only from two real coordinates', () => {
    expect(formPin({ lat: '52.5163', lng: '13.3777' })).toEqual({ lat: 52.5163, lng: 13.3777 })
    expect(formPin({ lat: '0', lng: '0' })).toEqual({ lat: 0, lng: 0 })
    expect(formPin({ lat: '', lng: '13.4' })).toBeNull()
    expect(formPin({ lat: '52.5', lng: ' ' })).toBeNull()
    expect(formPin({ lat: 'abc', lng: '13.4' })).toBeNull()
    expect(formPin({ lat: '91', lng: '13.4' })).toBeNull()
  })
})
