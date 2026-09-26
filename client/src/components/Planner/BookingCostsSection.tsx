import { Plus, Pencil, Trash2, Link2Off } from 'lucide-react'
import { useTripStore } from '../../store/tripStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useTranslation } from '../../i18n'
import CustomSelect from '../shared/CustomSelect'
import { formatMoney } from '../../utils/formatters'
import { catMeta } from '../Budget/costsCategories'
import { useExpenseLinks } from './useRecordLinks'
import type { BudgetItem } from '../../types'

/**
 * The Costs block inside a booking modal — and, since #1298, inside the place
 * form, which links its expenses the same way. Replaces the old inline price +
 * budget category fields.
 *
 * A booking or place can carry several expenses (the flight, then the upgrade
 * bought for it, #2084). Each is listed with edit, unlink (the expense stays in
 * Costs) and delete. Under them, "create expense" makes a new one (the modal
 * saves its own record first, then opens the full Costs editor), and once the
 * record exists an expense already in Costs can be linked to it from a list.
 *
 * Exactly one of reservationId / placeId is set — they are the two sides of the
 * same link, and the block behaves identically on both.
 */
export function BookingCostsSection({ reservationId, placeId = null, hintKey = 'reservations.createExpenseHint', pendingExpense, onCreate, onEdit, onRemove }: {
  reservationId: number | null
  /** Set instead of reservationId when the block sits in the place form (#1298). */
  placeId?: number | null
  /** What gets saved before the editor opens — "the booking" or "the place". */
  hintKey?: string
  /** A cost parsed from an import that will be linked on save — previewed before the booking exists. */
  pendingExpense?: { total_price: number; currency?: string | null; category: string } | null
  onCreate: () => void
  onEdit: (item: BudgetItem) => void
  onRemove: (item: BudgetItem) => void
}) {
  const { t, locale } = useTranslation()
  const tripCurrency = useTripStore(s => s.trip?.currency)
  const displayCurrency = useSettingsStore(s => s.settings.default_currency)
  const base = (displayCurrency || tripCurrency || 'EUR').toUpperCase()
  // An amount is printed in its own currency, unconverted. One saved without a
  // currency is in the trip's own (#2525), which is how Costs reads it; labelling
  // it with the display currency turned a 120 EUR deposit into $120.00.
  const ownCurrency = (currency: string | null | undefined) => currency || tripCurrency || base
  const { targetId, linked, unlinked, link, unlink } = useExpenseLinks(reservationId, placeId)

  const labelCls = 'block text-[11px] font-semibold uppercase tracking-[0.08em] text-content-faint mb-[6px]'
  const rowCls = 'bg-surface-secondary border border-edge'
  const rowStyle = { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10 } as const
  const iconButton = 'text-content-muted border border-edge bg-surface-card transition-colors hover:bg-surface-tertiary hover:text-content'
  const deleteButton = 'text-content-muted border border-edge bg-surface-card transition-colors hover:bg-danger-soft hover:text-danger'
  const iconButtonStyle = { display: 'inline-flex', padding: 7, borderRadius: 8, cursor: 'pointer' } as const

  // Import review (booking not saved yet): preview the parsed cost that will be linked on save.
  if (linked.length === 0 && pendingExpense && pendingExpense.total_price > 0) {
    const meta = catMeta(pendingExpense.category)
    const Icon = meta.Icon
    return (
      <div>
        <label className={labelCls}>{t('reservations.linkedExpense')}</label>
        <div className={rowCls} style={rowStyle}>
          <span style={{ width: 26, height: 26, borderRadius: 7, display: 'grid', placeItems: 'center', background: meta.color + '22', color: meta.color, flexShrink: 0 }}><Icon size={14} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="text-content" style={{ fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 600 }}>{t(meta.labelKey)}</div>
            <div className="text-content-faint" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))' }}>{t(hintKey)}</div>
          </div>
          <span className="text-content" style={{ fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 700, flexShrink: 0 }}>{formatMoney(pendingExpense.total_price, ownCurrency(pendingExpense.currency), locale)}</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <label className={labelCls}>{linked.length > 0 ? t('reservations.linkedExpenses') : t('reservations.costsLabel')}</label>

      {linked.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
          {linked.map(item => {
            const meta = catMeta(item.category)
            const Icon = meta.Icon
            return (
              <div key={item.id} className={rowCls} style={rowStyle}>
                <span style={{ width: 26, height: 26, borderRadius: 7, display: 'grid', placeItems: 'center', background: meta.color + '22', color: meta.color, flexShrink: 0 }}><Icon size={14} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="text-content" style={{ fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                  <div className="text-content-faint" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))' }}>{t(meta.labelKey)}</div>
                </div>
                <span className="text-content" style={{ fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 700, flexShrink: 0 }}>{formatMoney(item.total_price, ownCurrency(item.currency), locale)}</span>
                <button type="button" onClick={() => onEdit(item)} title={t('common.edit')} aria-label={t('common.edit')} className={iconButton} style={iconButtonStyle}><Pencil size={13} /></button>
                <button type="button" onClick={() => void unlink(item)} title={t('reservations.unlinkExpense')} aria-label={t('reservations.unlinkExpense')} className={iconButton} style={iconButtonStyle}><Link2Off size={13} /></button>
                <button type="button" onClick={() => onRemove(item)} title={t('reservations.removeExpense')} aria-label={t('reservations.removeExpense')} className={deleteButton} style={iconButtonStyle}><Trash2 size={13} /></button>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: targetId ? '1fr 1fr' : '1fr', gap: 8 }}>
        <button type="button" onClick={onCreate}
          className="bg-surface-secondary border border-edge text-content transition-colors hover:bg-surface-tertiary"
          // Sized like the select beside it, so the two sit as one row.
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 13px', borderRadius: 10, fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          <Plus size={14} /> {t('reservations.createExpense')}
        </button>
        {/* Linking needs the record to exist, so it waits for the first save. */}
        {targetId !== null && (
          <CustomSelect
            value=""
            onChange={value => {
              const item = unlinked.find(i => i.id === Number(value))
              if (item) void link(item)
            }}
            placeholder={unlinked.length > 0 ? t('reservations.linkExpense') : t('reservations.noUnlinkedExpenses')}
            options={unlinked.map(i => {
              const meta = catMeta(i.category)
              const Icon = meta.Icon
              return {
                value: i.id,
                label: i.name,
                badge: formatMoney(i.total_price, ownCurrency(i.currency), locale),
                icon: <Icon size={13} style={{ color: meta.color }} />,
              }
            })}
            searchable
            disabled={unlinked.length === 0}
          />
        )}
      </div>
      {linked.length === 0 && (
        <div className="text-content-faint" style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', marginTop: 6 }}>{t(hintKey)}</div>
      )}
    </div>
  )
}
