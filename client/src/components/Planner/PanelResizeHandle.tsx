import type { KeyboardEvent } from 'react'
import { useTranslation } from '../../i18n'

const STEP = 16

interface PanelResizeHandleProps {
  /** The panel this handle sits on: 'left' grows to the right, 'right' to the left. */
  side: 'left' | 'right'
  width: number
  min: number
  max: number
  onStart: () => void
  onNudge: (delta: number) => void
}

/**
 * The grip on a planner panel's inner edge (#1012). A mouse drags it, a finger on
 * a tablet drags it (touch-action: none keeps the page and the map from taking
 * the gesture), and the arrow keys move it, since it is a separator a keyboard
 * can reach. On a touch screen the grip shows; with a mouse it lights on hover.
 */
export default function PanelResizeHandle({ side, width, min, max, onStart, onNudge }: PanelResizeHandleProps) {
  const { t } = useTranslation()
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const grow = side === 'left' ? 'ArrowRight' : 'ArrowLeft'
    const shrink = side === 'left' ? 'ArrowLeft' : 'ArrowRight'
    if (e.key !== grow && e.key !== shrink) return
    e.preventDefault()
    onNudge(e.key === grow ? STEP : -STEP)
  }
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={t('trip.panelWidth')}
      aria-valuenow={Math.round(width)}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      data-resize={side}
      onMouseDown={onStart}
      onTouchStart={onStart}
      onKeyDown={onKeyDown}
      className="group flex justify-center outline-none"
      style={{ position: 'absolute', [side === 'left' ? 'right' : 'left']: 0, top: 0, bottom: 0, width: 10, cursor: 'col-resize', zIndex: 2, touchAction: 'none' }}
    >
      <span aria-hidden className="h-full w-[3px] rounded-full transition-colors group-hover:bg-edge group-focus-visible:bg-accent" />
      <span aria-hidden className="pointer-events-none absolute top-1/2 hidden h-10 w-[5px] -translate-y-1/2 rounded-full bg-content-faint opacity-60 [@media(pointer:coarse)]:block" />
    </div>
  )
}
