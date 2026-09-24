import React from 'react'
import { MapPin } from 'lucide-react'
import { useTranslation } from '../../i18n/TranslationContext'
import { Tooltip } from '../shared/Tooltip'
import AnchoredPopover from './AnchoredPopover'
import { STOP_KINDS } from './stopKinds'
import type { RoadtripStopType } from '@trek/shared'

/**
 * Turning a place on the drive into a pause, and back.
 *
 * Opened from the stop's own number, because the number is exactly what changes: a
 * service stop has none. That makes the control its own preview — click the 3, pick the
 * pump, and the 3 becomes an orange disc while everything below renumbers itself.
 *
 * The kinds are the discs the rail already draws rather than a list of words. At this
 * size the colour and the shape are the label: a traveller who has seen one petrol stop
 * on the map knows the orange pump before reading anything, and six rows of text for six
 * icons would be a menu where a palette does.
 *
 * Only for stops on a drive. A place with no coordinates never reaches the rail, and a
 * hotel is not offered here at all, because sleeping somewhere is not a pause in the
 * driving — that path goes through the accommodation it books.
 */

const DISC = 'grid place-items-center rounded-full transition-transform'

export default function StopKindPicker({ anchor, current, onPick, onClose }: {
  /** The element the popover hangs under, usually the stop's number. */
  anchor: HTMLElement | null
  current: string | null
  onPick: (kind: RoadtripStopType | null) => void
  onClose: () => void
}): React.ReactElement | null {
  const { t } = useTranslation()

  return (
    <AnchoredPopover anchor={anchor} label={t('roadtrip.stop.kind')} onClose={onClose}>
      <div className="flex gap-1">
        {STOP_KINDS.map(({ key, labelKey, Icon, color }) => {
          const on = current === key
          return (
            <Tooltip key={key} label={t(labelKey)}>
            <button
              type="button"
              aria-pressed={on}
              aria-label={t(labelKey)}
              onClick={() => onPick(on ? null : key)}
              className="group grid h-11 w-11 place-items-center rounded-xl transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span
                className={`${DISC} h-7 w-7 group-hover:scale-110 ${on ? 'ring-2 ring-offset-2 ring-offset-surface-card' : ''}`}
                // theme-lint-disable — the road-signage palette from `roadtripModel`, the
                // same one the rail disc and the map pin use, so the choice looks like
                // what it will become.
                style={{ background: color, color: '#fff', ...(on ? { boxShadow: `0 0 0 2px ${color}` } : {}) }} // theme-lint-disable — road-signage palette
              >
                <Icon size={14} strokeWidth={2.2} aria-hidden />
              </span>
            </button>
            </Tooltip>
          )
        })}
      </div>

      {/* Only once there is something to undo. On an ordinary place it would be a button
          that says "leave everything as it is". */}
      {current ? (
        <button
          type="button"
          onClick={() => onPick(null)}
          className="mt-1 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-caption text-content-secondary transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <MapPin size={14} className="shrink-0 text-content-faint" aria-hidden />
          {t('roadtrip.stop.backToDestination')}
        </button>
      ) : null}
    </AnchoredPopover>
  )
}
