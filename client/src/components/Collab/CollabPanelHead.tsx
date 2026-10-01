import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { NEUTRAL_TINT, fs } from '../shared/DialogShell'

/** A panel's add action: a soft card pill on the head band. */
export const HEAD_ACTION = 'inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-surface-card px-2.5 py-1 font-semibold text-content-muted shadow-sm hover:text-content'

/**
 * The head band every Collab panel opens with, the same one the cards of the
 * other trip tabs carry: its icon and name in small capitals, how many there
 * are, and its actions on the right.
 */
export default function CollabPanelHead({ icon: Icon, title, count, actions }: {
  icon: LucideIcon
  title: string
  count?: number
  actions?: ReactNode
}) {
  return (
    <div className="flex min-h-[50px] flex-none items-center gap-2 border-b border-edge-faint px-4 py-2" style={{ background: NEUTRAL_TINT }}>
      <Icon size={14} strokeWidth={2} className="flex-none text-content-faint" />
      <h3 className="m-0 font-geist font-bold uppercase tracking-[.08em] text-content-faint" style={fs(11)}>{title}</h3>
      {count != null && count > 0 && (
        <span className="rounded-full bg-surface-card px-2 py-[2px] font-geist font-bold text-content-muted" style={fs(10)}>{count}</span>
      )}
      {actions && <div className="ml-auto flex items-center gap-1.5" style={fs(11.5)}>{actions}</div>}
    </div>
  )
}
