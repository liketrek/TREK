import { useCallback, useEffect, useState } from 'react'

/**
 * Server-authoritative FX snapshot used by every product surface. The browser
 * never contacts the provider: the server persists the last successful snapshot
 * and reports whether it is stale.
 */

const TTL_MS = 6 * 60 * 60 * 1000 // 6h
interface CachedRates { rates: Record<string, number>; ts: number; effective_date?: string | null; stale?: boolean }
const mem = new Map<string, CachedRates>()

function readCache(base: string): CachedRates | null {
  const m = mem.get(base)
  if (m) return m
  try {
    const raw = localStorage.getItem('trek_fx_' + base)
    if (raw) {
      const parsed = JSON.parse(raw) as CachedRates
      if (parsed?.rates) { mem.set(base, parsed); return parsed }
    }
  } catch { /* ignore */ }
  return null
}

/**
 * Plain-function twin of the hook, for non-React callers (PDF export). Never
 * rejects: a fresh cache short-circuits, otherwise it fetches and caches; on
 * any failure it returns the stale cache if one exists, else null ("no rates" —
 * callers fall back to per-currency breakdowns rather than converting).
 */
export async function fetchExchangeRates(base: string): Promise<Record<string, number> | null> {
  const upper = (base || 'EUR').toUpperCase()
  const cached = readCache(upper)
  if (cached && Date.now() - cached.ts < TTL_MS) return cached.rates
  try {
    const response = await fetch(`/api/exchange-rates?base=${encodeURIComponent(upper)}`)
    if (!response.ok) return cached?.rates ?? null
    const d = await response.json() as { rates?: Record<string, number>; effective_date?: string | null; stale?: boolean }
    if (!d?.rates) return cached?.rates ?? null
    const rates = d.rates
    const entry: CachedRates = { rates, ts: Date.now(), effective_date: d.effective_date, stale: d.stale }
    mem.set(upper, entry)
    try { localStorage.setItem('trek_fx_' + upper, JSON.stringify(entry)) } catch { /* ignore */ }
    return rates
  } catch {
    return cached?.rates ?? null // offline → stale beats nothing
  }
}

/** Test-only: the module-level cache outlives a vitest file's individual tests. */
export function clearExchangeRateCache(): void {
  mem.clear()
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith('trek_fx_')) localStorage.removeItem(k)
    }
  } catch { /* ignore */ }
}

export function useExchangeRates(base: string) {
  const upper = (base || 'EUR').toUpperCase()
  const [rates, setRates] = useState<Record<string, number> | null>(() => readCache(upper)?.rates ?? null)
  const [metadata, setMetadata] = useState(() => {
    const cached = readCache(upper)
    return { effectiveDate: cached?.effective_date ?? null, stale: cached?.stale ?? false }
  })

  useEffect(() => {
    const cached = readCache(upper)
    if (cached) {
      setRates(cached.rates)
      setMetadata({ effectiveDate: cached.effective_date ?? null, stale: cached.stale ?? false })
    }
    if (cached && Date.now() - cached.ts < TTL_MS) return
    let cancelled = false
    fetchExchangeRates(upper).then(r => {
      if (!cancelled && r) {
        setRates(r)
        const fresh = readCache(upper)
        setMetadata({ effectiveDate: fresh?.effective_date ?? null, stale: fresh?.stale ?? false })
      }
    })
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

  return { rates, convert, ...metadata }
}
