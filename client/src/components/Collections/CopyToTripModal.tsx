import React, { useEffect, useMemo, useState } from 'react'
import { Search, MapPin, Loader2, Copy, CalendarDays } from 'lucide-react'
import Modal from '../shared/Modal'
import { useToast } from '../shared/Toast'
import { tripsApi } from '../../api/client'
import { getApiErrorMessage } from '../../utils/apiError'
import { formatDate } from '../../utils/formatters'
import { useTranslation } from '../../i18n'
import type { TranslationFn } from '../../types'

interface TripOption {
  id: number
  title: string
  start_date?: string | null
  end_date?: string | null
  cover_image?: string | null
}

interface CopyToTripModalProps {
  isOpen: boolean
  onClose: () => void
  /** The collection place ids to copy. */
  placeIds: number[]
  /** Delegates to collectionStore.copyToTrip; returns the server reconcile result. */
  onCopy: (tripId: number) => Promise<{ copied: number; skipped: { id: number; name: string }[] }>
  t: TranslationFn
}

/**
 * Trip picker for "Copy to trip" — lists the user's trips (searchable), copies
 * the selected collection places into the chosen trip and reconciles the server
 * dedup result into a copied / skipped-duplicates toast. Works for a single
 * place (detail panel) and bulk select-mode ("Copy N to trip").
 */
export default function CopyToTripModal({ isOpen, onClose, placeIds, onCopy, t }: CopyToTripModalProps): React.ReactElement | null {
  const toast = useToast()
  const { language } = useTranslation()
  const [trips, setTrips] = useState<TripOption[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [busyTripId, setBusyTripId] = useState<number | null>(null)

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    setLoading(true)
    setSearch('')
    tripsApi.list()
      .then((res: { trips?: TripOption[] }) => { if (!cancelled) setTrips(res.trips ?? []) })
      .catch(() => { if (!cancelled) setTrips([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [isOpen])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return trips
    return trips.filter(tr => (tr.title ?? '').toLowerCase().includes(q))
  }, [trips, search])

  const dateRange = (tr: TripOption): string => {
    const s = formatDate(tr.start_date, language)
    const e = formatDate(tr.end_date, language)
    if (s && e) return `${s} – ${e}`
    return s || e || ''
  }

  if (!isOpen) return null

  const handleCopy = async (tripId: number) => {
    if (busyTripId != null || placeIds.length === 0) return
    setBusyTripId(tripId)
    try {
      const res = await onCopy(tripId)
      if (res.copied > 0) {
        toast.success(t('collections.copiedCount', { count: res.copied }))
      }
      if (res.skipped.length > 0) {
        toast.info(t('collections.skippedDuplicates', { count: res.skipped.length }))
      }
      if (res.copied === 0 && res.skipped.length === 0) {
        toast.info(t('collections.copyNothing'))
      }
      onClose()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    } finally {
      setBusyTripId(null)
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={placeIds.length > 1 ? t('collections.copyN', { count: placeIds.length }) : t('collections.copyToTripTitle')}
      size="sm"
    >
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-content-faint" />
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('collections.copyToTripSearch')}
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-edge bg-surface-input text-content text-[13px] outline-none focus:border-accent"
          />
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-10 text-content-faint">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-[13px] text-content-faint py-10">{t('collections.noTrips')}</p>
        ) : (
          <div className="flex flex-col gap-1 max-h-[50vh] overflow-y-auto -mx-1 px-1">
            {filtered.map(trip => {
              const busy = busyTripId === trip.id
              return (
                <button
                  key={trip.id}
                  type="button"
                  onClick={() => handleCopy(trip.id)}
                  disabled={busy}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-edge bg-surface-card text-left hover:bg-surface-hover transition-colors disabled:opacity-60"
                >
                  <span className="w-9 h-9 rounded-lg bg-surface-secondary flex items-center justify-center shrink-0 overflow-hidden text-content-faint">
                    {trip.cover_image ? <img src={trip.cover_image} alt="" className="w-full h-full object-cover" /> : <MapPin size={15} />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-medium text-content truncate">{trip.title}</span>
                    {dateRange(trip) && (
                      <span className="flex items-center gap-1 text-[11.5px] text-content-faint truncate">
                        <CalendarDays size={11} className="shrink-0" /> {dateRange(trip)}
                      </span>
                    )}
                  </span>
                  {busy ? <Loader2 size={15} className="animate-spin text-content-faint shrink-0" /> : <Copy size={15} className="text-content-faint shrink-0" />}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </Modal>
  )
}
