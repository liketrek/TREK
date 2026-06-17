import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useTripStore } from '../../store/tripStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useTranslation } from '../../i18n'
import { formatMoney } from '../../utils/formatters'
import { catMeta } from '../Budget/costsCategories'
import type { BudgetItem } from '../../types'

/**
 * The Costs block inside a booking modal. Replaces the old inline price + budget
 * category fields: when no expense is linked yet it offers a "create expense"
 * button (the modal saves the booking first, then opens the full Costs editor);
 * once linked it shows the expense with edit / remove actions.
 */
export function BookingCostsSection({ reservationId, onCreate, onEdit, onRemove }: {
  reservationId: number | null
  onCreate: () => void
  onEdit: (item: BudgetItem) => void
  onRemove: (item: BudgetItem) => void
}) {
  const { t, locale } = useTranslation()
  const budgetItems = useTripStore(s => s.budgetItems)
  const trip = useTripStore(s => s.trip)
  const displayCurrency = useSettingsStore(s => s.settings.default_currency)
  const base = (displayCurrency || trip?.currency || 'EUR').toUpperCase()
  const linked = reservationId ? budgetItems.find(i => i.reservation_id === reservationId) : null

  const labelCls = 'block text-[11px] font-semibold uppercase tracking-[0.08em] text-content-faint mb-[6px]'

  if (linked) {
    const meta = catMeta(linked.category)
    const Icon = meta.Icon
    return (
      <div>
        <label className={labelCls}>{t('reservations.linkedExpense')}</label>
        <div className="bg-surface-secondary border border-edge" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10 }}>
          <span style={{ width: 26, height: 26, borderRadius: 7, display: 'grid', placeItems: 'center', background: meta.color + '22', color: meta.color, flexShrink: 0 }}><Icon size={14} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="text-content" style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{linked.name}</div>
            <div className="text-content-faint" style={{ fontSize: 12 }}>{t(meta.labelKey)}</div>
          </div>
          <span className="text-content" style={{ fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{formatMoney(linked.total_price, linked.currency || base, locale)}</span>
          <button type="button" onClick={() => onEdit(linked)} title={t('common.edit')} className="text-content-muted border border-edge bg-surface-card" style={{ display: 'inline-flex', padding: 7, borderRadius: 8, cursor: 'pointer' }}><Pencil size={13} /></button>
          <button type="button" onClick={() => onRemove(linked)} title={t('reservations.removeExpense')} className="text-content-muted border border-edge bg-surface-card" style={{ display: 'inline-flex', padding: 7, borderRadius: 8, cursor: 'pointer' }}><Trash2 size={13} /></button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <label className={labelCls}>{t('reservations.costsLabel')}</label>
      <button type="button" onClick={onCreate}
        className="bg-surface-secondary border border-edge text-content"
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 13px', borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
        <Plus size={15} /> {t('reservations.createExpense')}
      </button>
      <div className="text-content-faint" style={{ fontSize: 11, marginTop: 6 }}>{t('reservations.createExpenseHint')}</div>
    </div>
  )
}
