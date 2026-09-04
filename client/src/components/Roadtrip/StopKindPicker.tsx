import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MapPin } from 'lucide-react'
import { useTranslation } from '../../i18n/TranslationContext'
import { Tooltip } from '../shared/Tooltip'
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
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  // Measured after paint, before the browser shows it: reading the size first and then
  // placing it is what stops the panel appearing at 0,0 for one frame.
  useLayoutEffect(() => {
    if (!anchor || !ref.current) return
    const a = anchor.getBoundingClientRect()
    const p = ref.current.getBoundingClientRect()
    const gap = 8
    let top = a.bottom + gap
    // Flips above when there is no room below, which is most of the rail on a short
    // window: a panel clipped by the viewport is one that cannot be used at all.
    if (top + p.height > window.innerHeight - 8) top = Math.max(8, a.top - p.height - gap)
    // Centred on the column, not on the number. The number sits hard against the left
    // edge of the rail, so a panel centred on it hangs half off the sidebar and points at
    // the map. Vertically it still follows the row it belongs to.
    const column = anchor.closest('section')?.getBoundingClientRect() ?? a
    const left = Math.min(
      Math.max(8, column.left + column.width / 2 - p.width / 2),
      window.innerWidth - p.width - 8,
    )
    setPos({ top, left })
  }, [anchor])

  useEffect(() => {
    if (!anchor) return
    const onDown = (e: MouseEvent) => {
      if (ref.current?.contains(e.target as Node)) return
      if (anchor.contains(e.target as Node)) return
      onClose()
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    // Any scroll moves the anchor out from under the panel, and following it would mean
    // measuring on every frame for a menu that is open for two seconds.
    window.addEventListener('scroll', onClose, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onClose, true)
    }
  }, [anchor, onClose])

  if (!anchor) return null

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-label={t('roadtrip.stop.kind')}
      className="fixed z-[70] rounded-2xl border border-edge bg-surface-card p-2 shadow-xl"
      style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, visibility: pos ? 'visible' : 'hidden' }}
    >
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
                style={{ background: color, color: '#fff', ...(on ? { boxShadow: `0 0 0 2px ${color}` } : {}) }}
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
    </div>,
    document.body,
  )
}
