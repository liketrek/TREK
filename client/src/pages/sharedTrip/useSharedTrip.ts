import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { shareApi } from '../../api/client'
import { useExchangeRates } from '../../hooks/useExchangeRates'

/**
 * Shared-trip (public) data hook — owns the token lookup, the read-only share
 * fetch and the view state (selected day, active tab, language picker).
 * SharedTripPage is a pure wiring container; the post-load derivations
 * (sortedDays, map places, …) stay in the page next to the JSX that uses them.
 * Behaviour is identical to the previous in-component logic.
 */
export function useSharedTrip() {
  const { token } = useParams<{ token: string }>()
  // The shared payload is an open-ended snapshot (trip, days, assignments, …),
  // matched 1:1 from the public share endpoint — kept loosely typed as before.
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState('plan')
  const [showLangPicker, setShowLangPicker] = useState(false)

  useEffect(() => {
    if (!token) return
    shareApi.getSharedTrip(token).then(setData).catch(() => setError(true))
  }, [token])

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
  const { convert } = useExchangeRates(base)

  return { data, error, base, convert, selectedDay, setSelectedDay, activeTab, setActiveTab, showLangPicker, setShowLangPicker }
}
