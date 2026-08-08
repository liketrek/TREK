import { ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, Lock } from 'lucide-react'
import { useTranslation } from '../../../i18n'
import { useMobileNavEditor, type MobileNavValue, type NavZone } from '../../../components/Settings/useMobileNavEditor'
import { MOBILE_NAV_MAX_BAR, type NavItemDef } from '../../../components/Layout/navItems'
import MobileNavPreview from '../../../components/Settings/MobileNavPreview'

/**
 * Mobile customizer for the bottom navbar. Same model as the desktop version but
 * reorder + zone changes are button-driven (native drag never fires on touch,
 * #1432) and styled with the mobile `m-*` tokens. Dashboard stays pinned first.
 */
export default function MMobileNavCustomizer({
  value,
  onChange,
}: {
  value: MobileNavValue
  onChange: (next: MobileNavValue) => void
}) {
  const { t } = useTranslation()
  const ed = useMobileNavEditor(value, onChange)

  const roundBtn = 'flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full bg-[color:var(--m-ic)] text-m-ink disabled:opacity-35'

  const iconTile = (item: NavItemDef) => {
    const Icon = item.icon
    return (
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[color:var(--m-ic)] text-m-ink">
        <Icon size={18} strokeWidth={1.9} />
      </span>
    )
  }

  // Inline render helper (not a nested component) so rows re-render in place.
  const renderRow = (item: NavItemDef, index: number, zone: NavZone, count: number) => (
    <div key={item.id} className="flex items-center gap-[10px] rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] px-3 py-[9px]">
      {iconTile(item)}
      <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-bold text-m-ink">{item.label}</span>

      <button
        type="button"
        onClick={() => (zone === 'bar' ? ed.toMore(item.id) : ed.toBar(item.id))}
        disabled={zone === 'more' && ed.barFull}
        aria-label={zone === 'bar' ? t('settings.appearance.mobileNav.toMore') : t('settings.appearance.mobileNav.toBar')}
        className={roundBtn}
      >
        {zone === 'bar' ? <ChevronsDown size={16} strokeWidth={2.2} /> : <ChevronsUp size={16} strokeWidth={2.2} />}
      </button>
      <button
        type="button"
        onClick={() => ed.move(zone, index, index - 1)}
        disabled={index === 0}
        aria-label={t('dayplan.moveUp')}
        className={roundBtn}
      >
        <ChevronUp size={16} strokeWidth={2.2} />
      </button>
      <button
        type="button"
        onClick={() => ed.move(zone, index, index + 1)}
        disabled={index === count - 1}
        aria-label={t('dayplan.moveDown')}
        className={roundBtn}
      >
        <ChevronDown size={16} strokeWidth={2.2} />
      </button>
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      <div>
        <MobileNavPreview bar={ed.previewBar} hasMore={ed.hasMore} moreLabel={t('mobileNav.more')} />
        <p className="mt-2 font-geist text-[0.625rem] leading-relaxed text-m-muted">{t('settings.appearance.mobileNav.hint')}</p>
      </div>

      <div>
        <div className="mb-[6px] flex items-center justify-between">
          <span className="font-geist text-[0.625rem] font-bold uppercase tracking-[.09em] text-m-faint">
            {t('settings.appearance.mobileNav.inBar')}
          </span>
          <span className="font-geist text-[0.625rem] tabular-nums text-m-faint">{ed.barItems.length + 1}/{MOBILE_NAV_MAX_BAR + 1}</span>
        </div>
        <div className="flex flex-col gap-[6px]">
          {ed.dashboard && (
            <div className="flex items-center gap-[10px] rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 py-[9px]">
              {iconTile(ed.dashboard)}
              <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-bold text-m-ink">{ed.dashboard.label}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--m-sheet)] px-2 py-[3px] font-geist text-[0.5625rem] font-bold uppercase tracking-wide text-m-muted">
                <Lock size={10} strokeWidth={2.4} />
                {t('settings.appearance.mobileNav.pinned')}
              </span>
            </div>
          )}
          {ed.barItems.map((item, i) => renderRow(item, i, 'bar', ed.barItems.length))}
        </div>
      </div>

      <div>
        <div className="mb-[6px] font-geist text-[0.625rem] font-bold uppercase tracking-[.09em] text-m-faint">
          {t('settings.appearance.mobileNav.underMore')}
        </div>
        {ed.moreItems.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[color:var(--m-rowbr)] px-3 py-4 text-center font-geist text-[0.625rem] text-m-muted">
            {t('settings.appearance.mobileNav.moreEmpty')}
          </p>
        ) : (
          <div className="flex flex-col gap-[6px]">
            {ed.moreItems.map((item, i) => renderRow(item, i, 'more', ed.moreItems.length))}
          </div>
        )}
      </div>
    </div>
  )
}
