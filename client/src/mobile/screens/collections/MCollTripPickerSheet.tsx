import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Copy, Loader2, MapPin, Search } from 'lucide-react'
import type { TranslationFn } from '../../../types'
import { tripsApi } from '../../../api/client'
import { useTranslation } from '../../../i18n'
import { useToast } from '../../../components/shared/Toast'
import { getApiErrorMessage } from '../../../utils/apiError'
import { formatDate } from '../../../utils/formatters'
import MSheet from '../../components/MSheet'
import { SheetHeader } from './MCollSheetKit'

interface TripOption {
  id: number
  title: string
  start_date?: string | null
  end_date?: string | null
  cover_image?: string | null
}

interface MCollTripPickerSheetProps {
  open: boolean
  count: number
  onCopy: (tripId: number) => Promise<{ copied: number; skipped: { id: number; name: string }[] }>
  onClose: () => void
  t: TranslationFn
}

/**
 * "Copy to trip" trip picker: searchable trip rows; tapping one copies the
 * selected places and reconciles the dedup result into toasts.
 */
export default function MCollTripPickerSheet({ open, count, onCopy, onClose, t }: MCollTripPickerSheetProps) {
  const toast = useToast()
  const { language } = useTranslation()
  const [trips, setTrips] = useState<TripOption[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [busyTripId, setBusyTripId] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setSearch('')
    tripsApi.list()
      .then((res: { trips?: TripOption[] }) => { if (!cancelled) setTrips(res.trips ?? []) })
      .catch(() => { if (!cancelled) setTrips([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [open])

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

  const handleCopy = async (tripId: number) => {
    if (busyTripId != null) return
    setBusyTripId(tripId)
    try {
      const res = await onCopy(tripId)
      if (res.copied > 0) toast.success(t('collections.copiedCount', { count: res.copied }))
      if (res.skipped.length > 0) toast.info(t('collections.skippedDuplicates', { count: res.skipped.length }))
      if (res.copied === 0 && res.skipped.length === 0) toast.info(t('collections.copyNothing'))
      onClose()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    } finally {
      setBusyTripId(null)
    }
  }

  const title = count > 1 ? t('collections.copyN', { count }) : t('collections.copyToTripTitle')

  return (
    <MSheet open={open} onClose={onClose} material="opaque" ariaLabel={title}>
      <SheetHeader title={title} onClose={onClose} closeLabel={t('common.close')} />
      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[18px] pt-[14px]">
        <div className="mb-2 flex h-9 items-center gap-2 rounded-[12px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] px-[13px]">
          <Search size={15} strokeWidth={2.2} className="flex-none text-m-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('collections.copyToTripSearch')}
            className="min-w-0 flex-1 bg-transparent font-geist text-[0.78125rem] text-m-ink outline-none placeholder:text-m-faint"
          />
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-10 text-m-faint">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center font-geist text-[0.78125rem] text-m-faint">{t('collections.noTrips')}</div>
        ) : (
          filtered.map(trip => {
            const busy = busyTripId === trip.id
            return (
              <button
                key={trip.id}
                type="button"
                onClick={() => handleCopy(trip.id)}
                disabled={busy}
                className="mb-2 flex w-full items-center gap-[11px] rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] px-3 py-[10px] text-left disabled:opacity-60"
              >
                <span className="flex h-9 w-9 flex-none items-center justify-center overflow-hidden rounded-[10px] bg-[color:var(--m-ic)] text-m-faint">
                  {trip.cover_image
                    ? <img src={trip.cover_image} alt="" className="h-full w-full object-cover" />
                    : <MapPin size={15} strokeWidth={2} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.8125rem] font-semibold text-m-ink">{trip.title}</span>
                  {dateRange(trip) && (
                    <span className="mt-[1px] flex items-center gap-1 truncate font-geist text-[0.6875rem] text-m-muted">
                      <CalendarDays size={11} strokeWidth={2} className="flex-none" /> {dateRange(trip)}
                    </span>
                  )}
                </span>
                {busy
                  ? <Loader2 size={15} className="flex-none animate-spin text-m-faint" />
                  : <Copy size={15} strokeWidth={2} className="flex-none text-m-faint" />}
              </button>
            )
          })
        )}
      </div>
    </MSheet>
  )
}
