import { useEffect, useId, useState } from 'react'
import { Link2, Search } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { journeyApi } from '../../api/client'
import { useToast } from '../shared/Toast'
import { DialogButton, DialogFooter, DialogHeader, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { INPUT } from '../shared/dialogParts'
import { pickGradient } from '../../pages/journeyDetail/JourneyDetailPage.helpers'

export function AddTripDialog({ journeyId, existingTripIds, onClose, onAdded }: {
  journeyId: number
  existingTripIds: number[]
  onClose: () => void
  onAdded: () => void
}) {
  const { t } = useTranslation()
  const labelId = useId()
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
    <DialogShell
      onClose={onClose}
      labelledBy={labelId}
      width="narrow"
      // The list shrinks while the search narrows it; a pinned top edge keeps the field still.
      align="top"
      header={(
        <DialogHeader
          tile={<DialogTile><Link2 size={20} strokeWidth={1.9} className="text-content-muted" /></DialogTile>}
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={onClose}
          title={t('journey.trips.linkTrip')}
        />
      )}
      footer={(
        <DialogFooter>
          <FooterSpacer />
          <DialogButton onClick={onClose}>{t('common.cancel')}</DialogButton>
        </DialogFooter>
      )}
    >
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-faint" aria-hidden="true" />
        <input
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('journey.trips.searchPlaceholder')}
          aria-label={t('journey.trips.searchTrip')}
          className={`${INPUT} pl-8`}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="m-0 rounded-[12px] bg-surface-secondary px-4 py-6 text-center text-content-faint" style={fs(12.5, 'body')}>{t('journey.trips.noTripsAvailable')}</p>
      ) : (
        <div className="flex flex-col gap-0.5 rounded-[14px] border border-edge-faint bg-surface-secondary p-1.5">
          {filtered.map(trip => (
            <div key={trip.id} className="flex min-h-[52px] items-center gap-3 rounded-[10px] px-2.5 py-2 hover:bg-surface-card">
              <span className="h-9 w-9 flex-none rounded-[9px]" style={{ background: pickGradient(trip.id) }} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-content" style={fs(13, 'body')}>{trip.title}</div>
                {(trip.destination || trip.start_date) && (
                  <div className="truncate text-content-faint" style={fs(11.5)}>
                    {[trip.destination, trip.start_date].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleAdd(trip.id)}
                disabled={adding === trip.id}
                className="inline-flex flex-none items-center rounded-[8px] bg-accent px-2.5 py-1.5 font-semibold text-accent-text hover:opacity-90 disabled:cursor-default disabled:opacity-50"
                style={fs(11.5, 'body')}
              >
                {adding === trip.id ? '...' : t('journey.trips.link')}
              </button>
            </div>
          ))}
        </div>
      )}
    </DialogShell>
  )
}
