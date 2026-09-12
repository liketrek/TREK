import React, { useState } from 'react'
import { ParkingSquare, Hourglass, AlertTriangle, BedDouble } from 'lucide-react'
import Modal from '../shared/Modal'
import CustomSelect from '../shared/CustomSelect'
import CustomTimePicker from '../shared/CustomTimePicker'
import StayPortals from './StayPortals'
import { useTranslation } from '../../i18n/TranslationContext'
import { safeExternalHref } from '../../utils/safeUrl'
import { formatDate } from '../../utils/formatters'
import { formatDurationShort } from './roadtripModel'
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
  editing?: { placeId: number; dwellMinutes: number; stopType: RoadtripStopType | null; accommodationId?: number; checkIn?: string; checkOut?: string }
  arrivalTime?: string | null
  poi: CorridorPoi
  dayId: number
  /** Where in the day's chain it goes, worked out from how far along the drive it sits. */
  position: number
  dayNumber: number
  /**
   * Set only for a hit somebody could sleep at, and it is what turns the popup into two
   * modes rather than one. Absent, the dialog asks the two questions it always asked.
   */
  overnight?: {
    /** The trip's days from this one on, in travel order — the check-out options. */
    days: { id: number; number: number; date: string | null }[]
    /** The day after this one, or this one when it is the last. */
    defaultEndDayId: number
  }
}

