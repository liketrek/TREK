import React, { useState } from 'react'
import { Fuel, Zap, ParkingSquare, Tent, Utensils, Camera, Hourglass, AlertTriangle, type LucideIcon } from 'lucide-react'
import Modal from '../shared/Modal'
import { useTranslation } from '../../i18n/TranslationContext'
import { formatDurationShort, SERVICE_COLORS } from './roadtripModel'
import { STOP_KINDS, STOP_KIND_BY_KEY } from './stopKinds'
import type { CorridorPoi } from './useCorridorPois'
import type { RoadtripStopType } from '@trek/shared'

/**
 * The four kinds of stop, with the icon and colour they already carry in the corridor
 * search, and how long each one usually takes.
 *
 * Deliberately not TREK's place categories: those are the traveller's own editable list,
 * shared across the whole instance. Refuelling is not a taste, it is a fact about the
 * place, so it lives in `places.stop_type` and keeps the palette the search gave it.
 *
 * The colours are the road-trip palette from `poiCategories.ts` and are the same in both
 * themes on purpose — a brand-neutral fuel blue reads as fuel either way.
 */
// The kinds, their icons, their colours and how long each one usually takes all come
// from the one table in stopKinds.ts.

/** How long to stand still, offered as the few answers anyone actually gives. */
const DWELL_CHOICES = [5, 10, 20, 30, 45, 60]

export interface RoadtripStopDraft {
  poi: CorridorPoi
  dayId: number
  /** Where in the day's chain it goes, worked out from how far along the drive it sits. */
  position: number
  dayNumber: number
}

interface RoadtripStopPopupProps {
  draft: RoadtripStopDraft | null
  /** Names of stops already on this trip that came from the same OSM object. */
  duplicateName?: string | null
  onClose: () => void
  onSave: (input: { stopType: RoadtripStopType | null; dwellMinutes: number }) => Promise<void> | void
  /** Opens the full place form instead, carrying what has been filled in so far. */
  onMoreDetails: () => void
}

/**
 * Adding something found along the drive, without the full place form.
 *
 * The form is right for a place you are planning a day around; it is wrong for a petrol
 * station. Everything it asks for — category, price, photo, notes, files — is empty for a
 * refuelling stop, and in road trip mode it also drops the place into the unplanned pool,
 * which neither column shows. This asks the two questions that matter (what kind of stop,
 * how long) and says where it will land, with a way out to the full form for the rest.
 */
export default function RoadtripStopPopup({
  draft, duplicateName, onClose, onSave, onMoreDetails,
}: RoadtripStopPopupProps): React.ReactElement | null {
  const { t } = useTranslation()
  const suggested = STOP_KINDS.find(k => k.key === draft?.poi.category)
  const [stopType, setStopType] = useState<RoadtripStopType | null>(suggested?.key ?? null)
  const [dwell, setDwell] = useState<number>(suggested?.defaultMinutes ?? 30)
  const [saving, setSaving] = useState(false)

  if (!draft) return null

  const kind = STOP_KINDS.find(k => k.key === stopType)

  const submit = async (): Promise<void> => {
    setSaving(true)
    try {
      await onSave({ stopType, dwellMinutes: dwell })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={t('roadtrip.stop.addTitle')} size="sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
            // theme-lint-disable — the road-trip palette, the same one the map pin and the
            // result row use; a token here would make the three disagree.
            style={{ background: `${kind?.color ?? '#64748B'}1f`, color: kind?.color ?? '#64748B' }}
          >
            {kind ? <kind.Icon size={17} aria-hidden /> : <ParkingSquare size={17} aria-hidden />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="break-words text-body font-semibold text-content">{draft.poi.name}</p>
            <p className="mt-0.5 text-caption text-content-muted">
              {t('roadtrip.stop.landsOn', { day: draft.dayNumber, position: draft.position + 1 })}
            </p>
          </div>
        </div>

        {duplicateName ? (
          // The full place form warns about duplicates; losing that warning would make
          // this the easiest way to add the same petrol station twice.
          <p className="flex items-start gap-1.5 rounded-lg bg-warning-soft px-2.5 py-2 text-caption text-warning">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden />
            {t('roadtrip.stop.duplicate', { name: duplicateName })}
          </p>
        ) : null}

        <div>
          <span className="text-caption font-medium uppercase tracking-wide text-content-faint">
            {t('roadtrip.stop.kind')}
          </span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {STOP_KINDS.map(({ key, labelKey, Icon }) => {
              const on = stopType === key
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setStopType(on ? null : key)
                    // Picking a kind is also picking how long it takes, until the user
                    // says otherwise — a charge is not a fuel stop.
                    if (!on) setDwell(STOP_KIND_BY_KEY[key].defaultMinutes)
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-caption transition-colors ${
                    on
                      ? 'border-transparent bg-accent font-semibold text-accent-text'
                      : 'border-edge text-content-secondary hover:border-content-faint hover:text-content'
                  }`}
                >
                  <Icon size={12} aria-hidden />
                  {t(labelKey)}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <span className="text-caption font-medium uppercase tracking-wide text-content-faint">
            {t('roadtrip.stop.stay')}
          </span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {DWELL_CHOICES.map(minutes => (
              <button
                key={minutes}
                type="button"
                aria-pressed={dwell === minutes}
                onClick={() => setDwell(minutes)}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-caption tabular-nums transition-colors ${
                  dwell === minutes
                    ? 'border-transparent bg-accent font-semibold text-accent-text'
                    : 'border-edge text-content-secondary hover:border-content-faint hover:text-content'
                }`}
              >
                <Hourglass size={11} aria-hidden />
                {formatDurationShort(minutes * 60)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-edge-faint pt-3">
          <button
            type="button"
            onClick={onMoreDetails}
            className="rounded-lg px-2.5 py-1.5 text-caption text-content-muted transition-colors hover:bg-surface-hover hover:text-content"
          >
            {t('roadtrip.stop.moreDetails')}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="ms-auto rounded-lg bg-accent px-3.5 py-1.5 text-body font-semibold text-accent-text transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {t('roadtrip.poi.add')}
          </button>
        </div>
      </div>
    </Modal>
  )
}
