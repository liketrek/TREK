import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../tests/helpers/msw/server'
import { fetchExchangeRates, clearExchangeRateCache } from './useExchangeRates'

const FX_URL = 'https://api.frankfurter.dev/v2/rates'

// Contract tests for the plain fetcher the PDF export relies on: it must never
// reject, and "no usable rates" must come back as null (→ breakdown fallback),
// never as a half-filled object.
describe('fetchExchangeRates (#1561)', () => {
  beforeEach(() => {
    clearExchangeRateCache()
  })

  it('fetches, seeds the base self-rate, and caches', async () => {
    let calls = 0
    server.use(http.get(FX_URL, () => {
      calls++
      return HttpResponse.json([{ quote: 'USD', rate: 0.095 }, { quote: 'bogus' }])
    }))
    const rates = await fetchExchangeRates('nok')
    expect(rates).toEqual({ NOK: 1, USD: 0.095 })
    // fresh cache short-circuits the second call
    expect(await fetchExchangeRates('NOK')).toEqual(rates)
    expect(calls).toBe(1)
  })

  it('returns null on failure with no cache', async () => {
    server.use(http.get(FX_URL, () => HttpResponse.error()))
    expect(await fetchExchangeRates('NOK')).toBeNull()
  })

  it('returns null for a non-array body', async () => {
    server.use(http.get(FX_URL, () => HttpResponse.json({ message: 'not found' })))
    expect(await fetchExchangeRates('NOK')).toBeNull()
  })

  it('falls back to a stale localStorage cache when the fetch fails', async () => {
    localStorage.setItem('trek_fx_NOK', JSON.stringify({
      rates: { NOK: 1, USD: 0.1 },
      ts: Date.now() - 24 * 60 * 60 * 1000, // expired
    }))
    server.use(http.get(FX_URL, () => HttpResponse.error()))
    expect(await fetchExchangeRates('NOK')).toEqual({ NOK: 1, USD: 0.1 })
  })
})
