import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, BedDouble, Hourglass, ParkingSquare } from 'lucide-react'
import MSheet from '../../../components/MSheet'
import MChip from '../../../components/MChip'
import { Eyebrow, FormSheetHeader } from '../sheets/PlSheetChrome'
import { STOP_KINDS, STOP_KIND_BY_KEY, isOvernightCategory } from '../../../../components/Roadtrip/stopKinds'
import { formatDurationShort } from '../../../../components/Roadtrip/roadtripModel'
import type { RoadtripStopDraft } from '../../../../components/Roadtrip/RoadtripStopPopup'
import type { TripPlanner } from '../MTripShell'
import type { RoadtripStopType } from '@trek/shared'

export interface MRtDraftSheetProps {
  planner: TripPlanner
}

/**
 * How long to stand still, offered as the few answers anybody actually gives.
 * The same six the desktop popup offers, so a stop added on the phone and one
 * added at the desk are the same stop.
 */
const DWELL_CHOICES = [5, 10, 20, 30, 45, 60]

/**
 * Taking a hit found along the drive onto the trip, on the phone.
 *
 * Driven by `planner.stopDraft` rather than by `shell.sheet`, because the draft
 * is what every entry point produces: the fuel search accepting a station
 * (`acceptRefuel`), a corridor hit dropped on the map, and the chain opening a
 * service stop it already owns all set that one piece of state and nothing
 * else. Without a consumer here the fuel button on the phone visibly did
 * nothing, because the draft was set and no surface read it.
 *
 * The write goes through `planner.saveStopDraft`, the same call the desktop
 * popup makes. It owns the whole sequence a stop needs (the place, the
 * assignment at the worked-out position, the via re-anchoring, the re-route)
 * and reports its own failure with a toast, so there is no second path here for
 * any of it to go wrong in.
 */
export default function MRtDraftSheet({ planner }: MRtDraftSheetProps) {
  const { t, stopDraft, setStopDraft, saveStopDraft, stopDraftDuplicate } = planner

  const [stopType, setStopType] = useState<RoadtripStopType | null>(null)
  const [dwell, setDwell] = useState<number>(30)
  const [saving, setSaving] = useState(false)

  // Hold the last draft so the panel keeps its content through the 280ms exit
  // animation: saving clears the draft immediately, and rendering off the live
  // value alone would blank the sheet mid-slide.
  const heldRef = useRef<RoadtripStopDraft | null>(null)
  if (stopDraft) heldRef.current = stopDraft
  const draft = stopDraft ?? heldRef.current

  // Seeded from what the hit brings with it: a charge is not a fuel stop, and
  // each kind carries how long it usually takes. An edit answers with what the
  // stop already says instead.
  useEffect(() => {
    if (!stopDraft) return
    const suggested = STOP_KINDS.find(k => k.key === stopDraft.poi.category)
    setStopType(stopDraft.editing ? stopDraft.editing.stopType : suggested?.key ?? null)
    setDwell(stopDraft.editing?.dwellMinutes ?? suggested?.defaultMinutes ?? 30)
    setSaving(false)
  }, [stopDraft])

  if (!draft) return null

  const kind = STOP_KINDS.find(k => k.key === stopType)

  /**
   * A place somebody could sleep at is not offered here at all.
   *
   * Booking a night is a second write path (the room, the two days it spans,
   * the check-in) and the phone has no surface for any of it yet. Saving such a
   * hit as an ordinary pause would look like it worked while quietly losing the
   * night, which is worse than saying where it can be done.
   */
  const overnightOnly = draft.overnight != null || isOvernightCategory(draft.poi.category)

  const discard = () => setStopDraft(null)

  const pickKind = (key: RoadtripStopType) => {
    if (stopType === key) return
    setStopType(key)
    // Picking a kind picks its usual length too, until the user says otherwise.
    // Tapping the kind already chosen changes nothing, so a time set by hand
    // survives it.
    setDwell(STOP_KIND_BY_KEY[key]?.defaultMinutes ?? dwell)
  }

  const submit = async (): Promise<void> => {
    if (saving) return
    setSaving(true)
    try {
      await saveStopDraft({ stopType, dwellMinutes: dwell })
    } finally {
      setSaving(false)
    }
  }

  return (
    <MSheet open={stopDraft != null} onClose={discard} variant="bottom" material="opaque" ariaLabel={draft.poi.name}>
      <FormSheetHeader
        icon={kind?.Icon ?? ParkingSquare}
        title={draft.poi.name}
        subtitle={draft.poi.address}
        onClose={discard}
        closeLabel={t('common.close')}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-2">
        <div className="font-geist text-[0.6875rem] tabular-nums text-m-muted">
          {t('roadtrip.stop.landsOn', { day: draft.dayNumber, position: draft.position + 1 })}
        </div>

        {stopDraftDuplicate && (
          // The full place form warns about duplicates; without the same warning
          // here this would be the quickest way to add one petrol station twice.
          <div className="mt-[6px] flex items-start gap-[6px] font-geist text-[0.6875rem] text-[color:var(--m-st-pending)]">
            <AlertTriangle size={12} strokeWidth={2} className="mt-px flex-none" />
            <span>{t('roadtrip.stop.duplicate', { name: stopDraftDuplicate })}</span>
          </div>
        )}

        {overnightOnly ? (
          <div className="mt-3 flex items-start gap-[9px] rounded-[16px] border border-[color:var(--m-inbr)] bg-[color:var(--m-inner)] px-3 py-[11px]">
            <BedDouble size={15} strokeWidth={1.8} className="mt-px flex-none text-m-muted" />
            <p className="font-geist text-[0.71875rem] leading-[1.5] text-m-muted">
              {t('mobileTrip.rtNightDesktopOnly')}
            </p>
          </div>
        ) : (
          <>
            <Eyebrow className="mb-[6px] mt-3">{t('roadtrip.stop.kind')}</Eyebrow>
            <div className="flex flex-wrap gap-[6px]">
              {STOP_KINDS.map(({ key, labelKey, Icon }) => (
                <MChip key={key} active={stopType === key} onClick={() => pickKind(key)}>
                  <Icon size={13} strokeWidth={2} />
                  {t(labelKey)}
                </MChip>
              ))}
            </div>

            <Eyebrow className="mb-[6px] mt-3">{t('roadtrip.stop.stay')}</Eyebrow>
            <div className="flex flex-wrap gap-[6px]">
              {DWELL_CHOICES.map(minutes => (
                <MChip
                  key={minutes}
                  active={dwell === minutes}
                  onClick={() => setDwell(minutes)}
                  className="tabular-nums"
                >
                  <Hourglass size={12} strokeWidth={2} />
                  {formatDurationShort(minutes * 60)}
                </MChip>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-none items-center gap-2 border-t border-[color:var(--m-rowbr)] px-[18px] pb-4 pt-3">
        <button
          type="button"
          onClick={discard}
          className="flex h-11 items-center rounded-full px-3 text-[0.8125rem] font-semibold text-m-muted"
        >
          {t('common.discard')}
        </button>
        {!overnightOnly && (
          <button
            type="button"
            onClick={() => { void submit() }}
            disabled={saving}
            className="ml-auto flex h-11 items-center rounded-full bg-m-act px-[22px] text-[0.8125rem] font-semibold text-m-actfg disabled:opacity-40"
          >
            {t(draft.editing ? 'common.save' : 'roadtrip.poi.add')}
          </button>
        )}
      </div>
    </MSheet>
  )
}
