import { useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import MSheet from '../../../components/MSheet'
import type { MTripSheetsProps } from '../MTripShell'
import { useTranslation } from '../../../../i18n'
import { STOP_KINDS } from '../../../../components/Roadtrip/stopKinds'
import { FormSheetHeader } from '../sheets/PlSheetChrome'
import type { RoadtripStopType } from '@trek/shared'

/** What the chain hands over when a stop's disc is tapped. */
interface RtKindSheetPayload {
  placeId?: number
  /** What the stop is now: a service kind, or null for a destination. */
  stopType?: string | null
  name?: string
}

/**
 * Turning a place on the drive into a pause, and back, on the phone ('rtkind', payload
 * { placeId, stopType, name }).
 *
 * Opened from the stop's own disc in the chain, which is where the desktop opens it from
 * and for the same reason: the disc is exactly what changes. A destination wears its
 * running number, a service stop wears its kind's icon in that kind's colour, so the
 * control is its own preview. Tap the 3, pick the pump, and the 3 becomes an orange disc
 * while everything below it renumbers.
 *
 * A sheet rather than the desktop's popover under the disc: a popover is aimed at an
 * anchor with a mouse, and the same palette on a phone would land under the thumb that
 * opened it. The kinds stay a palette of discs rather than a list of words, as they are
 * on the desktop. At this size the colour and the shape are the label, and seven rows of
 * text for seven icons would be a menu where a palette does. Each disc still carries its
 * name for a screen reader.
 *
 * It writes through `planner.setRoadtripStopKind`, the very call the desktop rail makes:
 * one field on one place, with the chain redrawing off the store as soon as it lands.
 */
export default function MRtKindSheet({ planner, shell }: MTripSheetsProps) {
  const { t } = useTranslation()
  const open = shell.sheet?.id === 'rtkind'
  const payload = (shell.sheet?.payload ?? {}) as RtKindSheetPayload
  const canEdit = planner.can('place_edit', planner.trip)

  // Hold the last payload so the name and the current kind survive the exit animation
  // instead of blinking out while the sheet slides away.
  const heldRef = useRef<RtKindSheetPayload | null>(null)
  if (open && typeof payload.placeId === 'number') heldRef.current = payload
  const stop = open && typeof payload.placeId === 'number' ? payload : heldRef.current

  const [saving, setSaving] = useState(false)
  const current = stop?.stopType ?? null

  /**
   * Writes the kind and closes.
   *
   * Closing rather than reopening the stop sheet: the answer to "what kind is this" is
   * the disc in the chain, which is already on screen behind this sheet and redraws the
   * moment the store lands. `setRoadtripStopKind` reports its own failures and resolves
   * either way, so what the guard buys is a sheet that does not sit open pretending to
   * save.
   */
  const pick = async (kind: RoadtripStopType | null) => {
    const placeId = stop?.placeId
    if (!canEdit || saving || placeId == null) return
    setSaving(true)
    try {
      await planner.setRoadtripStopKind(placeId, kind)
      shell.closeSheet()
    } catch {
      // Swallowed rather than toasted again: `setRoadtripStopKind` catches its own
      // failures and shows the message itself, so a second one here would be the same
      // news twice. What this catch is for is the sheet, which stays open on a write that
      // never landed instead of closing as if it had.
    } finally {
      setSaving(false)
    }
  }

  return (
    <MSheet
      open={open && !!stop}
      onClose={shell.closeSheet}
      variant="bottom"
      material="opaque"
      ariaLabel={t('roadtrip.stop.kind')}
    >
      {stop && (
        <>
          <FormSheetHeader
            title={t('roadtrip.stop.kind')}
            onClose={shell.closeSheet}
            closeLabel={t('common.close')}
          />

          <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-1">
            {stop.name && (
              <div className="truncate text-[0.875rem] font-semibold text-m-ink">{stop.name}</div>
            )}

            {/* Wrapped rather than scrolled sideways: seven discs do not fit one phone row,
                and a row that scrolls hides the kinds past its edge behind a gesture. */}
            <div className="mt-[18px] flex flex-wrap justify-center gap-[10px]">
              {STOP_KINDS.map(({ key, labelKey, Icon, color }) => {
                const on = current === key
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={on}
                    aria-label={t(labelKey)}
                    disabled={!canEdit || saving}
                    // Tapping the kind a stop already is takes it back to a destination,
                    // the same second tap the desktop palette answers to.
                    onClick={() => { void pick(on ? null : key) }}
                    className="grid h-[54px] w-[54px] place-items-center rounded-[18px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] disabled:opacity-35"
                  >
                    <span
                      className="grid h-[34px] w-[34px] place-items-center rounded-full text-white"
                      // theme-lint-disable: the road-signage palette from roadtripModel, the
                      // same one the chain disc and the map marker use, so the choice looks
                      // like what it will become.
                      style={{ background: color, ...(on ? { boxShadow: `0 0 0 3px color-mix(in srgb, ${color} 45%, transparent)` } : {}) }}
                    >
                      <Icon size={17} strokeWidth={2.1} aria-hidden="true" />
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Only once there is something to undo. On a destination it would be a button
                saying "leave everything as it is". */}
            {current && (
              <button
                type="button"
                disabled={!canEdit || saving}
                onClick={() => { void pick(null) }}
                className="mt-[18px] flex w-full items-center justify-center gap-2 rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 py-3 text-[0.8125rem] font-semibold text-m-ink disabled:opacity-35"
              >
                <MapPin size={15} strokeWidth={2.2} className="flex-none text-m-muted" aria-hidden="true" />
                {t('roadtrip.stop.backToDestination')}
              </button>
            )}
          </div>
        </>
      )}
    </MSheet>
  )
}
