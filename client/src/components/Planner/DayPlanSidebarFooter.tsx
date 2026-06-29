import { currencyDecimals } from '../../utils/formatters'

interface DayPlanSidebarFooterProps {
  totalCost: number
  currency: string
  t: (key: string, params?: Record<string, any>) => string
}

export function DayPlanSidebarFooter({ totalCost, currency, t }: DayPlanSidebarFooterProps) {
  if (!(totalCost > 0)) return null
  return (
    <div className="border-t border-edge-faint" style={{ flexShrink: 0, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span className="text-content-faint" style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))' }}>{t('dayplan.totalCost')}</span>
      <span className="text-content" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600 }}>{totalCost.toFixed(currencyDecimals(currency))} {currency}</span>
    </div>
  )
}