interface RoadtripStopPopupProps {
  draft: RoadtripStopDraft | null
  /** Names of stops already on this trip that came from the same OSM object. */
  duplicateName?: string | null
  onClose: () => void
  onSave: (input: { stopType: RoadtripStopType | null; dwellMinutes: number }) => Promise<void> | void
  /**
   * Books the hit as a night instead of a pause: the place, its day, and a row in
   * day_accommodations, in one go. Only ever called when the draft carries `overnight`.
   */
  onSaveNight?: (input: { endDayId: number; checkIn: string; checkOut: string }) => Promise<void> | void
  /** Hands over what has been picked here, so the full form opens on the same answer. */
  onMoreDetails: (stop: { stopType: RoadtripStopType | null; dwellMinutes: number }) => void
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
  draft, duplicateName, onClose, onSave, onSaveNight, onMoreDetails,
}: RoadtripStopPopupProps): React.ReactElement | null {
  const { t, language } = useTranslation()
  // Through the same guard every other external link in the app goes through.
  // This value is an unvalidated OpenStreetMap tag, and OSM `website` tags are
  // routinely written without a scheme — `www.hotel.de` as a raw href is a
  // RELATIVE url, so the click navigated the planner to
  // /trips/<id>/www.hotel.de instead of leaving the app. The helper adds the
  // scheme for a bare host and drops anything that is not http(s).
  const websiteHref = safeExternalHref(draft?.poi.website)
  const suggested = STOP_KINDS.find(k => k.key === draft?.poi.category)
  const [stopType, setStopType] = useState<RoadtripStopType | null>(draft?.editing ? draft.editing.stopType : suggested?.key ?? null)
  const [dwell, setDwell] = useState<number>(draft?.editing?.dwellMinutes ?? suggested?.defaultMinutes ?? 30)
  // A hotel is a night by default and a campsite a pause, which is what each already
  // means everywhere else — but both offer the other, because a campsite is somewhere
  // people sleep and a hotel is somewhere people stop for lunch.
  const [night, setNight] = useState<boolean>(draft?.editing ? !!draft.editing.accommodationId : draft?.poi.category === 'hotel')
  const [endDayId, setEndDayId] = useState<number | null>(draft?.overnight?.defaultEndDayId ?? null)
  const [checkIn, setCheckIn] = useState(draft?.editing?.checkIn || draft?.arrivalTime || '')
  const [checkOut, setCheckOut] = useState(draft?.editing?.checkOut ?? '')
  const [saving, setSaving] = useState(false)

  if (!draft) return null
  const overnight = draft.overnight
  const asNight = !!overnight && !!onSaveNight && night

  const kind = STOP_KINDS.find(k => k.key === stopType)

  const submit = async (): Promise<void> => {
    setSaving(true)
    try {
      if (asNight) {
        await onSaveNight?.({
          endDayId: endDayId ?? overnight!.defaultEndDayId,
          checkIn,
          checkOut,
        })
      } else {
        await onSave({ stopType, dwellMinutes: dwell })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={t(draft.editing ? 'common.edit' : 'roadtrip.stop.addTitle')} size={overnight ? 'xl' : 'sm'}>
      <div className="flex flex-col gap-4">
        <div className={overnight ? "grid grid-cols-1 gap-5 sm:grid-cols-2" : ""}>
        <div className="flex min-w-0 flex-col gap-4">
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

        {/* Only where sleeping is on the table. A petrol station gets no choice, because
            there is nothing to choose between. */}
        {overnight && onSaveNight ? (
          <div className="flex rounded-lg border border-edge p-0.5">
            {[
              { on: false, label: t('roadtrip.stay.mode.pause'), Icon: Hourglass },
              { on: true, label: t('roadtrip.stay.mode.night'), Icon: BedDouble },
            ].map(({ on, label, Icon }) => (
              <button
                key={label}
                type="button"
                aria-pressed={night === on}
                onClick={() => setNight(on)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-caption transition-colors ${
                  night === on
                    ? 'bg-accent font-semibold text-accent-text'
                    : 'text-content-secondary hover:bg-surface-hover'
                }`}
              >
                <Icon size={13} aria-hidden />
                {label}
              </button>
            ))}
          </div>
        ) : null}

        {asNight ? (
          <div className="flex flex-col gap-3">
            <div>
              <span className="text-caption font-medium uppercase tracking-wide text-content-faint">
                {t('roadtrip.stay.checkOutDay')}
              </span>
              <div className="mt-1.5">
                <CustomSelect
                  value={String(endDayId ?? overnight!.defaultEndDayId)}
                  onChange={value => setEndDayId(Number(value))}
                  options={overnight!.days.map(d => ({
                    value: String(d.id),
                    // Through the shared helper, like every other day date in
                    // this feature. Interpolating the column gave this one
                    // dropdown a bare ISO date while the rail beside it showed
                    // the same day in the reader's own order.
                    label: d.date
                      ? `${t('roadtrip.stay.dayNumber', { number: d.number })} · ${formatDate(d.date, language)}`
                      : t('roadtrip.stay.dayNumber', { number: d.number }),
                  }))}
                  size="sm"
                />
              </div>
            </div>
            {/* Both optional: leaving them empty is normal, and the server stores null.
                A hotel found on a map has no idea when its reception opens. */}
            <div className="flex gap-3">
              <label className="min-w-0 flex-1">
                <span className="text-caption font-medium uppercase tracking-wide text-content-faint">
                  {t('day.checkIn')}
                </span>
                <CustomTimePicker value={checkIn} onChange={setCheckIn} aria-label={t('day.checkIn')} placeholder="" style={{ marginTop: 6, width: '100%' }} />
              </label>
              <label className="min-w-0 flex-1">
                <span className="text-caption font-medium uppercase tracking-wide text-content-faint">
                  {t('day.checkOut')}
                </span>
                <CustomTimePicker value={checkOut} onChange={setCheckOut} aria-label={t('day.checkOut')} placeholder="" style={{ marginTop: 6, width: '100%' }} />
              </label>
            </div>
            {websiteHref || draft.poi.phone ? (
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-caption">
                {websiteHref ? (
                  <a
                    href={websiteHref}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-accent hover:underline"
                  >
                    {t('places.formWebsite')}
                  </a>
                ) : null}
                {draft.poi.phone ? (
                  <a href={`tel:${draft.poi.phone}`} className="text-accent hover:underline">
                    {draft.poi.phone}
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
        <>
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
                    setStopType(key)
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
        </>
        )}

        </div>
        {overnight ? <StayPortals lat={draft.poi.lat} lng={draft.poi.lng} name={draft.poi.name} camping={draft.poi.category === 'campsite'}
          arrival={overnight.days.find(day => day.id === draft.dayId)?.date}
          departure={overnight.days.find(day => day.id === (endDayId ?? overnight.defaultEndDayId))?.date} /> : null}
        </div>

        <div className="flex items-center gap-2 border-t border-edge-faint pt-3">
          <button
            type="button"
            onClick={() => onMoreDetails({ stopType, dwellMinutes: dwell })}
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
            {t(draft.editing ? 'common.save' : 'roadtrip.poi.add')}
          </button>
        </div>
      </div>
    </Modal>
  )
}
