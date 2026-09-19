import { describe, it, expect, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../../tests/helpers/msw/server'
import { useSettingsStore } from '../../store/settingsStore'
import { valhallaBase, valhallaAvailable, valhallaRouteAvoiding, valhallaRun, runFrom, legAvoids } from './valhallaRoute'

const FOSSGIS_VALHALLA = 'https://valhalla1.openstreetmap.de/route'

/**
 * A real polyline6, encoded from three known points and verified by decoding it back.
 * Precision matters here more than anywhere else in the file: read as polyline5 the
 * first vertex would be 535.511, which is not a latitude, and a wrong guess draws a
 * line into the sea rather than failing.
 */
const SHAPE = 'w~nceBg}}`RgkPwjr@~fn~@oirmE'
const SHAPE_POINTS: [number, number][] = [[53.5511, 9.9937], [53.56, 10.02], [52.52, 13.405]]

const answer = (summary: Record<string, unknown> = {}) => ({
  trip: {
    legs: [{ shape: SHAPE }],
    summary: {
      has_time_restrictions: false,
      has_toll: false,
      has_highway: true,
      has_ferry: false,
      // Asked in kilometres, so this is 295.7 km and 191 minutes — the real
      // Hamburg-to-Berlin answer, which the adapter has to hand on in metres and seconds.
      length: 295.7,
      time: 11460,
      ...summary,
    },
  },
})

const setSettings = (patch: Record<string, string>) =>
  useSettingsStore.setState(st => ({ settings: { ...st.settings, ...patch } }))

afterEach(() => {
  setSettings({ routing_base_url: '', valhalla_base_url: '' })
})

const HAMBURG = { lat: 53.5511, lng: 9.9937 }
const BERLIN = { lat: 52.52, lng: 13.405 }

describe('valhallaBase', () => {
  it('VALHALLA-BASE-001: falls back to the public instance when nothing is configured', () => {
    expect(valhallaBase()).toBe('https://valhalla1.openstreetmap.de')
    expect(valhallaAvailable()).toBe(true)
  })

  it('VALHALLA-BASE-002: uses the configured instance and drops its trailing slashes', () => {
    setSettings({ valhalla_base_url: 'https://valhalla.example.org//' })
    expect(valhallaBase()).toBe('https://valhalla.example.org')
  })

  it('VALHALLA-BASE-003: asks nothing when the instance runs its own OSRM', () => {
    // An operator who filled in their own router chose against the public hosts, usually
    // because the instance is not supposed to reach third parties at all. Adding one they
    // never asked for would undo that, and their MLD-built OSRM answers exclude itself.
    setSettings({ routing_base_url: 'https://osrm.example.org' })
    expect(valhallaBase()).toBeNull()
    expect(valhallaAvailable()).toBe(false)
  })

  it('VALHALLA-BASE-004: an own Valhalla wins over an own OSRM', () => {
    setSettings({ routing_base_url: 'https://osrm.example.org', valhalla_base_url: 'https://v.example.org' })
    expect(valhallaBase()).toBe('https://v.example.org')
  })
})

describe('runFrom', () => {
  const total = (data: unknown) => runFrom(data)?.total ?? null

  it('VALHALLA-PARSE-001: decodes the shape as polyline6 and converts km to metres', () => {
    const leg = total(answer())
    expect(leg).not.toBeNull()
    expect(leg!.coordinates).toEqual(SHAPE_POINTS)
    expect(leg!.distance).toBeCloseTo(295700, 0)
    expect(leg!.duration).toBe(11460)
  })

  it('VALHALLA-PARSE-002: carries the flags through as booleans', () => {
    const leg = total(answer({ has_toll: true, has_ferry: true, has_highway: false }))
    expect(leg).toMatchObject({ hasToll: true, hasFerry: true, hasHighway: false })
  })

  it('VALHALLA-PARSE-003: a missing flag reads as absent rather than unknown', () => {
    // The public instance omits a flag it has nothing to say about, and the caller turns
    // this into a label. Undefined has to become false, not a truthy object.
    const leg = total({ trip: { legs: [{ shape: SHAPE }], summary: { length: 1, time: 60 } } })
    expect(leg).toMatchObject({ hasToll: false, hasHighway: false, hasFerry: false })
  })

  it('VALHALLA-PARSE-004: keeps a chain divided leg by leg, and adds it up as well', () => {
    // What a request with a via really answers: one summary per pair of stops. The
    // schedule is built from those, so flattening them into a total would lose the
    // arrival time at every stop but the last.
    const chain = {
      trip: {
        legs: [
          { shape: SHAPE, summary: { length: 100, time: 3600, has_toll: false, has_highway: true, has_ferry: false } },
          { shape: SHAPE, summary: { length: 50, time: 1800, has_toll: true, has_highway: false, has_ferry: false } },
        ],
        summary: { length: 150, time: 5400, has_toll: true, has_highway: true, has_ferry: false },
      },
    }
    const run = runFrom(chain)!
    expect(run.legs.map(l => l.distance)).toEqual([100000, 50000])
    expect(run.legs.map(l => l.hasToll)).toEqual([false, true])
    expect(run.total.distance).toBe(150000)
    expect(run.total.duration).toBe(5400)
    // One tolled leg makes the drive tolled. `every` here would call a day with a
    // single toll booth in it toll-free.
    expect(run.total.hasToll).toBe(true)
    expect(run.total.coordinates).toHaveLength(SHAPE_POINTS.length * 2)
  })

  it('VALHALLA-PARSE-007: several legs with no summaries of their own are refused', () => {
    // There is no honest way to divide one total between them, and a guess would reach
    // the user as a wrong arrival time rather than as a missing one.
    const two = { trip: { legs: [{ shape: SHAPE }, { shape: SHAPE }], summary: { length: 2, time: 120 } } }
    expect(runFrom(two)).toBeNull()
  })

  it('VALHALLA-PARSE-005: an error body is not a leg', () => {
    // What a 400 carries: no trip at all. Parsing it as one would produce a route of
    // NaN kilometres rather than the null every caller reads as "no second way".
    expect(total({ error_code: 442, error: 'No path could be found for input' })).toBeNull()
    expect(total({ trip: { legs: [], summary: { length: 1, time: 1 } } })).toBeNull()
    expect(total({ trip: { legs: [{ shape: SHAPE }] } })).toBeNull()
    expect(total(null)).toBeNull()
  })

  it('VALHALLA-PARSE-006: a summary without numbers is not a leg', () => {
    expect(total({ trip: { legs: [{ shape: SHAPE }], summary: { length: 'far', time: 60 } } })).toBeNull()
  })
})

describe('legAvoids', () => {
  const leg = (flags: Partial<{ hasToll: boolean; hasHighway: boolean; hasFerry: boolean }>) => ({
    coordinates: SHAPE_POINTS, distance: 1, duration: 1,
    hasToll: false, hasHighway: false, hasFerry: false, ...flags,
  })

  it('VALHALLA-AVOID-001: reads the answer, not the request', () => {
    // use_tolls: 0 is a weighting. Between two points with no untolled connection the
    // answer is still a tolled road, honestly flagged, and labelling that "No tolls"
    // would put a lie on the map.
    expect(legAvoids(leg({ hasToll: false }), 'toll')).toBe(true)
    expect(legAvoids(leg({ hasToll: true }), 'toll')).toBe(false)
  })

  it('VALHALLA-AVOID-002: each class reads its own flag', () => {
    expect(legAvoids(leg({ hasHighway: true }), 'motorway')).toBe(false)
    expect(legAvoids(leg({ hasHighway: true }), 'toll')).toBe(true)
    expect(legAvoids(leg({ hasFerry: true }), 'ferry')).toBe(false)
    expect(legAvoids(leg({ hasFerry: false }), 'ferry')).toBe(true)
  })
})

describe('valhallaRouteAvoiding', () => {
  it('VALHALLA-REQ-001: posts the avoidance as a costing option under the right profile', async () => {
    let body: Record<string, unknown> | null = null
    server.use(
      http.post(FOSSGIS_VALHALLA, async ({ request }) => {
        body = await request.json() as Record<string, unknown>
        return HttpResponse.json(answer())
      })
    )
    const leg = await valhallaRouteAvoiding(HAMBURG, BERLIN, 'driving', 'toll')
    expect(leg!.distance).toBeCloseTo(295700, 0)
    expect(body).toMatchObject({
      costing: 'auto',
      costing_options: { auto: { use_tolls: 0 } },
      directions_options: { units: 'kilometers' },
    })
    // The radius is what makes a place in a pedestrian zone routable at all: without it
    // Vienna's Stephansdom answers error 442 and the whole leg is lost.
    expect(body!.locations).toEqual([
      { lat: 53.5511, lon: 9.9937, radius: 50 },
      { lat: 52.52, lon: 13.405, radius: 50 },
    ])
  })

  it('VALHALLA-REQ-002: each class maps to its own costing option', async () => {
    const seen: Record<string, unknown>[] = []
    server.use(
      http.post(FOSSGIS_VALHALLA, async ({ request }) => {
        seen.push(await request.json() as Record<string, unknown>)
        return HttpResponse.json(answer())
      })
    )
    await valhallaRouteAvoiding(HAMBURG, BERLIN, 'driving', 'motorway')
    await valhallaRouteAvoiding(HAMBURG, BERLIN, 'driving', 'ferry')
    expect(seen.map(b => b.costing_options)).toEqual([
      { auto: { use_highways: 0 } },
      { auto: { use_ferry: 0 } },
    ])
  })

  it('VALHALLA-REQ-003: walking and cycling get their own costing models', async () => {
    const seen: string[] = []
    server.use(
      http.post(FOSSGIS_VALHALLA, async ({ request }) => {
        const body = await request.json() as { costing: string }
        seen.push(body.costing)
        return HttpResponse.json(answer())
      })
    )
    await valhallaRouteAvoiding(HAMBURG, BERLIN, 'walking', 'ferry')
    await valhallaRouteAvoiding(HAMBURG, BERLIN, 'cycling', 'ferry')
    expect(seen).toEqual(['pedestrian', 'bicycle'])
  })

  it('VALHALLA-REQ-004: a refusal is a null, not a throw', async () => {
    // Every failure means the same thing to the caller — there is no second way to
    // show — so a 400 for an unroutable point and a 429 for the rate limit both end
    // here rather than as an error over a map that is drawing fine.
    server.use(
      http.post(FOSSGIS_VALHALLA, () =>
        HttpResponse.json({ error_code: 442, error: 'No path could be found for input' }, { status: 400 })
      )
    )
    await expect(valhallaRouteAvoiding(HAMBURG, BERLIN, 'driving', 'toll')).resolves.toBeNull()
  })

  it('VALHALLA-REQ-005: a host that is not a Valhalla is only asked once', async () => {
    let calls = 0
    setSettings({ valhalla_base_url: 'https://not-valhalla.example.org' })
    server.use(
      http.post('https://not-valhalla.example.org/route', () => {
        calls++
        return new HttpResponse(null, { status: 404 })
      })
    )
    await valhallaRouteAvoiding(HAMBURG, BERLIN, 'driving', 'toll')
    await valhallaRouteAvoiding(HAMBURG, BERLIN, 'driving', 'motorway')
    // A 404 is about the URL rather than about this leg, so remembering it saves every
    // later leg a request against a host that will never answer.
    expect(calls).toBe(1)
  })

  it('VALHALLA-REQ-006: asks nothing at all when the instance has its own OSRM', async () => {
    let calls = 0
    setSettings({ routing_base_url: 'https://osrm.example.org' })
    server.use(http.post(FOSSGIS_VALHALLA, () => { calls++; return HttpResponse.json(answer()) }))
    await expect(valhallaRouteAvoiding(HAMBURG, BERLIN, 'driving', 'toll')).resolves.toBeNull()
    expect(calls).toBe(0)
  })
})

describe('valhallaRun over a whole day', () => {
  /** A chain answer with one summary per leg, which is what a real request returns. */
  const chain = (legCount: number) => ({
    trip: {
      legs: Array.from({ length: legCount }, () => ({
        shape: SHAPE,
        summary: { length: 10, time: 600, has_toll: false, has_highway: true, has_ferry: false },
      })),
      summary: { length: 10 * legCount, time: 600 * legCount, has_toll: false, has_highway: true, has_ferry: false },
    },
  })

  const stops = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ lat: 53 - i * 0.1, lng: 10 + i * 0.1 }))

  it('VALHALLA-RUN-001: a day inside the cap goes out as one request, one leg per pair', async () => {
    let calls = 0
    server.use(http.post(FOSSGIS_VALHALLA, async ({ request }) => {
      calls++
      const body = await request.json() as { locations: unknown[] }
      return HttpResponse.json(chain(body.locations.length - 1))
    }))

    const run = await valhallaRun(stops(6), 'driving', [])

    expect(calls).toBe(1)
    expect(run!.legs).toHaveLength(5)
    expect(run!.total.distance).toBe(50000)
  })

  it('VALHALLA-RUN-002: a day over the cap is split on a shared point, and the legs still line up', async () => {
    // Ten locations is hard: the eleventh answers error 150. Split runs overlap by one
    // point, which is exact rather than approximate — measured over a six-stop day,
    // [0..3] plus [3..5] came back within two metres of the same day asked whole.
    const sizes: number[] = []
    server.use(http.post(FOSSGIS_VALHALLA, async ({ request }) => {
      const body = await request.json() as { locations: unknown[] }
      sizes.push(body.locations.length)
      return HttpResponse.json(chain(body.locations.length - 1))
    }))

    const run = await valhallaRun(stops(14), 'driving', ['toll'])

    // Fourteen stops: the first run takes ten, the second starts on the tenth again and
    // takes the remaining five. Nine pairs plus four.
    expect(sizes).toEqual([10, 5])
    // Thirteen pairs across two requests, none lost and none counted twice.
    expect(run!.legs).toHaveLength(13)
    expect(run!.total.distance).toBe(130000)
  })

  it('VALHALLA-RUN-003: never sends more than ten locations, however long the day', async () => {
    const sizes: number[] = []
    server.use(http.post(FOSSGIS_VALHALLA, async ({ request }) => {
      const body = await request.json() as { locations: unknown[] }
      sizes.push(body.locations.length)
      return HttpResponse.json(chain(body.locations.length - 1))
    }))

    await valhallaRun(stops(28), 'driving', [])

    expect(Math.max(...sizes)).toBeLessThanOrEqual(10)
    expect(sizes.reduce((sum, n) => sum + n - 1, 0)).toBe(27)
  })

  it('VALHALLA-RUN-004: a piece that will not answer loses the whole day rather than half of it', async () => {
    // Half a day of legs is worse than none. The schedule chains leg times blindly and
    // cannot tell that some are missing, so it would print a complete, plausible,
    // silently wrong timetable instead of leaving a visible gap.
    //
    // The SECOND CHUNK fails, not the second request: one attempt is retried, so failing
    // by call number would just be answered on the retry.
    server.use(http.post(FOSSGIS_VALHALLA, async ({ request }) => {
      const body = await request.json() as { locations: unknown[] }
      if (body.locations.length < 10) {
        return HttpResponse.json({ error_code: 442, error: 'No path' }, { status: 400 })
      }
      return HttpResponse.json(chain(body.locations.length - 1))
    }))

    await expect(valhallaRun(stops(14), 'driving', ['toll'])).resolves.toBeNull()
  })

  it('VALHALLA-RUN-007: a piece that fails once is asked again rather than losing the day', async () => {
    // The caller retries the whole task, so without this a rate limit on the last piece
    // of a split day throws away the pieces that already answered and asks for all of
    // them again — three times over, against a host that allows one request a second.
    let calls = 0
    server.use(http.post(FOSSGIS_VALHALLA, async ({ request }) => {
      const body = await request.json() as { locations: unknown[] }
      calls++
      if (calls === 2) return new HttpResponse(null, { status: 429 })
      return HttpResponse.json(chain(body.locations.length - 1))
    }))

    const run = await valhallaRun(stops(14), 'driving', ['toll'])

    expect(run!.legs).toHaveLength(13)
    // First piece, second piece refused, second piece again.
    expect(calls).toBe(3)
  })

  it('VALHALLA-RUN-005: fewer than two points is nothing to route', async () => {
    let calls = 0
    server.use(http.post(FOSSGIS_VALHALLA, () => { calls++; return HttpResponse.json(chain(1)) }))
    await expect(valhallaRun(stops(1), 'driving', [])).resolves.toBeNull()
    expect(calls).toBe(0)
  })

  it('VALHALLA-RUN-006: an answer with the wrong number of legs is refused', async () => {
    // A day whose legs do not match its stops cannot be assigned to the rail, and
    // guessing which stop is missing would put the wrong time against the right place.
    server.use(http.post(FOSSGIS_VALHALLA, () => HttpResponse.json(chain(2))))
    await expect(valhallaRun(stops(6), 'driving', [])).resolves.toBeNull()
  })
})
