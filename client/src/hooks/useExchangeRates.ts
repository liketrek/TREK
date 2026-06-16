import { useCallback, useEffect, useState } from 'react'

/**
 * Live FX rates for the Costs panel, used to convert every amount into the user's
 * display currency. Fetches api.frankfurter.dev (no key, already CSP-allowlisted
 * for the dashboard widget) for the given base and caches per base in memory +
 * localStorage for a few hours. rates[X] = units of X per 1 base, so an amount in
 * currency C converts to base as `amount / rates[C]`.
 */

const TTL_MS = 6 * 60 * 60 * 1000 // 6h
const mem = new Map<string, { rates: Record<string, number>; ts: number }>()

function readCache(base: string): { rates: Record<string, number>; ts: number } | null {
  const m = mem.get(base)
  if (m) return m
  try {
    const raw = localStorage.getItem('trek_fx_' + base)
    if (raw) {
      const parsed = JSON.parse(raw) as { rates: Record<string, number>; ts: number }
      if (parsed?.rates) { mem.set(base, parsed); return parsed }
    }
  } catch { /* ignore */ }
  return null
}

export function useExchangeRates(base: string) {
  const upper = (base || 'EUR').toUpperCase()
  const [rates, setRates] = useState<Record<string, number> | null>(() => readCache(upper)?.rates ?? null)

  useEffect(() => {
    const cached = readCache(upper)
    if (cached) setRates(cached.rates)
    if (cached && Date.now() - cached.ts < TTL_MS) return
    let cancelled = false
    fetch(`https://api.frankfurter.dev/v2/rates?base=${encodeURIComponent(upper)}`)
      .then(r => r.json())
      .then((d: Array<{ quote?: string; rate?: number }>) => {
        if (cancelled || !Array.isArray(d)) return
        // Frankfurter omits the base's own self-rate, so seed it with `base = 1`.
        const rates: Record<string, number> = { [upper]: 1 }
        for (const r of d) {
          if (r && typeof r.quote === 'string' && typeof r.rate === 'number') rates[r.quote] = r.rate
        }
        const entry = { rates, ts: Date.now() }
        mem.set(upper, entry)
        try { localStorage.setItem('trek_fx_' + upper, JSON.stringify(entry)) } catch { /* ignore */ }
        setRates(rates)
      })
      .catch(() => { /* offline → keep cached/identity */ })
    return () => { cancelled = true }
  }, [upper])

  const convert = useCallback(
    (amount: number, from: string | null | undefined): number => {
      const f = (from || upper).toUpperCase()
      if (f === upper || !rates) return amount
      const r = rates[f]
      return r && r > 0 ? amount / r : amount
    },
    [rates, upper],
  )

  return { rates, convert }
}
