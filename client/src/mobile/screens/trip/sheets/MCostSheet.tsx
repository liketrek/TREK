import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Plus, Trash2, Wallet, Receipt, Paperclip } from 'lucide-react'
import MSheet from '../../../components/MSheet'
import CustomSelect from '../../../../components/shared/CustomSelect'
import { CustomDatePicker } from '../../../../components/shared/CustomDateTimePicker'
import { NumericInput } from '../../../../components/shared/NumericInput'
import { Eyebrow, FIELD_AREA_CLS, FIELD_CLS, FormSheetFooter, FormSheetHeader } from './PlSheetChrome'
import { useTranslation } from '../../../../i18n'
import { useToast } from '../../../../components/shared/Toast'
import { useTripStore } from '../../../../store/tripStore'
import { formatMoney, localizeAmountInput } from '../../../../utils/formatters'
import { openFile } from '../../../../utils/fileDownload'
import { splitShareLabel } from '../../../../components/Budget/expenseFx'
import { SPLIT_COLORS } from '../../../../components/Budget/BudgetPanel.constants'
import { currencyOptions } from '../../../../components/Budget/costsModel'
import { COST_CATEGORY_LIST, catMeta } from '../../../../components/Budget/costsCategories'
import { NOTE_MAX } from '../../../../components/Budget/CostsPanel.helpers'
import type { ExpensePrefill } from '../../../../components/Budget/CostsPanel'
import { useExpenseForm } from '../../../../components/Budget/useExpenseForm'
import GuestBadge from '../../../../components/shared/GuestBadge'
import type { TripMember } from '../../../../components/Budget/BudgetPanelMemberChips'
import { ReceiptPreviewModal } from '../../../../components/Budget/ReceiptPreviewModal'
import type { BudgetItem } from '../../../../types'

export interface MCostSheetProps {
  tripId: number
  base: string
  people: TripMember[]
  me: number
  editing: BudgetItem | null
  prefill?: ExpensePrefill
  onClose: () => void
  onSaved: () => void
}

// Nested surfaces for the split/payer rows on the opaque sheet: the row sits on
// --m-ic, the amount box drops back to the solid sheet fill so it reads as a
// distinct input in both themes.
const ROW_CLS = 'flex items-center gap-[9px] rounded-[12px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 py-[9px]'
const MINI_INPUT_WRAP = 'flex items-center gap-1 rounded-[9px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] px-[10px]'

const SPLIT_MODES = [
  { id: 'equally', labelKey: 'costs.splitEqually' },
  { id: 'custom', labelKey: 'costs.splitCustom' },
  { id: 'ticket', labelKey: 'costs.splitTicket' },
] as const

/**
 * Add/edit expense sheet — the mobile counterpart of the desktop ExpenseModal
 * (CostsPanel). Drop-in with the same props: the parent mounts it only while
 * open, and it saves through the same tripStore actions (addBudgetItem /
 * updateBudgetItem / deleteBudgetItem). Ports every field and split mode:
 * multi-currency with live conversion, single/multi payer, and the Equally /
 * Custom / Ticket splits.
 */
