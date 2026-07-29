// FE-W4WQ-001 to FE-W4WQ-005
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { WeatherResult } from '@trek/shared'

const get = vi.fn(async (_lat: number, _lng: number, _date: string) => ({} as WeatherResult))

vi.mock('../api/client', () => ({ weatherApi: { get: (lat: number, lng: number, date: string) => get(lat, lng, date) } }))

import { fetchWeather } from './weatherQueue'

function deferred() {
  let resolve!: (v: WeatherResult) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<WeatherResult>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

beforeEach(() => {
  get.mockReset()
})

describe('fetchWeather', () => {
  it('FE-W4WQ-001: forwards the coordinates and date to the api', async () => {
    const result = { temp: 21 } as unknown as WeatherResult
    get.mockResolvedValue(result)

    await expect(fetchWeather(48.1, 11.5, '2026-06-15')).resolves.toBe(result)
    expect(get).toHaveBeenCalledWith(48.1, 11.5, '2026-06-15')
  })

  it('FE-W4WQ-002: lets at most three requests run at once', async () => {
    const gates = [deferred(), deferred(), deferred(), deferred()]
    let started = 0
    get.mockImplementation(() => { const g = gates[started]; started++; return g.promise })

    const calls = gates.map((_, i) => fetchWeather(i, i, '2026-06-15'))
    await Promise.resolve()
    expect(started).toBe(3)

    // Releasing one slot lets the queued fourth request start.
    gates[0].resolve({} as WeatherResult)
    await calls[0]
    expect(started).toBe(4)

    gates[1].resolve({} as WeatherResult)
    gates[2].resolve({} as WeatherResult)
    gates[3].resolve({} as WeatherResult)
    await Promise.all(calls)
  })

  it('FE-W4WQ-003: releases the slot when a request rejects', async () => {
    get.mockRejectedValueOnce(new Error('offline'))
    await expect(fetchWeather(1, 1, '2026-06-15')).rejects.toThrow('offline')

    get.mockResolvedValue({ ok: true } as unknown as WeatherResult)
    await expect(fetchWeather(2, 2, '2026-06-16')).resolves.toEqual({ ok: true })
  })

  it('FE-W4WQ-004: drains a burst larger than the concurrency limit', async () => {
    get.mockImplementation(async (lat: number) => ({ lat } as unknown as WeatherResult))

    const results = await Promise.all(
      Array.from({ length: 8 }, (_, i) => fetchWeather(i, i, '2026-06-15')),
    )

    expect(results.map(r => (r as unknown as { lat: number }).lat)).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
    expect(get).toHaveBeenCalledTimes(8)
  })

  it('FE-W4WQ-005: keeps accepting work after the queue has fully drained', async () => {
    get.mockResolvedValue({ ok: true } as unknown as WeatherResult)
    await Promise.all(Array.from({ length: 5 }, (_, i) => fetchWeather(i, i, '2026-06-15')))

    await expect(fetchWeather(9, 9, '2026-06-20')).resolves.toEqual({ ok: true })
  })
})
