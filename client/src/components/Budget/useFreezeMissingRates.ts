import { useEffect, useRef } from 'react'
import type { BudgetFallbackFx, BudgetUnconverted } from '@trek/shared'
import { fetchFreshRates, isSendableRate } from '../../hooks/useExchangeRates'
import { useTripStore } from '../../store/tripStore'
import { isEffectivelyOffline } from '../../sync/networkMode'

/**
 * Every set of rows already tried, by trip, trip currency and ids. The settlement lists a
 * row it cannot count until a rate is frozen on it; one the browser has no rate for either
 * stays listed, and without this every reload of the settlement would ask again.
 */
const tried = new Set<string>()

/** Test-only: the attempts outlive a vitest file's individual tests. */
export function resetFreezeAttempts(): void {
  tried.clear()
}

/**
 * Heals the rows the settlement leaves out (`unconverted`): expenses and transfers in a
 * foreign currency that never froze a rate, while the server cannot fetch one. That is the
 * setup where the server's own fetch fails and the browser's works, so an editor's browser
 * lends its fresh rates to POST …/budget/freeze-rates. The server still prefers its own rate
 * and never touches a row that is frozen already.
 *
 * Runs for an editor only, online, and once per set of rows. No request goes out when the
 * browser has no rate for any of the listed currencies either. `onHealed` runs when the
 * server froze something, so the caller can reload the settlement.
 *
 * Deliberately not in the mutation queue: the heal is derived and idempotent, and a replay
 * hours later would freeze a rate from another day.
 */
export function useFreezeMissingRates({ tripId, tripCurrency, canEdit, unconverted, onHealed }: {
  tripId: number
  tripCurrency: string
  canEdit: boolean
  unconverted: BudgetUnconverted | null | undefined
  onHealed: () => void
}): void {
  const onHealedRef = useRef(onHealed)
  useEffect(() => { onHealedRef.current = onHealed })
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const trip = (tripCurrency || '').toUpperCase()
  const itemIds = [...(unconverted?.item_ids ?? [])].sort((a, b) => a - b).join(',')
  const settlementIds = [...(unconverted?.settlement_ids ?? [])].sort((a, b) => a - b).join(',')
  const currencies = (unconverted?.currencies ?? []).join(',')

  useEffect(() => {
    if (!canEdit || !trip || (!itemIds && !settlementIds) || isEffectivelyOffline()) return
    const key = `${tripId}:${trip}:${itemIds}:${settlementIds}`
    if (tried.has(key)) return
    tried.add(key)

    const heal = async (): Promise<void> => {
      const rates = await fetchFreshRates(trip)
      const lent: Record<string, number> = {}
      for (const cur of currencies.split(',')) {
        const rate = rates?.[cur]
        if (isSendableRate(rate)) lent[cur] = rate
      }
      if (Object.keys(lent).length === 0) return
      const fallback: BudgetFallbackFx = { base: trip, rates: lent }
      const result = await useTripStore.getState().freezeMissingRates(tripId, fallback)
      if (mounted.current && (result.items.length > 0 || result.settlements.length > 0)) onHealedRef.current()
    }
    heal().catch((err: unknown) => console.warn('Could not freeze the missing exchange rates:', err))
  }, [canEdit, trip, tripId, itemIds, settlementIds, currencies])
}