export default function MCostSheet({ tripId, base, people, me, editing, prefill, onClose, onSaved }: MCostSheetProps) {
  const { t, locale } = useTranslation()
  const toast = useToast()
  const { deleteBudgetItem } = useTripStore()

  // The same editor as the desktop modal, a saved expense without a currency
  // opening in the trip's own (#2525).
  const {
    sym, nameOf, tripCur, name, setName, cat, setCat, currency, setCurrency, day, setDay, note, setNote, total, onTotalChange,
    totalNum, fx, participants, toggleParticipant, payerId, setPayerId, multiPayer, enableMultiPayer, disableMultiPayer,
    payerIds, payerAmounts, togglePayer, onPayerAmountChange, payersOk, splitMode, setSplitMode, isTicketMode, ticketItems,
    ticketInfo, handleAddEmptyItem, handleUpdateItemName, handleUpdateItemPrice, handleRemoveItem, handleToggleItemParticipant,
    customAmounts, handleCustomAmountChange, splitSum, customBalanced, each, equalShares, placeholderShares,
    receipts, pendingReceiptFiles, uploadingReceipt, handleReceiptFileSelect, handleRemoveReceipt, handleRemovePendingReceipt,
    previewReceipts, setPreviewReceipts, valid, saving, save,
  } = useExpenseForm({ tripId, base, people, me, editing, prefill, onSaved, oneSaveAtATime: true, keepSavingOnSuccess: true })

  // Internal open flag so the exit animation still plays even though the parent
  // unmounts us on close.
  const [open, setOpen] = useState(true)
  const closeTimer = useRef<number | null>(null)
  useEffect(() => () => { if (closeTimer.current) window.clearTimeout(closeTimer.current) }, [])
  const requestClose = () => {
    setOpen(false)
    closeTimer.current = window.setTimeout(onClose, 280)
  }

  const [catOpen, setCatOpen] = useState(false)
  const [deleteArmed, setDeleteArmed] = useState(false)

  const handleDelete = async () => {
    if (!editing) return
    if (!deleteArmed) {
      setDeleteArmed(true)
      toast.warning(t('mobileTrip.tapAgainToDelete'))
      return
    }
    try {
      await deleteBudgetItem(tripId, editing.id)
      onSaved()
    } catch {
      toast.error(t('common.unknownError'))
      setDeleteArmed(false)
    }
  }

  const initialOf = (p: TripMember) => (p.id === me ? t('costs.youShort') : (p.username || '?').charAt(0)).toUpperCase()

  const Avatar = ({ p, idx, size = 22, dim = false }: { p: TripMember; idx: number; size?: number; dim?: boolean }) =>
    p.avatar_url
      ? <img src={p.avatar_url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, opacity: dim ? 0.45 : 1 }} />
      : (
        <span
          style={{
            width: size, height: size, borderRadius: '50%', background: SPLIT_COLORS[idx % SPLIT_COLORS.length].gradient,
            // theme-lint-disable — white initial on the member's tint, and the glyph scales with the avatar
            color: '#fff', display: 'grid', placeItems: 'center', fontSize: size * 0.4, fontWeight: 700, flexShrink: 0, opacity: dim ? 0.45 : 1,
          }}
        >
          {initialOf(p)}
        </span>
      )

  const submitLabel = saving ? t('common.saving') : editing ? t('common.save') : t('common.add')

  return (
    <MSheet
      open={open}
      onClose={requestClose}
      material="opaque"
      ariaLabel={editing ? t('costs.editExpense') : t('costs.addExpense')}
    >
      <FormSheetHeader
        icon={Wallet}
        title={editing ? t('costs.editExpense') : t('costs.addExpense')}
        onClose={requestClose}
        closeLabel={t('common.close')}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[6px] pt-[2px]">
        {/* NAME */}
        <Eyebrow className="mb-[5px] mt-2 uppercase">{t('costs.whatFor')} *</Eyebrow>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('costs.namePlaceholder')}
          className={FIELD_CLS}
        />

        {/* TOTAL AMOUNT */}
        <Eyebrow className="mb-[5px] mt-3 uppercase">{t('costs.totalAmount')}</Eyebrow>
        <div className={`flex items-center gap-1 rounded-[12px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 py-[10px] ${isTicketMode ? 'opacity-60' : ''}`}>
          <span className="text-[0.84375rem] font-medium text-m-faint">{sym(currency)}</span>
          <NumericInput
            mode="signed-decimal"
            signToggleLabel={t('costs.toggleSign')}
            placeholder={localizeAmountInput('0.00', currency)}
            value={localizeAmountInput(isTicketMode ? ticketInfo.total.toFixed(2) : total, currency)}
            onValueChange={onTotalChange}
            disabled={isTicketMode}
            className="min-w-0 flex-1 border-0 bg-transparent text-[0.84375rem] font-semibold text-m-ink outline-none [font-variant-numeric:tabular-nums] placeholder:text-m-faint"
          />
        </div>

        {/* CURRENCY + DAY */}
        <div className="mt-3 flex gap-2">
          <div className="min-w-0 flex-1">
            <Eyebrow className="mb-[5px] uppercase">{t('costs.currency')}</Eyebrow>
            <CustomSelect
              value={currency}
              onChange={v => setCurrency(String(v))}
              searchable
              size="sm"
              options={currencyOptions(currency)}
              style={{ width: '100%' }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <Eyebrow className="mb-[5px] uppercase">{t('costs.day')}</Eyebrow>
            <CustomDatePicker value={day} onChange={setDay} style={{ width: '100%' }} />
          </div>
        </div>

        {/* CONVERSION HINT */}
        {fx && (
          <div className="mt-2 flex flex-wrap items-center gap-2 rounded-[12px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 py-[9px] text-[0.71875rem] text-m-muted">
            <span>{formatMoney(totalNum, currency, locale)}</span>
            {fx.inTrip != null && <>
              <span className="text-m-faint">→</span>
              <span className={fx.shown == null ? 'font-semibold text-m-ink' : undefined}>{formatMoney(fx.inTrip, tripCur, locale)}</span>
            </>}
            {fx.shown != null && <>
              <span className="text-m-faint">≈</span>
              <span className="font-semibold text-m-ink">{formatMoney(fx.shown, base, locale)}</span>
              <span className="text-m-faint">· {t('costs.liveRate')}</span>
            </>}
          </div>
        )}

        {/* CATEGORY — a dropdown rather than eleven pills, which took a third of
            the sheet and pushed the split below the fold. Same shape as the
            category filter on the tab behind it. */}
        <Eyebrow className="mb-[6px] mt-3 uppercase">{t('costs.category')}</Eyebrow>
        <button
          type="button"
          aria-expanded={catOpen}
          onClick={() => setCatOpen(v => !v)}
          className="flex w-full items-center gap-[10px] overflow-hidden rounded-xl border border-[color:var(--m-rowbr)] bg-m-card px-[13px] py-[11px] text-start"
        >
          {(() => {
            const meta = catMeta(cat)
            const Icon = meta.Icon
            return <Icon size={15} strokeWidth={2} style={{ color: meta.color }} className="flex-none" />
          })()}
          <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-semibold text-m-ink">{t(catMeta(cat).labelKey)}</span>
          <ChevronDown size={14} strokeWidth={2} className={`flex-none text-m-faint transition-transform duration-200 ${catOpen ? 'rotate-180' : ''}`} />
        </button>
        {catOpen && (
          <div className="mt-[6px] max-h-[240px] overflow-y-auto overscroll-contain rounded-2xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-glass)]">
            {COST_CATEGORY_LIST.map(c => {
              const Icon = c.Icon
              const on = cat === c.key
              return (
                <button
                  key={c.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => { setCat(c.key); setCatOpen(false) }}
                  className="flex w-full items-center gap-[10px] border-b border-[color:var(--m-rowbr)] px-[13px] py-[11px] text-start last:border-b-0"
                >
                  <Icon size={14} strokeWidth={2} style={{ color: c.color }} className="flex-none" />
                  <span className={`flex-1 text-[0.78125rem] ${on ? 'font-bold text-m-ink' : 'font-medium text-m-muted'}`}>{t(c.labelKey)}</span>
                  {on && <Check size={14} strokeWidth={2.4} className="flex-none text-m-ink" />}
                </button>
              )
            })}
          </div>
        )}

        {/* WHO PAID */}
        <div className="mb-[6px] mt-3 flex items-center justify-between">
          <Eyebrow className="uppercase">{t('costs.whoPaid')}</Eyebrow>
          <button
            type="button"
            onClick={() => (multiPayer ? disableMultiPayer() : enableMultiPayer())}
            className="font-geist text-[0.625rem] font-semibold text-m-muted underline"
          >
            {multiPayer ? t('costs.singlePayer') : t('costs.multiplePayers')}
          </button>
        </div>
        {!multiPayer ? (
          <CustomSelect
            value={String(payerId)}
            onChange={v => setPayerId(Number(v))}
            size="sm"
            options={[
              { value: '0', label: t('costs.noOnePaid') },
              ...people.map(p => ({ value: String(p.id), label: nameOf(p) })),
            ]}
            style={{ width: '100%' }}
          />
        ) : (
          <>
            <div className="flex flex-col gap-[6px]">
              {people.map((p, idx) => {
                const on = payerIds.has(p.id)
                return (
                  <div key={p.id} className={`${ROW_CLS} ${on ? '' : 'opacity-60'}`}>
                    <button
                      type="button"
                      onClick={() => togglePayer(p.id)}
                      className="flex min-w-0 flex-1 items-center gap-[8px] text-start"
                    >
                      <Avatar p={p} idx={idx} dim={!on} />
                      <span className="truncate text-[0.8125rem] font-medium text-m-ink">{nameOf(p)}</span>
                    </button>
                    {on ? (
                      <div className={`${MINI_INPUT_WRAP} w-[120px] flex-none`}>
                        <span className="text-[0.75rem] text-m-faint">{sym(currency)}</span>
                        <NumericInput
                          mode="signed-decimal"
                          signToggleLabel={t('costs.toggleSign')}
                          placeholder={localizeAmountInput('0.00', currency)}
                          value={localizeAmountInput(payerAmounts[p.id] || '', currency)}
                          onValueChange={v => onPayerAmountChange(p.id, v)}
                          className="w-full border-0 bg-transparent py-[7px] text-end text-[0.8125rem] font-semibold text-m-ink outline-none"
                        />
                      </div>
                    ) : (
                      <button type="button" onClick={() => togglePayer(p.id)} className="flex-none text-[0.6875rem] text-m-faint">
                        {t('costs.tapToInclude')}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            {!payersOk && (
              <div className="mt-2 text-[0.6875rem] text-[color:var(--m-st-danger)]">
                {t('costs.payersUnbalanced', { amount: formatMoney(totalNum, currency, locale) })}
              </div>
            )}
          </>
        )}

        {/* SPLIT */}
        <Eyebrow className="mb-[6px] mt-3 uppercase">{t('costs.split')}</Eyebrow>
        <div className="flex rounded-full bg-[color:var(--m-ic)] p-[3px]">
          {SPLIT_MODES.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSplitMode(m.id)}
              className={`flex-1 rounded-full py-[7px] text-[0.71875rem] font-semibold ${splitMode === m.id ? 'bg-m-act text-m-actfg' : 'text-m-muted'}`}
            >
              {t(m.labelKey)}
            </button>
          ))}
        </div>

        {isTicketMode ? (
          <div className="mt-2 flex flex-col gap-2">
            {ticketItems.map(item => (
              <div key={item.id} className="flex flex-col gap-2 rounded-[12px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-[10px]">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={t('costs.whatFor')}
                    value={item.name}
                    onChange={e => handleUpdateItemName(item.id, e.target.value)}
                    className="min-w-0 flex-[2] rounded-[9px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] px-[10px] py-[7px] text-[0.8125rem] font-medium text-m-ink outline-none placeholder:text-m-faint"
                  />
                  <div className={`${MINI_INPUT_WRAP} min-w-0 flex-1`}>
                    <span className="text-[0.75rem] text-m-faint">{sym(currency)}</span>
                    <NumericInput
                      mode="decimal"
                      placeholder={localizeAmountInput('0.00', currency)}
                      value={localizeAmountInput(item.price, currency)}
                      onValueChange={v => handleUpdateItemPrice(item.id, v)}
                      className="w-full border-0 bg-transparent py-[7px] text-end text-[0.8125rem] font-semibold text-m-ink outline-none"
                    />
                  </div>
                  <button type="button" onClick={() => handleRemoveItem(item.id)} className="flex-none text-m-muted" aria-label={t('common.delete')}>
                    <Trash2 size={15} strokeWidth={2} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-[5px]">
                  {people.map((p, idx) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleToggleItemParticipant(item.id, p.id)}
                      className={`flex items-center gap-[4px] rounded-full px-[8px] py-[3px] text-[0.6875rem] font-medium ${
                        item.participants.has(p.id) ? 'bg-m-act text-m-actfg' : 'border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] text-m-muted'
                      }`}
                    >
                      <Avatar p={p} idx={idx} size={14} dim={!item.participants.has(p.id)} />
                      <span>{nameOf(p)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddEmptyItem}
              className="flex items-center justify-center gap-[6px] rounded-[12px] border border-dashed border-[color:var(--m-rowbr)] py-[10px] text-[0.78125rem] font-semibold text-m-muted"
            >
              <Plus size={14} strokeWidth={2.2} /> {t('common.add')}
            </button>
            {ticketItems.length > 0 && (
              <div className="rounded-[12px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-3">
                <Eyebrow className="mb-[8px] uppercase">{t('costs.split')}</Eyebrow>
                <div className="flex flex-col gap-1">
                  {people.map(p => (
                    <div key={p.id} className="flex justify-between text-[0.8125rem]">
                      <span className="text-m-muted">{nameOf(p)}</span>
                      <span className="font-semibold text-m-ink [font-variant-numeric:tabular-nums]">{sym(currency)}{(ticketInfo.shares[p.id] || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="mt-2 flex flex-col gap-[6px]">
              {people.map((p, idx) => {
                const on = participants.has(p.id)
                return (
                  <div key={p.id} className={`${ROW_CLS} ${on ? '' : 'opacity-60'}`}>
                    <button
                      type="button"
                      onClick={() => toggleParticipant(p.id)}
                      className="flex min-w-0 flex-1 items-center gap-[8px] text-start"
                    >
                      <Avatar p={p} idx={idx} dim={!on} />
                      <span className="truncate text-[0.8125rem] font-medium text-m-ink">{nameOf(p)}</span>
                      {p.is_guest && <GuestBadge size="xs" />}
                    </button>
                    {splitMode === 'equally' ? (
                      on ? (
                        <span className="flex-none pe-1 text-[0.8125rem] font-semibold text-m-ink [font-variant-numeric:tabular-nums]">
                          {sym(currency)}{(equalShares[p.id] || 0).toFixed(2)}
                        </span>
                      ) : (
                        <span className="flex-none pe-1 text-[0.6875rem] text-m-faint">{t('costs.tapToInclude')}</span>
                      )
                    ) : on ? (
                      <div className={`${MINI_INPUT_WRAP} w-[120px] flex-none`}>
                        <span className="text-[0.75rem] text-m-faint">{sym(currency)}</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder={localizeAmountInput((placeholderShares[p.id] || 0).toFixed(2), currency)}
                          value={localizeAmountInput(customAmounts[p.id] || '', currency)}
                          onChange={e => handleCustomAmountChange(p.id, e.target.value)}
                          className="w-full border-0 bg-transparent py-[7px] text-end text-[0.8125rem] font-semibold text-m-ink outline-none placeholder:text-m-faint"
                        />
                      </div>
                    ) : (
                      <button type="button" onClick={() => toggleParticipant(p.id)} className="flex-none text-[0.6875rem] text-m-faint">
                        {t('costs.tapToInclude')}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="mt-2 text-[0.71875rem]">
              {splitMode === 'equally' ? (
                <span className="text-m-faint">
                  {participants.size > 0 && t('costs.splitSummary', { count: participants.size, amount: splitShareLabel(each, currency, fx, participants.size, base, sym, locale) })}
                </span>
              ) : (
                <span className={`font-semibold ${customBalanced ? 'text-[color:var(--m-st-confirmed)]' : 'text-[color:var(--m-st-danger)]'}`}>
                  {customBalanced
                    ? t('costs.splitSummary', { count: participants.size, amount: splitShareLabel(each, currency, fx, participants.size, base, sym, locale) })
                    : `${sym(currency)}${splitSum.toFixed(2)} / ${sym(currency)}${totalNum.toFixed(2)}`}
                </span>
              )}
            </div>
          </>
        )}

        {/* NOTE — last, because it is the one field that is never required. The
            room for it came from folding the category pills into a dropdown. */}
        <Eyebrow className="mb-[6px] mt-3 uppercase">{t('costs.note')}</Eyebrow>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={2}
          maxLength={NOTE_MAX}
          placeholder={t('costs.notePlaceholder')}
          className={FIELD_AREA_CLS}
        />

        {/* RECEIPTS */}
        <div className="mb-[6px] mt-4 flex items-center justify-between">
          <Eyebrow className="uppercase">{t('costs.receiptsTitle') || t('costs.receipts')}</Eyebrow>
          <label className="flex cursor-pointer items-center gap-1 text-[0.75rem] font-semibold text-m-ink">
            <input
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="hidden"
              onChange={e => {
                handleReceiptFileSelect(e.target.files)
                e.target.value = ''
              }}
            />
            <span className="flex items-center gap-1 rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-2.5 py-1 text-m-muted">
              <Plus size={12} /> {t('costs.attachReceipt')}
            </span>
          </label>
        </div>

        {uploadingReceipt && (
          <div className="mb-2 text-[0.75rem] text-m-faint">
            {t('common.saving')}...
          </div>
        )}

        {receipts.length === 0 && pendingReceiptFiles.length === 0 ? (
          <div className="py-1 text-[0.75rem] text-m-faint">
            {t('costs.noReceipts')}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 pb-2">
            {receipts.map((r, rIdx) => (
              <div key={r.id} className={ROW_CLS}>
                <button
                  type="button"
                  onClick={() => setPreviewReceipts({ receipts, initialIndex: rIdx })}
                  className="flex min-w-0 flex-1 items-center gap-2 text-start"
                >
                  <Receipt size={14} className="flex-none text-m-faint" />
                  <span className="truncate text-[0.8125rem] font-medium text-m-ink">{r.original_name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveReceipt(r.id)}
                  title={t('costs.deleteReceipt')}
                  className="flex-none p-1 text-m-muted hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {pendingReceiptFiles.map((file, idx) => (
              <div key={idx} className={ROW_CLS}>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Paperclip size={14} className="flex-none text-m-faint" />
                  <span className="truncate text-[0.8125rem] font-medium text-m-ink">{file.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemovePendingReceipt(idx)}
                  title={t('costs.deleteReceipt')}
                  className="flex-none p-1 text-m-muted hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <FormSheetFooter
        onDelete={editing ? handleDelete : undefined}
        deleteLabel={t('common.delete')}
        deleteArmed={deleteArmed}
        onCancel={requestClose}
        cancelLabel={t('common.cancel')}
        onSubmit={save}
        submitLabel={submitLabel}
        submitDisabled={!valid || saving}
      />

      {previewReceipts && (
        <ReceiptPreviewModal
          receipts={previewReceipts.receipts}
          initialIndex={previewReceipts.initialIndex}
          onClose={() => setPreviewReceipts(null)}
        />
      )}
    </MSheet>
  )
}
