import { Wallet } from 'lucide-react'
import { NEUTRAL_TINT, fs } from '../shared/DialogShell'

interface DayPlanSidebarFooterProps {
  totalCostLabel: string | null
  t: (key: string, params?: Record<string, any>) => string
}

/** The trip's total cost at the foot of the day list, on the panel's tinted band. */
export function DayPlanSidebarFooter({ totalCostLabel, t }: DayPlanSidebarFooterProps) {
  if (!totalCostLabel) return null
  return (
    <div className="flex flex-none items-center justify-between gap-3 border-t border-edge-faint px-4 py-2.5" style={{ background: NEUTRAL_TINT }}>
      <span className="font-geist font-bold uppercase tracking-[.08em] text-content-faint" style={fs(9.5)}>{t('dayplan.totalCost')}</span>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-card px-2.5 py-1 font-geist font-bold tabular-nums text-content shadow-sm" style={fs(12, 'body')}>
        <Wallet size={12} strokeWidth={2.2} className="text-content-faint" />
        {totalCostLabel}
      </span>
    </div>
  )
}
