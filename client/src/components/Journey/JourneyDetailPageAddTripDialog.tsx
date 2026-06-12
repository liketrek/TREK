import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { journeyApi } from '../../api/client'
import { useToast } from '../shared/Toast'
import { pickGradient } from '../../pages/journeyDetail/JourneyDetailPage.helpers'

export function AddTripDialog({ journeyId, existingTripIds, onClose, onAdded }: {
  journeyId: number
  existingTripIds: number[]
  onClose: () => void
  onAdded: () => void
}) {
  const { t } = useTranslation()
  const [trips, setTrips] = useState<{ id: number; title: string; destination?: string; start_date?: string; end_date?: string }[]>([])
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState<number | null>(null)
  const toast = useToast()

  useEffect(() => {
    journeyApi.availableTrips().then(d => setTrips(d.trips || [])).catch(() => {})
  }, [])

  const filtered = trips.filter(trip => {
    if (existingTripIds.includes(trip.id)) return false
    if (!search) return true
    const q = search.toLowerCase()
    return trip.title.toLowerCase().includes(q) || (trip.destination || '').toLowerCase().includes(q)
  })

  const handleAdd = async (tripId: number) => {
    setAdding(tripId)
    try {
      await journeyApi.addTrip(journeyId, tripId)
      toast.success(t('journey.trips.tripLinked'))
      onAdded()
    } catch {
      toast.error(t('journey.trips.linkFailed'))
    } finally {
      setAdding(null)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-5 bg-[rgba(9,9,11,0.75)]">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.2)] max-w-[420px] w-full flex flex-col overflow-hidden">

        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-[16px] font-bold text-zinc-900 dark:text-white">{t('journey.trips.linkTrip')}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-semibold tracking-[0.12em] uppercase text-zinc-500 block mb-1.5">{t('journey.trips.searchTrip')}</label>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('journey.trips.searchPlaceholder')}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[13px] bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
            />
          </div>

          <div className="max-h-[280px] overflow-y-auto flex flex-col gap-1">
            {filtered.length === 0 && (
              <p className="text-[12px] text-zinc-400 text-center py-4">{t('journey.trips.noTripsAvailable')}</p>
            )}
            {filtered.map(trip => (
              <div
                key={trip.id}
                className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-transparent"
              >
                <div className="w-9 h-9 rounded-md flex-shrink-0" style={{ background: pickGradient(trip.id) }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-zinc-900 dark:text-white truncate">{trip.title}</div>
                  {(trip.destination || trip.start_date) && (
                    <div className="text-[11px] text-zinc-500 truncate">
                      {trip.destination}{trip.destination && trip.start_date ? ' · ' : ''}{trip.start_date}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleAdd(trip.id)}
                  disabled={adding === trip.id}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-50"
                >
                  {adding === trip.id ? '...' : t('journey.trips.link')}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
