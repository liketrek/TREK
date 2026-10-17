import React, { useId } from 'react'
import { Search, MapPin, Loader2, Copy, CalendarDays } from 'lucide-react'
import { DialogButton, DialogFooter, DialogHeader, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { INPUT } from '../shared/dialogParts'
import type { TranslationFn } from '../../types'
import { useTripCopyPicker } from './useTripCopyPicker'

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
  const labelId = useId()
  const { loading, search, setSearch, filtered, busyTripId, dateRange, handleCopy } =
    useTripCopyPicker({ open: isOpen, onCopy, onClose, t, emptySelection: placeIds.length === 0 })

  if (!isOpen) return null

  return (
    <DialogShell
      onClose={onClose}
      labelledBy={labelId}
      width="narrow"
      // The list shrinks while the search narrows it; a pinned top edge keeps the field still.
      align="top"
      header={(
        <DialogHeader
          tile={<DialogTile><Copy size={20} strokeWidth={1.9} className="text-content-muted" /></DialogTile>}
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={onClose}
          title={t('collections.copyN', { count: placeIds.length })}
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
        <Search size={14} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-content-faint" aria-hidden="true" />
        <input
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('collections.copyToTripSearch')}
          aria-label={t('collections.copyToTripSearch')}
          className={`${INPUT} ps-8`}
        />
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8 text-content-faint">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="m-0 rounded-[12px] bg-surface-secondary px-4 py-6 text-center text-content-faint" style={fs(12.5, 'body')}>{t('collections.noTrips')}</p>
      ) : (
        <div className="flex flex-col gap-0.5 rounded-[14px] border border-edge-faint bg-surface-secondary p-1.5">
          {filtered.map(trip => {
            const busy = busyTripId === trip.id
            const range = dateRange(trip)
            return (
              <button
                key={trip.id}
                type="button"
                onClick={() => handleCopy(trip.id)}
                disabled={busy}
                className="flex min-h-[52px] items-center gap-3 rounded-[10px] px-2.5 py-2 text-start hover:bg-surface-card disabled:opacity-60"
              >
                <span className="grid h-9 w-9 flex-none place-items-center overflow-hidden rounded-[9px] bg-surface-tertiary text-content-faint">
                  {trip.cover_image ? <img src={trip.cover_image} alt="" className="h-full w-full object-cover" /> : <MapPin size={15} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-content" style={fs(13, 'body')}>{trip.title}</span>
                  {range && (
                    <span className="mt-0.5 flex items-center gap-1 truncate text-content-faint" style={fs(11.5)}>
                      <CalendarDays size={11} className="flex-none" /> {range}
                    </span>
                  )}
                </span>
                {busy ? <Loader2 size={15} className="flex-none animate-spin text-content-faint" /> : <Copy size={15} className="flex-none text-content-faint" />}
              </button>
            )
          })}
        </div>
      )}
    </DialogShell>
  )
}
