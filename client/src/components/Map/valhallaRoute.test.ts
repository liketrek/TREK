import { describe, it, expect, afterEach, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../../tests/helpers/msw/server'
import { useSettingsStore } from '../../store/settingsStore'
import { valhallaBase, valhallaAvailable, valhallaTurn, resetValhallaTurns, valhallaRouteAvoiding, valhallaRun, valhallaRunOnFoot, valhallaAlternates, alternatesFrom, runFrom, legAvoids, valhallaTraceAttributes } from './valhallaRoute'

const FOSSGIS_VALHALLA = 'https://valhalla1.openstreetmap.de/route'
/** The relay to the TREK services' Valhalla, the base asked when nothing else is configured. */
const TREK_VALHALLA = '/api/routing/valhalla'

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
  setSettings({ routing_base_url: '', valhalla_base_url: '', routing_valhalla_provider: '' })
  resetValhallaTurns()
})

describe('valhallaTurn', () => {
  const PUBLIC = 'https://valhalla1.openstreetmap.de'

  afterEach(() => vi.useRealTimers())

  it('spaces questions to the public instance a little over a second apart, across callers', async () => {
    vi.useFakeTimers()
    const done: number[] = []
    const start = Date.now()
    await valhallaTurn(PUBLIC)
    done.push(Date.now() - start)
    const second = valhallaTurn(PUBLIC).then(() => done.push(Date.now() - start))
    const third = valhallaTurn(PUBLIC).then(() => done.push(Date.now() - start))

    await vi.advanceTimersByTimeAsync(5000)
    await Promise.all([second, third])

    expect(done[0]).toBe(0)
    expect(done[1]).toBeGreaterThanOrEqual(1100)
    expect(done[2] - done[1]).toBeGreaterThanOrEqual(1100)
  })

  it("does not pace an operator's own host", async () => {
    vi.useFakeTimers()
    await valhallaTurn('https://valhalla.example.org')
    let through = false
    void valhallaTurn('https://valhalla.example.org').then(() => { through = true })
    await vi.advanceTimersByTimeAsync(0)
    expect(through).toBe(true)
  })

  it('lets a caller that gives up go without taking the turn', async () => {
    vi.useFakeTimers()
    await valhallaTurn(PUBLIC)
    const controller = new AbortController()
    const waiting = valhallaTurn(PUBLIC, controller.signal)
    controller.abort()
    await vi.advanceTimersByTimeAsync(0)
    await waiting
    // The abandoned wait claimed nothing, so the next caller only waits out the first turn.
    const start = Date.now()
    const next = valhallaTurn(PUBLIC)
    await vi.advanceTimersByTimeAsync(1100)
    await next
    expect(Date.now() - start).toBeLessThanOrEqual(1100)
  })
})

const HAMBURG = { lat: 53.5511, lng: 9.9937 }
const BERLIN = { lat: 52.52, lng: 13.405 }

