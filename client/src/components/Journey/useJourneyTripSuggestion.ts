import { useEffect, useState } from 'react'
import { journeyApi } from '../../api/client'
import { useJourneyStore } from '../../store/journeyStore'
import { useToast } from '../shared/Toast'
import { useTranslation } from '../../i18n'

export interface SuggestableTrip {
  id: number
  title: string
  start_date?: string | null
  end_date?: string | null
}

/**
 * The trip a journal day belongs to (#2265): one of the user's trips whose dates
 * take in `date` and that the journey does not follow yet. When several do, the
 * shortest one wins, the weekend inside a long holiday being the likelier match.
 */
export function tripForDate(trips: SuggestableTrip[], date: string | null | undefined, linkedIds: ReadonlySet<number>): SuggestableTrip | null {
  if (!date) return null
  const day = date.slice(0, 10)
  const span = (t: SuggestableTrip) => Date.parse(t.end_date!) - Date.parse(t.start_date!)
  return trips
    .filter(t => !linkedIds.has(t.id) && !!t.start_date && !!t.end_date && t.start_date <= day && day <= t.end_date)
    .sort((a, b) => span(a) - span(b))[0] ?? null
}

/**
 * Offers to link the trip an entry's date falls in (#2265), the reverse of the
 * "trip just ended, make a journey" prompt. Asks the server for the user's trips
 * once, and only for someone who may change the journey.
 */
export function useJourneyTripSuggestion(journeyId: number, linkedTripIds: number[], date: string | null | undefined, enabled: boolean) {
  const { t } = useTranslation()
  const toast = useToast()
  const [trips, setTrips] = useState<SuggestableTrip[]>([])
  const [dismissed, setDismissed] = useState<number | null>(null)
  const [linking, setLinking] = useState(false)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    journeyApi.availableTrips()
      .then(d => { if (!cancelled) setTrips(d.trips || []) })
      .catch(() => { /* No suggestion is the quiet fallback: the entry saves either way. */ })
    return () => { cancelled = true }
  }, [enabled])

  const suggestion = enabled ? tripForDate(trips, date, new Set(linkedTripIds)) : null

  const link = async () => {
    if (!suggestion || linking) return
    setLinking(true)
    try {
      await journeyApi.addTrip(journeyId, suggestion.id)
      toast.success(t('journey.trips.tripLinked'))
      await useJourneyStore.getState().loadJourney(journeyId)
    } catch {
      toast.error(t('journey.trips.linkFailed'))
    } finally {
      setLinking(false)
    }
  }

  return {
    trip: suggestion && suggestion.id !== dismissed ? suggestion : null,
    linking,
    link,
    dismiss: () => setDismissed(suggestion?.id ?? null),
  }
}
