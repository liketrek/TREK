import { ChevronUp, ChevronDown } from 'lucide-react'
import { useTranslation } from '../../../i18n'
import { useAddonStore } from '../../../store/addonStore'
import { resolveMobileDashOrder } from '../dashboard/MDashWidgets'
import type { AppearanceConfig, MobileDashToken } from '@trek/shared'

const LABEL_KEY: Record<Exclude<MobileDashToken, 'trips'>, string> = {
  currency: 'settings.appearance.widget.currency',
  collections: 'settings.appearance.widget.collections',
  timezones: 'settings.appearance.widget.timezones',
  upcomingReservations: 'settings.appearance.widget.upcomingReservations',
}

/**
 * Mobile-only: reorder how the dashboard blocks (the trip list + each inline
 * widget) stack on the phone. The featured trip always stays on top and is not
 * listed here. Blocks whose widget toggle is off show a "hidden" hint — they
 * keep their spot but only appear once switched on in Dashboard widgets.
 */
export default function MMobileDashOrder({ cfg, onChange }: {
  cfg: AppearanceConfig
  onChange: (order: MobileDashToken[]) => void
}) {
  const { t } = useTranslation()
  const isAddonEnabled = useAddonStore((s) => s.isEnabled)
  const order = resolveMobileDashOrder(cfg.dashboard.mobileOrder)
  const m = cfg.dashboard.mobile

  const isOn = (id: MobileDashToken): boolean => {
    if (id === 'trips') return true
    if (id === 'collections') return isAddonEnabled('collections') && m.collections
    if (id === 'currency') return m.currency
    if (id === 'timezones') return m.timezones
    return m.upcomingReservations
  }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length || from === to) return
    const next = [...order]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange(next)
  }

  const roundBtn = 'flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full bg-[color:var(--m-ic)] text-m-ink disabled:opacity-35'

  return (
    <div className="flex flex-col gap-[6px]">
      {order.map((id, i) => (
        <div key={id} className="flex items-center gap-[10px] rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] px-3 py-[10px]">
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate text-[0.8125rem] font-bold text-m-ink">
              {id === 'trips' ? t('settings.appearance.dashOrder.trips') : t(LABEL_KEY[id])}
            </span>
            {!isOn(id) && (
              <span className="flex-none rounded-full bg-[color:var(--m-ic)] px-2 py-[2px] font-geist text-[0.5625rem] font-bold uppercase tracking-wide text-m-faint">
                {t('settings.appearance.dashOrder.hidden')}
              </span>
            )}
          </span>
          <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={t('dayplan.moveUp')} className={roundBtn}>
            <ChevronUp size={16} strokeWidth={2.2} />
          </button>
          <button type="button" onClick={() => move(i, i + 1)} disabled={i === order.length - 1} aria-label={t('dayplan.moveDown')} className={roundBtn}>
            <ChevronDown size={16} strokeWidth={2.2} />
          </button>
        </div>
      ))}
    </div>
  )
}
