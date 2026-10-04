import { useState } from 'react'
import { ChevronRight, Link2, Link2Off, Plus, Search, Trash2 } from 'lucide-react'
import { useTranslation } from '../../../../i18n'
import { useTripStore } from '../../../../store/tripStore'
import { useSettingsStore } from '../../../../store/settingsStore'
import { useToast } from '../../../../components/shared/Toast'
import { formatMoney } from '../../../../utils/formatters'
import { catMeta } from '../../../../components/Budget/costsCategories'
import { useExpenseLinks } from '../../../../components/Planner/useRecordLinks'
import type { BudgetItem } from '../../../../types'
import { Eyebrow } from './PlSheetChrome'

const PILL_CLS =
  'flex w-full items-center justify-center gap-[6px] rounded-[13px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] py-[11px] text-[0.78125rem] font-semibold text-m-ink disabled:opacity-40'
const ROW_ICON_BTN_CLS = 'flex h-8 w-8 flex-none items-center justify-center rounded-full text-m-faint active:bg-[color:var(--m-ic)]'
// Past this many the list gets a search field, a trip can collect a lot of expenses.
const SEARCH_FROM = 6

interface MLinkedCostsProps {
  reservationId?: number | null
  placeId?: number | null
  /** "The booking" or "the place" is saved before the editor opens. */
  hintKey: string
  createDisabled: boolean
  onCreate: () => void
  onEdit: (item: BudgetItem) => void
}

/**
 * The Costs block of the phone booking, transport and place sheets (#2084):
 * the expenses linked here (tap to edit, unlink keeps the expense, delete),
 * then "create expense" and, once the record exists, an inline list of the
 * trip's unlinked expenses to link one from. Same logic as the desktop block,
 * through useExpenseLinks.
 */
export default function MLinkedCosts({ reservationId = null, placeId = null, hintKey, createDisabled, onCreate, onEdit }: MLinkedCostsProps) {
  const { t, locale } = useTranslation()
  const toast = useToast()
  const tripId = useTripStore(s => s.trip?.id)
  const tripCurrency = useTripStore(s => s.trip?.currency)
  const deleteBudgetItem = useTripStore(s => s.deleteBudgetItem)
  const displayCurrency = useSettingsStore(s => s.settings.default_currency)
  const base = (displayCurrency || tripCurrency || 'EUR').toUpperCase()
  const { targetId, linked, unlinked, link, unlink } = useExpenseLinks(reservationId, placeId)
  const [picking, setPicking] = useState(false)
  const [query, setQuery] = useState('')

  // In the expense's own currency; one saved without a currency is in the trip's (#2525).
  const money = (item: BudgetItem) => formatMoney(item.total_price, item.currency || tripCurrency || base, locale)
  const remove = async (item: BudgetItem) => {
    if (!tripId) return
    try { await deleteBudgetItem(tripId, item.id) } catch { toast.error(t('common.unknownError')) }
  }
  const needle = query.trim().toLowerCase()
  const offered = needle ? unlinked.filter(i => i.name.toLowerCase().includes(needle)) : unlinked

  return (
    <>
      <Eyebrow className="mb-[6px] mt-3 uppercase">{linked.length > 0 ? t('reservations.linkedExpenses') : t('reservations.costsLabel')}</Eyebrow>

      {linked.length > 0 && (
        <div className="mb-2 flex flex-col gap-[6px]">
          {linked.map(item => {
            const meta = catMeta(item.category)
            const Icon = meta.Icon
            return (
              <div key={item.id} className="flex items-center gap-1 rounded-[13px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] py-[5px] pl-[10px] pr-1">
                <button type="button" onClick={() => onEdit(item)} aria-label={t('common.edit')} className="flex min-w-0 flex-1 items-center gap-[10px] py-[3px] text-left">
                  <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[9px]" style={{ background: `${meta.color}22`, color: meta.color }}>
                    <Icon size={15} strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.8125rem] font-semibold text-m-ink">{item.name}</span>
                    <span className="block truncate font-geist text-[0.65625rem] text-m-faint">{t(meta.labelKey)}</span>
                  </span>
                  <span className="flex-none font-geist text-[0.8125rem] font-semibold tabular-nums text-m-ink">{money(item)}</span>
                </button>
                <button type="button" onClick={() => void unlink(item)} aria-label={t('reservations.unlinkExpense')} title={t('reservations.unlinkExpense')} className={ROW_ICON_BTN_CLS}>
                  <Link2Off size={14} strokeWidth={2} />
                </button>
                <button type="button" onClick={() => void remove(item)} aria-label={t('reservations.removeExpense')} title={t('reservations.removeExpense')} className={`${ROW_ICON_BTN_CLS} active:text-[color:var(--m-st-danger)]`}>
                  <Trash2 size={14} strokeWidth={2} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <div className={`grid gap-2 ${targetId ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <button type="button" onClick={onCreate} disabled={createDisabled} className={PILL_CLS}>
          <Plus size={13} strokeWidth={2.2} />
          {t('reservations.createExpense')}
        </button>
        {/* Linking needs the record to exist, so it waits for the first save. */}
        {targetId !== null && (
          <button type="button" onClick={() => setPicking(v => !v)} aria-expanded={picking} className={`${PILL_CLS} ${picking ? '!bg-m-act !text-m-actfg' : ''}`}>
            <Link2 size={13} strokeWidth={2.2} />
            {t('files.link')}
          </button>
        )}
      </div>

      {picking && targetId !== null && (
        <div className="mt-2 rounded-[13px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-1">
          {unlinked.length >= SEARCH_FROM && (
            <div className="mx-1 mb-1 mt-1 flex items-center gap-2 rounded-[10px] bg-[color:var(--m-ic)] px-[10px] py-[7px]">
              <Search size={13} strokeWidth={2} className="flex-none text-m-faint" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('common.search')}
                className="min-w-0 flex-1 bg-transparent text-[0.78125rem] text-m-ink outline-none placeholder:text-m-faint" />
            </div>
          )}
          {offered.length === 0 ? (
            <div className="px-[10px] py-[10px] text-center font-geist text-[0.6875rem] text-m-faint">{t('reservations.noUnlinkedExpenses')}</div>
          ) : (
            <div className="flex max-h-[232px] flex-col overflow-y-auto">
              {offered.map(item => {
                const meta = catMeta(item.category)
                const Icon = meta.Icon
                return (
                  <button key={item.id} type="button"
                    onClick={async () => { await link(item); setPicking(false); setQuery('') }}
                    className="flex w-full items-center gap-[10px] rounded-[10px] px-[10px] py-[8px] text-left active:bg-[color:var(--m-ic)]">
                    <Icon size={14} strokeWidth={2} className="flex-none" style={{ color: meta.color }} />
                    <span className="min-w-0 flex-1 truncate text-[0.78125rem] font-medium text-m-ink">{item.name}</span>
                    <span className="flex-none font-geist text-[0.71875rem] tabular-nums text-m-muted">{money(item)}</span>
                    <ChevronRight size={13} strokeWidth={2} className="flex-none text-m-faint" />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {linked.length === 0 && <div className="mt-[5px] font-geist text-[0.625rem] text-m-faint">{t(hintKey)}</div>}
    </>
  )
}
