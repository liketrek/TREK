import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../../tests/helpers/msw/server'
import { bookedInTrip, convertBooked, convertedLine, crossRate, fetchExchangeRates, fetchFreshRates, freshRates, clearExchangeRateCache, tripAmountOf, useExchangeRates, withFallbackFx } from './useExchangeRates'

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

  // A request the network never answers held the Costs panel's heal for as long as the
  // browser kept the socket open. It gives up after 10 s like any other failure.
  it('gives up on a request that hangs after 10 s and serves the stale cache', async () => {
    vi.useFakeTimers()
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    try {
      localStorage.setItem('trek_fx_NOK', JSON.stringify({ rates: { NOK: 1, USD: 0.1 }, ts: Date.now() - 24 * 60 * 60 * 1000 }))
      let signal: AbortSignal | undefined
      fetchSpy.mockImplementation((_input, init) => new Promise((_resolve, reject) => {
        signal = init?.signal ?? undefined
        signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
      }))
      const pending = fetchExchangeRates('NOK')
      await vi.advanceTimersByTimeAsync(9_999)
      expect(signal?.aborted).toBe(false)
      await vi.advanceTimersByTimeAsync(1)
      expect(signal?.aborted).toBe(true)
      expect(await pending).toEqual({ NOK: 1, USD: 0.1 })
    } finally {
      fetchSpy.mockRestore()
      vi.useRealTimers()
    }
  })
})

// The rates the client lends the server to freeze a rate with. Only a fresh table counts:
// a stale one would pin a figure from another day on the row for good.
describe('freshRates and fetchFreshRates', () => {
  beforeEach(() => {
    clearExchangeRateCache()
  })

  it('reads a fresh cache and ignores a stale or missing one', () => {
    expect(freshRates('AUD')).toBeNull()
    localStorage.setItem('trek_fx_AUD', JSON.stringify({ rates: { AUD: 1, VND: 18241.3 }, ts: Date.now() - 7 * 60 * 60 * 1000 }))
    expect(freshRates('aud')).toBeNull()
    clearExchangeRateCache()
    localStorage.setItem('trek_fx_AUD', JSON.stringify({ rates: { AUD: 1, VND: 18241.3 }, ts: Date.now() }))
    expect(freshRates('aud')).toEqual({ AUD: 1, VND: 18241.3 })
  })

  it('fetches when the cache is stale and gives the new table', async () => {
    localStorage.setItem('trek_fx_AUD', JSON.stringify({ rates: { AUD: 1, VND: 15000 }, ts: Date.now() - 7 * 60 * 60 * 1000 }))
    server.use(http.get(FX_URL, () => HttpResponse.json([{ quote: 'VND', rate: 18241.3 }])))
    expect(await fetchFreshRates('AUD')).toEqual({ AUD: 1, VND: 18241.3 })
  })

  it('is null when the fetch fails and only a stale table is left', async () => {
    localStorage.setItem('trek_fx_AUD', JSON.stringify({ rates: { AUD: 1, VND: 15000 }, ts: Date.now() - 7 * 60 * 60 * 1000 }))
    server.use(http.get(FX_URL, () => HttpResponse.error()))
    expect(await fetchFreshRates('AUD')).toBeNull()
  })
})

