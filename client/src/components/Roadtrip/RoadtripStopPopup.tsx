import React, { useEffect, useId, useState } from 'react'
import { ParkingSquare, Hourglass, AlertTriangle, BedDouble } from 'lucide-react'
import { DialogButton, DialogFooter, DialogHeader, DialogSection, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { PANEL, Segmented } from '../shared/dialogParts'
import CustomTimePicker from '../shared/CustomTimePicker'
import StayPortals from './StayPortals'
import ChargingInfo from './ChargingInfo'
import { useTranslation } from '../../i18n/TranslationContext'
import { safeExternalHref } from '../../utils/safeUrl'
import { StopKindChips, StopStayChips } from './StopChips'
import type { CorridorPoi } from './useCorridorPois'
import { useStopDraftForm } from './useStopDraftForm'
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
const nightByDefault = (draft: RoadtripStopDraft | null): boolean =>
  draft?.editing ? !!draft.editing.accommodationId : draft?.poi.category === 'hotel'

const checkInByDefault = (draft: RoadtripStopDraft | null): string =>
  draft?.editing?.checkIn || draft?.arrivalTime || ''

export default function RoadtripStopPopup({
  draft, duplicateName, onClose, onSave, onSaveNight, onMoreDetails,
}: RoadtripStopPopupProps): React.ReactElement | null {
  const { t } = useTranslation()
  // Through the same guard every other external link in the app goes through.
  // This value is an unvalidated OpenStreetMap tag, and OSM `website` tags are
  // routinely written without a scheme — `www.hotel.de` as a raw href is a
  // RELATIVE url, so the click navigated the planner to
  // /trips/<id>/www.hotel.de instead of leaving the app. The helper adds the
  // scheme for a bare host and drops anything that is not http(s).
  const websiteHref = safeExternalHref(draft?.poi.website)
  const { stopType, dwell, setDwell, saving, setSaving, kind, pickKind, seed } = useStopDraftForm(draft)
  // A hotel is a night by default and a campsite a pause, which is what each already
  // means everywhere else — but both offer the other, because a campsite is somewhere
  // people sleep and a hotel is somewhere people stop for lunch.
  const [night, setNight] = useState<boolean>(() => nightByDefault(draft))
  const [checkIn, setCheckIn] = useState(() => checkInByDefault(draft))
  const labelId = useId()

  // The popup stays mounted while the draft is swapped for another one, so every
  // answer is seeded again from the new draft, the way the phone sheet does it.
  useEffect(() => {
    seed(draft)
    setNight(nightByDefault(draft))
    setCheckIn(checkInByDefault(draft))
  }, [draft, seed])

  if (!draft) return null
  const overnight = draft.overnight
  const asNight = !!overnight && !!onSaveNight && night

  const submit = async (): Promise<void> => {
    setSaving(true)
    try {
      if (asNight) {
        await onSaveNight?.({
          // The night runs to the day the rail suggests. Choosing another one is a
          // booking decision, and the booking lives under Days.
          endDayId: overnight!.defaultEndDayId,
          checkIn,
          // Passed back exactly as it was loaded. This surface no longer asks for a
          // check-out, and sending a blank would quietly erase one entered under Days.
          checkOut: draft.editing?.checkOut ?? '',
        })
      } else {
        await onSave({ stopType, dwellMinutes: dwell })
      }
    } finally {
      setSaving(false)
    }
  }

  const tone = kind?.color ?? 'var(--text-faint)'
  return (
    <DialogShell
      onClose={onClose}
      labelledBy={labelId}
      width={overnight ? 'editor' : 'detail'}
      header={(
        <DialogHeader
          tile={(
            <DialogTile>
              {/* The road-trip palette, the same one the map pin and the result row use. */}
              <span style={{ color: tone }}>
                {kind ? <kind.Icon size={20} strokeWidth={1.9} aria-hidden /> : <ParkingSquare size={20} strokeWidth={1.9} aria-hidden />}
              </span>
            </DialogTile>
          )}
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={onClose}
          eyebrow={t(draft.editing ? 'common.edit' : 'roadtrip.stop.addTitle')}
          title={draft.poi.name}
          sub={t('roadtrip.stop.landsOn', { day: draft.dayNumber, position: draft.position + 1 })}
          pills={overnight && onSaveNight ? (
            // Only where sleeping is on the table. A petrol station gets no choice,
            // because there is nothing to choose between.
            <Segmented
              value={night ? 'night' : 'pause'}
              label={t('roadtrip.stop.kind')}
              onChange={v => setNight(v === 'night')}
              options={[
                { value: 'pause', label: t('roadtrip.stay.mode.pause'), icon: <Hourglass size={13} aria-hidden /> },
                { value: 'night', label: t('roadtrip.stay.mode.night'), icon: <BedDouble size={13} aria-hidden /> },
              ]}
            />
          ) : undefined}
        />
      )}
      footer={(
        <DialogFooter>
          <DialogButton onClick={() => onMoreDetails({ stopType, dwellMinutes: dwell })}>
            {t('roadtrip.stop.moreDetails')}
          </DialogButton>
          <FooterSpacer />
          <DialogButton onClick={onClose}>{t('common.cancel')}</DialogButton>
          <DialogButton variant="primary" onClick={() => void submit()} disabled={saving}>
            {t(draft.editing ? 'common.save' : 'roadtrip.poi.add')}
          </DialogButton>
        </DialogFooter>
      )}
    >
      {duplicateName ? (
        // The full place form warns about duplicates; losing that warning would make
        // this the easiest way to add the same petrol station twice.
        <p className="m-0 flex items-start gap-1.5 rounded-[12px] bg-warning-soft px-3 py-2.5 text-warning" style={fs(12, 'body')}>
          <AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden />
          {t('roadtrip.stop.duplicate', { name: duplicateName })}
        </p>
      ) : null}

      <div className={overnight ? 'grid grid-cols-1 items-start gap-5 sm:grid-cols-2' : 'flex flex-col gap-5'}>
        <div className="flex min-w-0 flex-col gap-5">
          {asNight ? (
            <>
              {/* Check-in only, and optional at that: it is the hour the drive can stop for
                  the night, the one thing about a booking the chain uses. A check-out is a
                  booking detail and lives under Days with the rest of them. */}
              <DialogSection label={t('day.checkIn')}>
                <CustomTimePicker value={checkIn} onChange={setCheckIn} aria-label={t('day.checkIn')} placeholder="" style={{ width: '100%' }} />
              </DialogSection>
              {websiteHref || draft.poi.phone ? (
                <div className="flex flex-wrap gap-x-3 gap-y-1" style={fs(12, 'body')}>
                  {websiteHref ? (
                    <a href={websiteHref} target="_blank" rel="noreferrer noopener" className="font-medium text-content hover:underline">
                      {t('places.formWebsite')}
                    </a>
                  ) : null}
                  {draft.poi.phone ? (
                    <a href={`tel:${draft.poi.phone}`} className="font-medium text-content hover:underline">{draft.poi.phone}</a>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : (
            <>
              <DialogSection label={t('roadtrip.stop.kind')}>
                <div className={PANEL}>
                  <StopKindChips value={stopType} onPick={pickKind} white className="flex flex-wrap gap-1.5" />
                </div>
              </DialogSection>
              <DialogSection label={t('roadtrip.stop.stay')}>
                <div className={PANEL}>
                  <StopStayChips value={dwell} onPick={setDwell} white className="flex flex-wrap gap-1.5" />
                </div>
              </DialogSection>
              {/* How busy the charging area is and what it charges, while the stop is still
                  being considered. Only for the kind that has an answer: a petrol station
                  or a bakery asks nothing, so picking either costs no request at all. */}
              {stopType === 'charging' ? (
                <DialogSection label={t('roadtrip.charging.availability')}>
                  <ChargingInfo lat={draft.poi.lat} lng={draft.poi.lng} name={draft.poi.name} />
                </DialogSection>
              ) : null}
            </>
          )}
        </div>
        {overnight ? (
          <StayPortals lat={draft.poi.lat} lng={draft.poi.lng} name={draft.poi.name} camping={draft.poi.category === 'campsite'}
            arrival={overnight.days.find(day => day.id === draft.dayId)?.date}
            departure={overnight.days.find(day => day.id === overnight.defaultEndDayId)?.date} />
        ) : null}
      </div>
    </DialogShell>
  )
}
