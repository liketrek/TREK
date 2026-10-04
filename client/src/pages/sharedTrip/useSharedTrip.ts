import { useState, useEffect } from 'react'
import { useParams } from 'react-router'
import { shareApi } from '../../api/client'
import { useExchangeRates } from '../../hooks/useExchangeRates'
import { isSharedTripPayload, sharedTripLoadError, type SharedTripLoadError } from './sharedTripModel'

/**
 * Shared-trip (public) data hook — owns the token lookup, the read-only share
 * fetch with its retry, and the view state (selected day, active tab, language
 * picker). SharedTripPage is a pure wiring container; the post-load derivations
 * (sortedDays, map places, …) stay in the page next to the JSX that uses them.
 */
export function useSharedTrip() {
  const { token } = useParams<{ token: string }>()
  // The shared payload is an open-ended snapshot (trip, days, assignments, …),
  // matched 1:1 from the public share endpoint — kept loosely typed as before.
  const [data, setData] = useState<any>(null)
  // 'expired' only for the endpoint's own 404; any other failure, a proxy's
  // 404 or a 200 that is not the payload included, is 'unavailable' and keeps
  // the viewer on a retry (#2505).
  const [error, setError] = useState<SharedTripLoadError | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [retrying, setRetrying] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState('plan')
  const [showLangPicker, setShowLangPicker] = useState(false)
  // Every day opens unfolded, as the planner's do; a day the reader folds stays folded.
  const [collapsedDays, setCollapsedDays] = useState<ReadonlySet<number>>(() => new Set())

  useEffect(() => {
    if (!token) return
    let cancelled = false
    shareApi
      .getSharedTrip(token)
      .then((payload) => {
        if (cancelled) return
        if (!isSharedTripPayload(payload)) {
          setError('unavailable')
          return
        }
        setData(payload)
        setError(null)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(sharedTripLoadError(err))
      })
      .finally(() => {
        if (!cancelled) setRetrying(false)
      })
    return () => {
      cancelled = true
    }
  }, [token, attempt])

  // The failed screen stays up while the next attempt runs, so a request that
  // fails again straight away does not flash the spinner.
  const retry = () => {
    if (retrying) return
    setRetrying(true)
    setAttempt((n) => n + 1)
  }

  // The server now withholds the whole itinerary when the owner disabled the map
  // (share_map=false), so the Plan tab has nothing to show — land on the first
  // section the owner actually shared instead of an empty map.
  useEffect(() => {
    if (!data) return
    const p = data.permissions || {}
    if (p.share_map === false && activeTab === 'plan') {
      setActiveTab(
        p.share_bookings ? 'bookings' : p.share_packing ? 'packing' : p.share_budget ? 'budget' : p.share_collab ? 'collab' : 'plan'
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  // Budget display currency = what the share owner sees in Costs (embedded in the
  // payload as baseCurrency), falling back to the trip's own currency, then EUR.
  // Convert every expense into it via live FX, mirroring CostsPanel — a public
  // viewer has no settings store, so the base comes from the payload (#1361).
  const base = String(data?.baseCurrency || data?.trip?.currency || 'EUR').toUpperCase()
  // Anchored on the trip currency's quote, as the Costs tab converts (#2525).
  const { convert } = useExchangeRates(base, data?.trip?.currency)

  const toggleDay = (id: number) => {
    setCollapsedDays(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // A day picked on the map also brings its card into view where the two sit
  // side by side. On a phone the list is below the map, and scrolling to it
  // would take away the map the reader just asked to see.
  const pickDayOnMap = (id: number | null) => {
    setSelectedDay(id)
    if (id == null || typeof window === 'undefined' || !window.matchMedia?.('(min-width: 1024px)').matches) return
    setCollapsedDays(prev => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    document.getElementById(`shared-day-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return {
    data,
    error,
    retry,
    retrying,
    base,
    convert,
    selectedDay,
    setSelectedDay,
    pickDayOnMap,
    collapsedDays,
    toggleDay,
    activeTab,
    setActiveTab,
    showLangPicker,
    setShowLangPicker,
  }
}