describe('withFallbackFx', () => {
  beforeEach(() => {
    clearExchangeRateCache()
    localStorage.setItem('trek_fx_AUD', JSON.stringify({ rates: { AUD: 1, VND: 18241.3, EUR: 0.61, XAU: 1e-10 }, ts: Date.now() }))
  })

  it('lends the fresh trip-currency rate for a foreign currency', () => {
    expect(withFallbackFx({ name: 'Pho', currency: 'vnd', total_price: 8920000 }, 'aud')).toEqual({
      name: 'Pho', currency: 'vnd', total_price: 8920000,
      fallback_fx: { base: 'AUD', rates: { VND: 18241.3 } },
    })
    expect(withFallbackFx({ from_user_id: 1, to_user_id: 2, amount: 10, currency: 'EUR' }, 'AUD').fallback_fx)
      .toEqual({ base: 'AUD', rates: { EUR: 0.61 } })
  })

  it('leaves the data alone when there is nothing to lend', () => {
    const inTrip = { name: 'Tram', currency: 'AUD' }
    expect(withFallbackFx(inTrip, 'AUD')).toBe(inTrip)
    // No currency at all is the trip's own.
    expect(withFallbackFx({ name: 'Tram', currency: null }, 'AUD')).toEqual({ name: 'Tram', currency: null })
    // An explicit rate is the caller's and wins on the server anyway.
    expect(withFallbackFx({ currency: 'VND', exchange_rate: 17000 }, 'AUD')).toEqual({ currency: 'VND', exchange_rate: 17000 })
    // No quote for the currency, no trip currency, or a rate the contract would refuse.
    expect(withFallbackFx({ currency: 'JPY' }, 'AUD')).toEqual({ currency: 'JPY' })
    expect(withFallbackFx({ currency: 'VND' }, null)).toEqual({ currency: 'VND' })
    expect(withFallbackFx({ currency: 'XAU' }, 'AUD')).toEqual({ currency: 'XAU' })
  })

  it('lends nothing from a stale table', () => {
    clearExchangeRateCache()
    localStorage.setItem('trek_fx_AUD', JSON.stringify({ rates: { AUD: 1, VND: 18241.3 }, ts: Date.now() - 7 * 60 * 60 * 1000 }))
    expect(withFallbackFx({ currency: 'VND' }, 'AUD')).toEqual({ currency: 'VND' })
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

  // #2525: a euro trip read in dollars, the bill entered in dollars. It was booked at 685.26
  // EUR, and that is what the balances and settle-up net and then show at today's rate. The
  // row has to show the same figure, or paying back the "you lent" it printed reopens the trip.
  it('reads an amount in the display currency through the trip currency too', () => {
    const liveUsd = (amount: number, from: string | null | undefined): number => {
      const rates: Record<string, number> = { USD: 1, EUR: 1 / 1.1398 }
      const r = rates[(from || 'USD').toUpperCase()]
      return r && r > 0 ? amount / r : amount
    }
    // 685.26 EUR, then at today's 1.1398 dollars to the euro.
    expect(convertBooked(801.76, 'USD', 1.17, 'EUR', liveUsd)).toBeCloseTo((801.76 / 1.17) * 1.1398, 6)
    expect(convertBooked(801.76, 'USD', 1.17, 'EUR', liveUsd)).not.toBeCloseTo(801.76, 1)
    // Without a booked rate there is nothing to go through, and dollars stay dollars.
    expect(convertBooked(801.76, 'USD', 1, 'EUR', liveUsd)).toBe(801.76)
  })
})

describe('bookedInTrip', () => {
  it('gives the trip-currency amount a foreign row was booked at', () => {
    expect(bookedInTrip(801.76, 'USD', 1.17, 'EUR')).toBeCloseTo(685.26, 2)
    expect(bookedInTrip(12000, 'jpy', 170, 'eur')).toBeCloseTo(70.59, 2)
  })

  it('has nothing to give for a row in the trip currency or one that never froze a rate', () => {
    expect(bookedInTrip(100, 'EUR', 1.17, 'EUR')).toBeNull()
    expect(bookedInTrip(100, null, 1.17, 'EUR')).toBeNull()
    expect(bookedInTrip(100, 'USD', 1, 'EUR')).toBeNull()
    expect(bookedInTrip(100, 'USD', null, 'EUR')).toBeNull()
    expect(bookedInTrip(100, 'USD', 0, 'EUR')).toBeNull()
  })
})

// #2525: the server freezes an entry rate from the trip currency's quote and converts the
// settlement back with it. Read through the display currency's own quote, a separately
// rounded figure, a same-day 12,345.67 USD bill on a euro trip came back as $12,346.05.
describe('useExchangeRates anchored on the trip currency (#2525)', () => {
  beforeEach(() => {
    clearExchangeRateCache()
  })

  const quotes = (): void => {
    server.use(http.get(FX_URL, ({ request }) => {
      const base = new URL(request.url).searchParams.get('base')
      if (base === 'EUR') return HttpResponse.json([{ quote: 'USD', rate: 1.1398 }, { quote: 'JPY', rate: 170 }])
      if (base === 'USD') return HttpResponse.json([{ quote: 'EUR', rate: 0.87732 }, { quote: 'JPY', rate: 149.1 }])
      return HttpResponse.error()
    }))
  }

  it('converts the trip currency with its own quote, so a same-day bill reads as typed', async () => {
    quotes()
    const { result } = renderHook(() => useExchangeRates('usd', 'eur'))
    await waitFor(() => expect(result.current.convert(1, 'EUR')).toBe(1.1398))
    const shown = convertBooked(12345.67, 'USD', 1.1398, 'EUR', result.current.convert)
    expect(Math.round(shown * 100)).toBe(1234567)
    expect(Math.round(convertBooked(250, 'USD', 1.1398, 'EUR', result.current.convert) * 100)).toBe(25000)
    // A foreign row that never froze a rate goes through the same quote as well.
    expect(result.current.convert(170, 'JPY')).toBeCloseTo(1.1398, 10)
    // The display currency's own rates stay what the hook hands out.
    expect(result.current.rates).toEqual({ USD: 1, EUR: 0.87732, JPY: 149.1 })
  })

  it('falls back to the display currency\'s quote while the trip\'s is missing', async () => {
    server.use(http.get(FX_URL, ({ request }) => (new URL(request.url).searchParams.get('base') === 'USD'
      ? HttpResponse.json([{ quote: 'EUR', rate: 0.8 }])
      : HttpResponse.error())))
    const { result } = renderHook(() => useExchangeRates('USD', 'EUR'))
    await waitFor(() => expect(result.current.convert(8, 'EUR')).toBe(10))
    expect(result.current.convert(5, 'USD')).toBe(5)
  })

  it('fetches one set of rates when the trip is in the display currency', async () => {
    let calls = 0
    server.use(http.get(FX_URL, () => { calls++; return HttpResponse.json([{ quote: 'USD', rate: 1.1398 }]) }))
    const { result } = renderHook(() => useExchangeRates('EUR', 'EUR'))
    await waitFor(() => expect(result.current.convert(1.1398, 'USD')).toBe(1))
    expect(calls).toBe(1)
    expect(result.current.displayPerTrip).toBe(1)
  })

  // What the settlement is asked to label its figures with when the server has no quote
  // (`base_rate`): the same figure `convert` takes a trip amount to the display currency with.
  it('gives the display currency per 1 trip currency from the trip\'s quote', async () => {
    quotes()
    const { result } = renderHook(() => useExchangeRates('USD', 'EUR'))
    await waitFor(() => expect(result.current.displayPerTrip).toBe(1.1398))
    expect(result.current.convert(1, 'EUR')).toBe(result.current.displayPerTrip)
  })

  it('falls back to the display currency\'s quote for it, and is null without either', async () => {
    server.use(http.get(FX_URL, ({ request }) => (new URL(request.url).searchParams.get('base') === 'USD'
      ? HttpResponse.json([{ quote: 'EUR', rate: 0.8 }])
      : HttpResponse.error())))
    const { result } = renderHook(() => useExchangeRates('USD', 'EUR'))
    await waitFor(() => expect(result.current.displayPerTrip).toBe(1.25))

    clearExchangeRateCache()
    let calls = 0
    server.use(http.get(FX_URL, () => { calls++; return HttpResponse.error() }))
    const none = renderHook(() => useExchangeRates('GBP', 'AUD'))
    await waitFor(() => expect(calls).toBe(2))
    expect(none.result.current.displayPerTrip).toBeNull()
  })

  // A trip in gold read in rials: 2.6 billion rials to the ounce is past the 1e9 the
  // settlement query takes, and sent as `base_rate` it would fail the whole read with a 400.
  it('is null for a figure the settlement query would refuse, which convert still uses', () => {
    localStorage.setItem('trek_fx_XAU', JSON.stringify({ rates: { XAU: 1, IRR: 2.6e9 }, ts: Date.now() }))
    localStorage.setItem('trek_fx_IRR', JSON.stringify({ rates: { IRR: 1, XAU: 1 / 2.6e9 }, ts: Date.now() }))
    const high = renderHook(() => useExchangeRates('IRR', 'XAU'))
    expect(high.result.current.convert(1, 'XAU')).toBe(2.6e9)
    expect(high.result.current.displayPerTrip).toBeNull()
    // The other way round the figure falls under 1e-9.
    const low = renderHook(() => useExchangeRates('XAU', 'IRR'))
    expect(low.result.current.convert(2.6e9, 'IRR')).toBeCloseTo(1, 10)
    expect(low.result.current.displayPerTrip).toBeNull()
  })
})

describe('crossRate', () => {
  it('reads units of one currency per another from rates on any base', () => {
    expect(crossRate({ EUR: 1, USD: 1.25, GBP: 0.8 }, 'USD', 'GBP')).toBe(1.5625)
    expect(crossRate({ EUR: 1, USD: 1.25 }, 'USD', 'EUR')).toBe(1.25)
  })

  it('has nothing to say without both quotes', () => {
    expect(crossRate(null, 'USD', 'EUR')).toBeNull()
    expect(crossRate({ EUR: 1 }, 'USD', 'EUR')).toBeNull()
    expect(crossRate({ EUR: 0, USD: 1 }, 'USD', 'EUR')).toBeNull()
  })
})

describe('tripAmountOf', () => {
  // Display USD, trip EUR: one euro buys 1.25 dollars and 100 yen.
  const live = (amount: number, from: string | null | undefined): number =>
    amount * ({ EUR: 1.25, USD: 1, JPY: 0.0125 } as Record<string, number>)[(from || 'USD').toUpperCase()]

  it('is the booked amount for a row booked through the trip currency', () => {
    expect(tripAmountOf(801.76, 'USD', 1.17, 'EUR', live)).toBeCloseTo(685.26, 2)
  })

  it('is the amount itself for a row in the trip currency', () => {
    expect(tripAmountOf(100, null, null, 'eur', live)).toBe(100)
    expect(tripAmountOf(100, 'EUR', 1, 'EUR', live)).toBe(100)
  })

  it('counts a row that never froze a rate at today\'s', () => {
    expect(tripAmountOf(1000, 'JPY', 1, 'EUR', live)).toBeCloseTo(10, 10)
    // Without rates the conversion is the identity, as it is on the server.
    expect(tripAmountOf(1000, 'JPY', null, 'EUR', (a: number) => a)).toBe(1000)
  })
})

describe('convertedLine', () => {
  it('shows the entered amount and the booked trip amount for a bill booked through the trip currency', () => {
    expect(convertedLine(801.76, 'usd', 1.17, 'EUR', 'USD', 791.55)).toEqual({
      entered: { amount: 801.76, currency: 'USD' },
      into: { amount: 801.76 / 1.17, currency: 'EUR' },
    })
    expect(convertedLine(12000, 'JPY', 170, 'EUR', 'USD', 80.46)?.into).toEqual({ amount: 12000 / 170, currency: 'EUR' })
  })

  it('has no line for a bill in the display currency that still reads as typed', () => {
    expect(convertedLine(12345.67, 'USD', 1.1398, 'EUR', 'USD', 12345.670000000002)).toBeNull()
    // Rounded to the display currency's own decimals.
    expect(convertedLine(1500, 'JPY', 0.0125, 'EUR', 'JPY', 1500.2)).toBeNull()
  })

  it('has no line for an amount of 0 or a row that was never converted', () => {
    expect(convertedLine(0, 'USD', 1.17, 'EUR', 'USD', 0)).toBeNull()
    expect(convertedLine(0, 'JPY', 170, 'EUR', 'USD', 0)).toEqual({ entered: { amount: 0, currency: 'JPY' }, into: { amount: 0, currency: 'USD' } })
    expect(convertedLine(50, 'USD', 1, 'EUR', 'USD', 50)).toBeNull()
    expect(convertedLine(50, null, null, 'USD', '', 50)).toBeNull()
  })

  it('goes straight to the display value for a row in the trip currency, or when the viewer reads the trip currency', () => {
    expect(convertedLine(100, null, null, 'EUR', 'USD', 113.98)).toEqual({ entered: { amount: 100, currency: 'EUR' }, into: { amount: 113.98, currency: 'USD' } })
    expect(convertedLine(801.76, 'USD', 1.17, 'EUR', 'EUR', 685.26)).toEqual({ entered: { amount: 801.76, currency: 'USD' }, into: { amount: 685.26, currency: 'EUR' } })
  })
})
