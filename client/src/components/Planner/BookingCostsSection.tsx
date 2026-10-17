import type { ReactNode } from 'react'
import { Plus, Pencil, Trash2, Link2Off } from 'lucide-react'
import { useTripStore } from '../../store/tripStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useTranslation } from '../../i18n'
import CustomSelect from '../shared/CustomSelect'
import { Tooltip } from '../shared/Tooltip'
import { fs } from '../shared/DialogShell'
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
export function BookingCostsSection({ reservationId, placeId = null, hintKey = 'reservations.createExpenseHint', pendingExpense, onCreate, onEdit, onRemove, labelClassName, customTooltips = false, whiteButtons = false }: {
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
  /** Replaces the block's own label style, so a host form can match its other fields. */
  labelClassName?: string
  /** Shows the row buttons' hints in the shared Tooltip instead of the native title. */
  customTooltips?: boolean
  /**
   * Draws the create button and the expense rows white on a hairline, the look
   * of the dialog frame's secondary buttons, instead of the grey fill.
   */
  whiteButtons?: boolean
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

  const labelCls = labelClassName ?? 'block text-[11px] font-semibold uppercase tracking-[0.08em] text-content-faint mb-[6px]'
  const rowCls = whiteButtons ? 'bg-surface-card border border-edge-faint' : 'bg-surface-secondary border border-edge'
  const rowStyle = { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10 } as const
  // White, the row's buttons trade the border for the hairline ring and shadow of
  // the create button under them; the border stays, transparent, to keep their size.
  const iconButton = whiteButtons
    ? 'border border-transparent bg-surface-card text-content-muted shadow-sm ring-1 ring-edge-faint transition-colors hover:bg-surface-hover hover:text-content'
    : 'text-content-muted border border-edge bg-surface-card transition-colors hover:bg-surface-tertiary hover:text-content'
  const deleteButton = whiteButtons
    ? 'border border-transparent bg-surface-card text-content-muted shadow-sm ring-1 ring-edge-faint transition-colors hover:bg-danger-soft hover:text-danger'
    : 'text-content-muted border border-edge bg-surface-card transition-colors hover:bg-danger-soft hover:text-danger'
  const iconButtonStyle = { display: 'inline-flex', padding: 7, borderRadius: 8, cursor: 'pointer' } as const
  const rowButton = (label: string, className: string, onClick: () => void, icon: ReactNode) => {
    const button = (
      <button type="button" onClick={onClick} title={customTooltips ? undefined : label} aria-label={label} className={className} style={iconButtonStyle}>{icon}</button>
    )
    return customTooltips ? <Tooltip label={label}>{button}</Tooltip> : button
  }

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
            <div className="text-content" style={{ ...fs(14, 'body'), fontWeight: 600 }}>{t(meta.labelKey)}</div>
            <div className="text-content-faint" style={fs(12, 'body')}>{t(hintKey)}</div>
          </div>
          <span className="text-content" style={{ ...fs(14, 'body'), fontWeight: 700, flexShrink: 0 }}>{formatMoney(pendingExpense.total_price, ownCurrency(pendingExpense.currency), locale)}</span>
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
                  <div className="text-content" style={{ ...fs(14, 'body'), fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                  <div className="text-content-faint" style={fs(12, 'body')}>{t(meta.labelKey)}</div>
                </div>
                <span className="text-content" style={{ ...fs(14, 'body'), fontWeight: 700, flexShrink: 0 }}>{formatMoney(item.total_price, ownCurrency(item.currency), locale)}</span>
                {rowButton(t('common.edit'), iconButton, () => onEdit(item), <Pencil size={13} />)}
                {rowButton(t('reservations.unlinkExpense'), iconButton, () => void unlink(item), <Link2Off size={13} />)}
                {rowButton(t('reservations.removeExpense'), deleteButton, () => onRemove(item), <Trash2 size={13} />)}
              </div>
            )
          })}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: targetId ? '1fr 1fr' : '1fr', gap: 8 }}>
        <button type="button" onClick={onCreate}
          className={whiteButtons
            // The transparent border keeps it the height of the bordered select beside it.
            ? 'border border-transparent bg-surface-card text-content shadow-sm ring-1 ring-edge-faint transition-colors hover:bg-surface-hover'
            : 'bg-surface-secondary border border-edge text-content transition-colors hover:bg-surface-tertiary'}
          // Sized like the select beside it, so the two sit as one row.
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 13px', borderRadius: 10, ...fs(13, 'body'), fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
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
        <div className="text-content-faint" style={{ ...fs(11), marginTop: 6 }}>{t(hintKey)}</div>
      )}
    </div>
  )
}