describe('valhallaBase', () => {
  it('VALHALLA-BASE-001: asks the TREK services through the relay when nothing is configured', () => {
    expect(valhallaBase()).toBe(TREK_VALHALLA)
    expect(valhallaAvailable()).toBe(true)
  })

  it('VALHALLA-BASE-005: keeps the admin choice of a routing service', () => {
    setSettings({ routing_valhalla_provider: 'fossgis', valhalla_base_url: 'https://v.example.org' })
    expect(valhallaBase()).toBe('https://valhalla1.openstreetmap.de')
    setSettings({ routing_valhalla_provider: 'custom' })
    expect(valhallaBase()).toBe('https://v.example.org')
    setSettings({ routing_valhalla_provider: 'trek', valhalla_base_url: '', routing_base_url: 'https://osrm.example.org' })
    expect(valhallaBase()).toBe(TREK_VALHALLA)
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
    expect(leg?.coordinates).toEqual(SHAPE_POINTS)
    expect(leg?.distance).toBeCloseTo(295700, 0)
    expect(leg?.duration).toBe(11460)
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
    const run = runFrom(chain)
    expect(run?.legs.map(l => l.distance)).toEqual([100000, 50000])
    expect(run?.legs.map(l => l.hasToll)).toEqual([false, true])
    expect(run?.total.distance).toBe(150000)
    expect(run?.total.duration).toBe(5400)
    // One tolled leg makes the drive tolled. `every` here would call a day with a
    // single toll booth in it toll-free.
    expect(run?.total.hasToll).toBe(true)
    expect(run?.total.coordinates).toHaveLength(SHAPE_POINTS.length * 2)
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
    expect(leg?.distance).toBeCloseTo(295700, 0)
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

  it('retains Tours costing options through the upstream spaced retry', async () => {
    const bodies: unknown[] = []
    const times: number[] = []
    server.use(http.post(FOSSGIS_VALHALLA, async ({ request }) => {
      bodies.push(await request.json())
      times.push(Date.now())
      return bodies.length === 1 ? new HttpResponse(null, { status: 429 }) : HttpResponse.json(chain(1))
    }))
    const result = await valhallaRun(stops(2), 'walking', [], undefined, { max_hiking_difficulty: 6 })
    expect(result).not.toBeNull()
    expect(bodies).toHaveLength(2)
    expect(bodies[1]).toEqual(bodies[0])
    expect(bodies[1]).toMatchObject({ costing_options: { pedestrian: { max_hiking_difficulty: 6 } } })
    expect(times[1] - times[0]).toBeGreaterThanOrEqual(1000)
  })

  it('does not send another Tours request when aborted during the retry pause', async () => {
    const controller = new AbortController()
    let calls = 0
    server.use(http.post(FOSSGIS_VALHALLA, () => {
      calls++
      setTimeout(() => controller.abort(), 25)
      return new HttpResponse(null, { status: 429 })
    }))
    await expect(valhallaRun(stops(2), 'walking', [], controller.signal, { max_hiking_difficulty: 4 })).resolves.toBeNull()
    expect(calls).toBe(1)
  })

  it.each([1, 2, 3, 4, 5, 6])('keeps Tours T%i options in the exact pedestrian request with avoidance', async difficulty => {
    let body: unknown
    server.use(http.post(FOSSGIS_VALHALLA, async ({ request }) => {
      body = await request.json()
      return HttpResponse.json(chain(1))
    }))
    await valhallaRun(stops(2), 'walking', ['ferry'], undefined, { max_hiking_difficulty: difficulty })
    expect(body).toEqual({
      locations: stops(2).map(point => ({ lat: point.lat, lon: point.lng, radius: 50 })),
      costing: 'pedestrian',
      costing_options: { pedestrian: { max_hiking_difficulty: difficulty, use_ferry: 0 } },
      directions_options: { units: 'kilometers' },
    })
  })

  it('VALHALLA-RUN-001: a day inside the cap goes out as one request, one leg per pair', async () => {
    let calls = 0
    server.use(http.post(FOSSGIS_VALHALLA, async ({ request }) => {
      calls++
      const body = await request.json() as { locations: unknown[] }
      return HttpResponse.json(chain(body.locations.length - 1))
    }))

    const run = await valhallaRun(stops(6), 'driving', [])

    expect(calls).toBe(1)
    expect(run?.legs).toHaveLength(5)
    expect(run?.total.distance).toBe(50000)
  })

  it('VALHALLA-RUN-008: forwards caller-specific costing options only when supplied', async () => {
    let body: Record<string, unknown> | null = null
    server.use(http.post(FOSSGIS_VALHALLA, async ({ request }) => {
      body = await request.json() as Record<string, unknown>
      return HttpResponse.json(chain(1))
    }))

    await valhallaRun(stops(2), 'walking', [], undefined, { max_hiking_difficulty: 2 })

    expect(body).toMatchObject({
      costing: 'pedestrian',
      costing_options: { pedestrian: { max_hiking_difficulty: 2 } },
    })
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
    expect(run?.legs).toHaveLength(13)
    expect(run?.total.distance).toBe(130000)
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

    expect(run?.legs).toHaveLength(13)
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

describe('valhallaAlternates', () => {
  /** The same leg read three ways, the second of them crossing by ferry. */
  const withAlternates = (alternates: unknown[]) => ({
    ...answer({ time: 11_460 }),
    alternates,
  })

  it('VALHALLA-ALT-001: reads the preferred way, then every alternate, each with its own flags', () => {
    const ways = alternatesFrom(withAlternates([
      answer({ time: 12_000, has_ferry: true }),
      answer({ time: 13_000, has_toll: true }),
    ]))

    expect(ways?.map(w => w.duration)).toEqual([11_460, 12_000, 13_000])
    expect(ways?.map(w => w.hasFerry)).toEqual([false, true, false])
    expect(ways?.map(w => w.hasToll)).toEqual([false, false, true])
    expect(ways?.[1].coordinates).toEqual(SHAPE_POINTS)
  })

  it('VALHALLA-ALT-002: an alternate that cannot be read is dropped, a preferred way that cannot is no answer', () => {
    // One bad entry is no reason to lose the leg's other ways, but the others are offered
    // against the preferred one and mean nothing without it.
    expect(alternatesFrom(withAlternates([{ trip: { legs: [] } }, answer({ time: 13_000 })]))?.map(w => w.duration))
      .toEqual([11_460, 13_000])
    expect(alternatesFrom(answer())).toHaveLength(1)
    expect(alternatesFrom({ alternates: [answer()] })).toBeNull()
    expect(alternatesFrom({ error_code: 442, error: 'No path could be found for input' })).toBeNull()
  })

  it('VALHALLA-ALT-003: asks for the leg between exactly its two ends, weighed the way the trip is, with the number of alternates', async () => {
    const bodies: Record<string, unknown>[] = []
    server.use(http.post(FOSSGIS_VALHALLA, async ({ request }) => {
      bodies.push(await request.json() as Record<string, unknown>)
      return HttpResponse.json(withAlternates([answer({ time: 12_000 })]))
    }))

    const ways = await valhallaAlternates(HAMBURG, BERLIN, 'driving', ['toll', 'ferry'], 2)
    await valhallaAlternates(HAMBURG, BERLIN, 'driving', ['toll'], 0)

    expect(ways).toHaveLength(2)
    expect(bodies[0]).toMatchObject({ alternates: 2, costing: 'auto', costing_options: { auto: { use_tolls: 0, use_ferry: 0 } } })
    expect(bodies[0].locations).toHaveLength(2)
    // No alternates asked for, none named: the request stays the plain one.
    expect(bodies[1]).not.toHaveProperty('alternates')
  })

  it('VALHALLA-ALT-005: a section of a hike is offered ways on foot under its own limit and preferences (RTE-02)', async () => {
    const bodies: Record<string, unknown>[] = []
    server.use(http.post(FOSSGIS_VALHALLA, async ({ request }) => {
      bodies.push(await request.json() as Record<string, unknown>)
      return HttpResponse.json(withAlternates([answer({ time: 12_000 })]))
    }))

    const ways = await valhallaAlternates(HAMBURG, BERLIN, 'walking', [], 3, undefined, { max_hiking_difficulty: 4, use_hills: 0.2 })

    expect(ways).toHaveLength(2)
    expect(bodies[0]).toMatchObject({
      alternates: 3,
      costing: 'pedestrian',
      costing_options: { pedestrian: { max_hiking_difficulty: 4, use_hills: 0.2 } },
    })
  })

  it('VALHALLA-ALT-004: a refusal is asked once more, then is no answer; an instance with its own OSRM asks nothing', async () => {
    let calls = 0
    server.use(http.post(FOSSGIS_VALHALLA, () => { calls++; return new HttpResponse(null, { status: 429 }) }))

    await expect(valhallaAlternates(HAMBURG, BERLIN, 'driving', ['toll'], 2)).resolves.toBeNull()
    expect(calls).toBe(2)

    setSettings({ routing_base_url: 'https://osrm.example.org' })
    await expect(valhallaAlternates(HAMBURG, BERLIN, 'driving', ['toll'], 2)).resolves.toBeNull()
    expect(calls).toBe(2)
  })
})

describe('valhallaTraceAttributes (BIK-01)', () => {
  const TRACE = 'https://valhalla1.openstreetmap.de/trace_attributes'

  it('VALHALLA-TRACE-001: asks for the ways under the line, matched as a mountain bike rides, and hands the answer on', async () => {
    const bodies: Record<string, unknown>[] = []
    server.use(http.post(TRACE, async ({ request }) => {
      bodies.push(await request.json() as Record<string, unknown>)
      return HttpResponse.json({ shape: SHAPE, edges: [] })
    }))
    await expect(valhallaTraceAttributes(SHAPE_POINTS)).resolves.toEqual({ shape: SHAPE, edges: [] })
    expect(bodies[0]).toMatchObject({
      costing: 'bicycle',
      costing_options: { bicycle: { bicycle_type: 'Mountain' } },
      shape_match: 'map_snap',
      filters: { action: 'include' },
    })
    expect(bodies[0].shape).toEqual(SHAPE_POINTS.map(([lat, lon]) => ({ lat, lon })))
  })

  it('VALHALLA-TRACE-005: a run is matched on foot without a hiking limit, and every line is asked its hiking grades (RUN-02)', async () => {
    const bodies: Record<string, unknown>[] = []
    server.use(http.post(TRACE, async ({ request }) => {
      bodies.push(await request.json() as Record<string, unknown>)
      return HttpResponse.json({ shape: SHAPE, edges: [] })
    }))
    await valhallaTraceAttributes(SHAPE_POINTS, undefined, 'run')
    expect(bodies[0]).toMatchObject({
      costing: 'pedestrian',
      costing_options: { pedestrian: { max_hiking_difficulty: 6 } },
      shape_match: 'map_snap',
    })
    expect((bodies[0].filters as { attributes: string[] }).attributes).toContain('edge.sac_scale')
  })

  it('VALHALLA-TRACE-002: a long line is thinned evenly to what one request carries, its ends kept', async () => {
    let shape: unknown[] = []
    server.use(http.post(TRACE, async ({ request }) => {
      shape = ((await request.json()) as { shape: unknown[] }).shape
      return HttpResponse.json({})
    }))
    const line = Array.from({ length: 9001 }, (_, i): [number, number] => [47 + i / 1e5, 11])
    await valhallaTraceAttributes(line)
    expect(shape.length).toBeLessThanOrEqual(4001)
    expect(shape[0]).toEqual({ lat: 47, lon: 11 })
    expect(shape[shape.length - 1]).toEqual({ lat: line[9000][0], lon: 11 })
  })

  it('VALHALLA-TRACE-003: null for a refusal, a network failure, a line of one point or a router that is not Valhalla', async () => {
    server.use(http.post(TRACE, () => new HttpResponse(null, { status: 400 })))
    await expect(valhallaTraceAttributes(SHAPE_POINTS)).resolves.toBeNull()
    server.use(http.post(TRACE, () => HttpResponse.error()))
    await expect(valhallaTraceAttributes(SHAPE_POINTS)).resolves.toBeNull()
    await expect(valhallaTraceAttributes(SHAPE_POINTS.slice(0, 1))).resolves.toBeNull()
    setSettings({ routing_base_url: 'https://osrm.example' })
    await expect(valhallaTraceAttributes(SHAPE_POINTS)).resolves.toBeNull()
  })

  it('VALHALLA-TRACE-006: a hike is matched on foot with every grade of path open, never by its routing limit (MAP-03)', async () => {
    const bodies: Record<string, unknown>[] = []
    server.use(http.post(TRACE, async ({ request }) => {
      bodies.push(await request.json() as Record<string, unknown>)
      return HttpResponse.json({ shape: SHAPE, edges: [] })
    }))
    await valhallaTraceAttributes(SHAPE_POINTS, undefined, 'foot')
    expect(bodies[0]).toMatchObject({
      costing: 'pedestrian',
      costing_options: { pedestrian: { max_hiking_difficulty: 6 } },
      shape_match: 'map_snap',
    })
    expect(JSON.stringify(bodies[0])).not.toContain('sac_scale')
  })

  it('VALHALLA-TRACE-004: a caller gone before its turn asks nothing', async () => {
    let asked = false
    server.use(http.post(TRACE, () => { asked = true; return HttpResponse.json({}) }))
    const controller = new AbortController()
    controller.abort()
    await expect(valhallaTraceAttributes(SHAPE_POINTS, controller.signal)).resolves.toBeNull()
    expect(asked).toBe(false)
  })
})

describe('crossings by boat on a walk (CW-12)', () => {
  /** A walk's leg as the public instance answers one: the boat boards at point 1 and lands at point 2. */
  const ferryLeg = (maneuvers?: unknown[]) => ({
    shape: SHAPE,
    summary: { length: 1.5, time: 900, has_ferry: true },
    ...(maneuvers ? { maneuvers } : {}),
  })
  // The San Tomà to Ca' Rezzonico crossing as measured on Venice, laid onto the test shape.
  const boarding = [
    { type: 1, begin_shape_index: 0, end_shape_index: 1, time: 100, length: 0.2 },
    { type: 28, ferry: true, begin_shape_index: 1, end_shape_index: 2, time: 744.959, length: 1.236 },
  ]
  const walked = { shape: SHAPE, summary: { length: 1, time: 700, has_ferry: false } }

  it('VALHALLA-FERRY-001: reads where a leg goes by boat off its maneuvers, with the crossing\'s own length and time', () => {
    const run = runFrom({ trip: { legs: [ferryLeg(boarding)] } })
    expect(run?.legs[0].ferrySpans).toEqual([{ from: 1, to: 2, metres: 1236, seconds: 744.959 }])
  })

  it('VALHALLA-FERRY-002: the joined line keeps each crossing on its own points', () => {
    const run = runFrom({ trip: { legs: [walked, ferryLeg(boarding)] } })
    // The second leg does not start where the first ends, so its three points follow the first three.
    expect(run?.total.coordinates).toHaveLength(6)
    expect(run?.total.ferrySpans).toEqual([{ from: 4, to: 5, metres: 1236, seconds: 744.959 }])
    expect(run?.legs[0]).not.toHaveProperty('ferrySpans')
  })

  it('VALHALLA-FERRY-003: a ferry the maneuvers do not place takes the whole leg, its time unknown', () => {
    const run = runFrom({ trip: { legs: [ferryLeg()] } })
    expect(run?.legs[0].ferrySpans).toEqual([{ from: 0, to: 2, metres: 0, seconds: null }])
  })

  it('VALHALLA-FERRY-004: crossings that touch are one, and a crossing with no time leaves the sum unknown', () => {
    const run = runFrom({
      trip: {
        legs: [ferryLeg([
          { type: 28, ferry: true, begin_shape_index: 0, end_shape_index: 1, time: 60, length: 0.1 },
          { type: 28, ferry: true, begin_shape_index: 1, end_shape_index: 2, length: 0.2 },
        ])],
      },
    })
    expect(run?.legs[0].ferrySpans).toEqual([{ from: 0, to: 2, metres: 300, seconds: null }])
  })

  it('VALHALLA-FERRY-005: binds no point to a boat line when asked, and only then', async () => {
    const bodies: Array<{ locations: Array<Record<string, unknown>> }> = []
    server.use(http.post(FOSSGIS_VALHALLA, async ({ request }) => {
      bodies.push(await request.json() as { locations: Array<Record<string, unknown>> })
      return HttpResponse.json({ trip: { legs: [walked] } })
    }))
    const points = [{ lat: 45.4342798, lng: 12.338111 }, { lat: 45.4367609, lng: 12.3287531 }]
    await valhallaRunOnFoot(points, undefined, { use_ferry: 0 }, { exclude_ferry: true })
    await valhallaRun(points, 'walking', [], undefined, { use_ferry: 0 })
    expect(bodies[0].locations.map(location => location.search_filter)).toEqual([{ exclude_ferry: true }, { exclude_ferry: true }])
    expect(bodies[1].locations.every(location => !('search_filter' in location))).toBe(true)
  })

  it('VALHALLA-FERRY-006: a "no path" from the router reads apart from a refusal about anything else, asked once', async () => {
    const points = [{ lat: 45.4342798, lng: 12.338111 }, { lat: 45.4367609, lng: 12.3287531 }]
    let calls = 0
    setSettings({ valhalla_base_url: 'https://valhalla.test' })
    server.use(http.post('https://valhalla.test/route', () => {
      calls++
      return HttpResponse.json({ error_code: 442, error: 'No path could be found for input', status_code: 400 }, { status: 400 })
    }))
    expect(await valhallaRunOnFoot(points, undefined, { use_ferry: 0 }, { exclude_ferry: true })).toEqual({ noPath: true })
    expect(calls).toBe(1)
    expect(await valhallaRun(points, 'walking', [])).toBeNull()

    server.use(http.post('https://valhalla.test/route', () =>
      HttpResponse.json({ error_code: 154, error: 'Path distance exceeds the max distance limit' }, { status: 400 })))
    expect(await valhallaRunOnFoot(points, undefined, { use_ferry: 0 }, { exclude_ferry: true })).toBeNull()
  })
})

describe('through the TREK services (routing relay)', () => {
  const RELAY = '/api/routing/valhalla/:action'

  it('VALHALLA-RELAY-001: asks the relay first, and FOSSGIS is not asked while it answers', async () => {
    const relayed: Array<{ action: string; body: Record<string, unknown> }> = []
    let fossgis = 0
    server.use(
      http.post(RELAY, async ({ params, request }) => {
        relayed.push({ action: String(params.action), body: await request.json() as Record<string, unknown> })
        return HttpResponse.json(answer({ has_toll: false }))
      }),
      http.post(FOSSGIS_VALHALLA, () => { fossgis++; return HttpResponse.json(answer()) }),
    )
    const leg = await valhallaRouteAvoiding(HAMBURG, BERLIN, 'driving', 'toll')
    expect(leg).not.toBeNull()
    expect(leg?.distance).toBeCloseTo(295700, 0)
    expect(relayed).toHaveLength(1)
    expect(relayed[0].action).toBe('route')
    expect(relayed[0].body).toMatchObject({ costing: 'auto', costing_options: { auto: { use_tolls: 0 } } })
    expect(fossgis).toBe(0)
  })

  it('VALHALLA-RELAY-002: turns to FOSSGIS without a word where the relay cannot answer, and leaves it alone a while', async () => {
    for (const status of [401, 429, 503]) {
      resetValhallaTurns()
      let relayCalls = 0
      let fossgis = 0
      server.use(
        http.post(RELAY, () => { relayCalls++; return HttpResponse.json({ error: 'no' }, { status }) }),
        http.post(FOSSGIS_VALHALLA, () => { fossgis++; return HttpResponse.json(answer()) }),
      )
      await expect(valhallaRouteAvoiding(HAMBURG, BERLIN, 'driving', 'toll')).resolves.not.toBeNull()
      expect(valhallaBase()).toBe('https://valhalla1.openstreetmap.de')
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(Date.now() + 2000)
      await valhallaRouteAvoiding(HAMBURG, BERLIN, 'driving', 'ferry')
      vi.useRealTimers()
      expect([status, relayCalls, fossgis]).toEqual([status, 1, 2])
    }
  })

  it('VALHALLA-RELAY-003: asks the relay again once the rest is over', async () => {
    let relayCalls = 0
    server.use(
      http.post(RELAY, () => { relayCalls++; return HttpResponse.json({ error: 'no' }, { status: 503 }) }),
      http.post(FOSSGIS_VALHALLA, () => HttpResponse.json(answer())),
    )
    await valhallaRouteAvoiding(HAMBURG, BERLIN, 'driving', 'toll')
    expect(relayCalls).toBe(1)
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(Date.now() + 11 * 60_000)
    expect(valhallaBase()).toBe(TREK_VALHALLA)
    vi.useRealTimers()
  })

  it("VALHALLA-RELAY-004: reads Valhalla's own refusal through the relay as no way, without asking FOSSGIS", async () => {
    let fossgis = 0
    server.use(
      http.post(RELAY, () => HttpResponse.json({ error_code: 442, error: 'No path could be found for input' }, { status: 400 })),
      http.post(FOSSGIS_VALHALLA, () => { fossgis++; return HttpResponse.json(answer()) }),
    )
    const points = [HAMBURG, BERLIN]
    expect(await valhallaRunOnFoot(points, undefined, { use_ferry: 0 }, { exclude_ferry: true })).toEqual({ noPath: true })
    expect(fossgis).toBe(0)
    expect(valhallaBase()).toBe(TREK_VALHALLA)
  })

  it('VALHALLA-RELAY-005: describes a line through the relay as a polyline', async () => {
    const bodies: Record<string, unknown>[] = []
    server.use(http.post(RELAY, async ({ request }) => {
      bodies.push(await request.json() as Record<string, unknown>)
      return HttpResponse.json({ edges: [] })
    }))
    await expect(valhallaTraceAttributes(SHAPE_POINTS)).resolves.toEqual({ edges: [] })
    expect(bodies[0]).not.toHaveProperty('shape')
    expect(bodies[0]).toMatchObject({ encoded_polyline: expect.any(String), costing: 'bicycle', shape_match: 'map_snap' })
  })

  it('VALHALLA-RELAY-006: reads a 400 without error_code, and a route the server does not have, as the relay unable to answer', async () => {
    const refusals = [
      () => HttpResponse.json({ error: 'Expected number, received string' }, { status: 400 }),
      () => new HttpResponse('Not Found', { status: 404 }),
      () => HttpResponse.json({ error: 'Method Not Allowed' }, { status: 405 }),
    ]
    for (const refusal of refusals) {
      resetValhallaTurns()
      let fossgis = 0
      server.use(
        http.post(RELAY, refusal),
        http.post(FOSSGIS_VALHALLA, () => { fossgis++; return HttpResponse.json(answer()) }),
      )
      await expect(valhallaRouteAvoiding(HAMBURG, BERLIN, 'driving', 'toll')).resolves.not.toBeNull()
      expect(fossgis).toBe(1)
      expect(valhallaBase()).toBe('https://valhalla1.openstreetmap.de')
    }
  })

  it('VALHALLA-RELAY-007: rests the relay as long as its Retry-After says, at most an hour', async () => {
    for (const [retryAfter, restMs] of [['30', 30_000], ['86400', 60 * 60_000]] as const) {
      resetValhallaTurns()
      server.use(
        http.post(RELAY, () => HttpResponse.json({ error: 'spent' }, { status: 429, headers: { 'Retry-After': retryAfter } })),
        http.post(FOSSGIS_VALHALLA, () => HttpResponse.json(answer())),
      )
      await valhallaRouteAvoiding(HAMBURG, BERLIN, 'driving', 'toll')
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(Date.now() + restMs - 1000)
      expect(valhallaBase()).toBe('https://valhalla1.openstreetmap.de')
      vi.setSystemTime(Date.now() + 2000)
      expect(valhallaBase()).toBe(TREK_VALHALLA)
      vi.useRealTimers()
    }
  })

  it('VALHALLA-RELAY-008: gives up on a relay that does not answer in time and asks FOSSGIS', async () => {
    const timeout = AbortSignal.timeout.bind(AbortSignal)
    const spy = vi.spyOn(AbortSignal, 'timeout').mockImplementation(ms =>
      ms === 12_000 ? AbortSignal.abort(new DOMException('signal timed out', 'TimeoutError')) : timeout(ms))
    let fossgis = 0
    server.use(
      http.post(RELAY, () => HttpResponse.json(answer())),
      http.post(FOSSGIS_VALHALLA, () => { fossgis++; return HttpResponse.json(answer()) }),
    )
    await expect(valhallaRouteAvoiding(HAMBURG, BERLIN, 'driving', 'toll')).resolves.not.toBeNull()
    expect(spy).toHaveBeenCalledWith(12_000)
    expect(fossgis).toBe(1)
    expect(valhallaBase()).toBe('https://valhalla1.openstreetmap.de')
    spy.mockRestore()
  })
})
