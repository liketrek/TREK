import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { NEUTRAL_TINT } from './DialogShell'
import { Tooltip } from './Tooltip'

interface DetailShellProps {
  header: ReactNode
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
  closeLabel: string
  leftWidth?: number
  rightWidth?: number
  /** The head band's background; the neutral accent wash when left out. */
  tint?: string
  closeButtonClassName?: string
  testId?: string
}

/**
 * The card a selected item opens over the map, in the place inspector's frame:
 * centred between the planner panels, a tinted head band with the close button,
 * a body that scrolls and a footer that stays in reach.
 */
export default function DetailShell({
  header,
  children,
  footer,
  onClose,
  closeLabel,
  leftWidth = 0,
  rightWidth = 0,
  tint = NEUTRAL_TINT,
  closeButtonClassName = '',
  testId,
}: DetailShellProps) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 20,
        left: `calc(${leftWidth}px + (100% - ${leftWidth}px - ${rightWidth}px) / 2)`,
        transform: 'translateX(-50%)',
        width: `min(800px, calc(100% - ${leftWidth}px - ${rightWidth}px - 32px))`,
        zIndex: 50,
        fontFamily: 'var(--font-system)',
      }}
    >
      <div className="flex max-h-[60vh] flex-col overflow-hidden rounded-[20px] border border-edge-faint bg-surface-elevated text-content shadow-popover backdrop-blur-[40px] backdrop-saturate-[1.8]">
        <header className="flex flex-none items-start gap-3.5 border-b border-edge-faint px-4 pb-3 pt-3.5" style={{ background: tint }}>
          {header}
          <Tooltip label={closeLabel}>
            <button type="button" onClick={onClose} aria-label={closeLabel}
              className={`grid h-8 w-8 flex-none place-items-center rounded-full bg-surface-card text-content-muted shadow-sm transition-colors hover:text-content ${closeButtonClassName}`}>
              <X size={15} strokeWidth={2.2} />
            </button>
          </Tooltip>
        </header>
        <div data-testid={testId} className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto overscroll-contain px-4 py-3.5">
          {children}
        </div>
        {footer && (
          <footer className="flex flex-none flex-wrap items-center gap-2 border-t border-edge-faint px-4 py-2.5">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
