import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../tests/helpers/msw/server'
import { convertBooked, fetchExchangeRates, clearExchangeRateCache } from './useExchangeRates'

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

// A cost entered in a foreign currency is money that was actually paid, at a rate that
// was true that day. Reading it back at today's rate quietly rewrites history, which is
// what a tester reported after settling up: the figure moved under him.
describe('convertBooked', () => {
  // Display currency is EUR, so rates are units per 1 EUR. The trip is booked in EUR too
  // unless a test says otherwise.
  const live = (amount: number, from: string | null | undefined): number => {
    const rates: Record<string, number> = { EUR: 1, USD: 2, SEK: 10 }
    const r = rates[(from || 'EUR').toUpperCase()]
    return r && r > 0 ? amount / r : amount
  }

  it('leaves an amount already in the trip currency to the live step alone', () => {
    // Nothing was ever frozen here, so this is just trip currency to display currency.
    expect(convertBooked(100, null, 1, 'EUR', live)).toBe(100)
    expect(convertBooked(100, 'EUR', 1, 'EUR', live)).toBe(100)
  })

  it('reads a foreign amount at the rate it was booked at, not at today s', () => {
    // 120 USD booked when a euro bought 1.2 dollars is 100 EUR, and stays 100 EUR even
    // though the live table above says a euro now buys 2.
    expect(convertBooked(120, 'USD', 1.2, 'EUR', live)).toBe(100)
  })

  it('falls back to live rates for a row that never froze one', () => {
    // Rate 1 is the column default, not a booked rate: rows predating the freeze carry it.
    expect(convertBooked(120, 'USD', 1, 'EUR', live)).toBe(60)
    expect(convertBooked(120, 'USD', undefined, 'EUR', live)).toBe(60)
    expect(convertBooked(120, 'USD', null, 'EUR', live)).toBe(60)
    // A rate that cannot divide is no rate at all.
    expect(convertBooked(120, 'USD', 0, 'EUR', live)).toBe(60)
    expect(convertBooked(120, 'USD', -2, 'EUR', live)).toBe(60)
  })

  it('goes through the trip currency when the reader displays a third one', () => {
    // 200 SEK booked at 10 SEK per euro is 20 EUR of trip money, which the live step then
    // takes to the display currency. The frozen rate is against the trip, never the display.
    expect(convertBooked(200, 'SEK', 10, 'EUR', live)).toBe(20)
    // Trip in USD, display in EUR: 200 SEK at 5 SEK per dollar is 40 USD, then 20 EUR.
    expect(convertBooked(200, 'SEK', 5, 'USD', live)).toBe(20)
  })

  it('treats currency case as noise', () => {
    expect(convertBooked(120, 'usd', 1.2, 'eur', live)).toBe(100)
    expect(convertBooked(100, 'eur', 1, 'EUR', live)).toBe(100)
  })
})
