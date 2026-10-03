import { Check, Plus, Receipt, ShoppingBag, Trash2 } from 'lucide-react'
import { useShoppingList } from '../../../../components/Shopping/useShoppingList'
import { SHOPPING_DEFAULT_CATEGORIES, getCategoryColor } from '../../../../components/Shopping/shoppingModel'
import { TabScroller, CountPill } from './tabChrome'
import MSheet from '../../../components/MSheet'
import { Eyebrow, FIELD_CLS, FormSheetFooter, FormSheetHeader } from '../sheets/PlSheetChrome'
import { NumericInput } from '../../../../components/shared/NumericInput'
import { CustomDatePicker } from '../../../../components/shared/CustomDateTimePicker'
import { avatarSrc } from '../../../../utils/avatarSrc'
import type { TripPlanner } from '../MTripShell'

export default function MShoppingListTab({ planner }: { planner: TripPlanner }) {
  const { tripId, shoppingItems: items, tripMembers } = planner
  const {
    t,
    canEdit,
    canEditBudget,
    canTransferToBudget,
    trip,
    filter,
    setFilter,
    grouped,
    totalCount,
    doneCount,
    unbookedDoneCount,
    newItemName,
    setNewItemName,
    newItemQty,
    setNewItemQty,
    newItemCategory,
    setNewItemCategory,
    members,
    handleAddItem,
    handleToggle,
    handleDelete,
    handleClearChecked,
    budgetModalOpen,
    setBudgetModalOpen,
    budgetAmount,
    setBudgetAmount,
    budgetDate,
    setBudgetDate,
    budgetPayerId,
    setBudgetPayerId,
    budgetParticipantIds,
    toggleBudgetParticipant,
    isSubmittingBudget,
    handleOpenBudgetModal,
    handleConfirmBudgetTransfer,
    uncheckPrompt,
    handleConfirmUncheckKeepExpense,
    handleConfirmUncheckDeleteExpense,
    handleCancelUncheck,
  } = useShoppingList(tripId, items || [], tripMembers)

  const currencySymbol = trip?.currency || '€'
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  const filterPill = (active: boolean) =>
    `flex flex-none items-center gap-[5px] whitespace-nowrap rounded-full px-[11px] py-[6px] text-[0.71875rem] font-semibold ${
      active ? 'bg-m-act text-m-actfg' : 'bg-[color:var(--m-ic)] text-m-ink'
    }`

  const openCount = totalCount - doneCount

  return (
    <TabScroller>
      {/* ── Progress Card ── */}
      <div className="rounded-2xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[14px] py-[13px]">
        <div className="flex items-baseline gap-[7px]">
          <span className="font-geist text-[1rem] font-extrabold tabular-nums text-m-ink">
            {doneCount}/{totalCount}
          </span>
          <span className="font-geist text-[0.625rem] font-bold text-m-faint">
            {pct}% · {t('todo.completed')}
          </span>
          {canEdit && doneCount > 0 && (
            <div className="ml-auto flex items-center gap-1.5">
              {canTransferToBudget && unbookedDoneCount > 0 && (
              <button
                type="button"
                onClick={handleOpenBudgetModal}
                className="flex items-center gap-1 rounded-full bg-accent px-[10px] py-[5px] text-[0.6875rem] font-semibold text-accent-contrast shadow-xs"
                title={t('shopping.addToBudget')}
              >
                <Receipt size={12} strokeWidth={2.4} />
                <span className="hidden xs:inline">{t('shopping.addToBudget')}</span>
              </button>
              )}
              <button
                type="button"
                onClick={handleClearChecked}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(127,127,130,.15)] text-m-faint hover:text-red-500"
                title={t('shopping.clearChecked')}
                aria-label={t('shopping.clearChecked')}
              >
                <Trash2 size={13} strokeWidth={2.2} />
              </button>
            </div>
          )}
        </div>
        <div className="mt-[9px] h-[5px] overflow-hidden rounded-full bg-[color:var(--m-ic)]">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--m-st-confirmed)' }} />
        </div>
      </div>

      {/* ── Quick Add Bar ── */}
      {canEdit && (
        <form
          onSubmit={e => { e.preventDefault(); handleAddItem(); }}
          className="mt-[10px] flex flex-col gap-2 rounded-2xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-3"
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              placeholder={t('shopping.inputPlaceholder')}
              className="min-w-0 flex-1 rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-card)] px-3 py-2 text-[0.8125rem] text-m-ink placeholder:text-m-faint focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              type="submit"
              disabled={!newItemName.trim()}
              className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-m-act text-m-actfg font-semibold shadow-xs disabled:opacity-40"
              aria-label={t('common.add')}
            >
              <Plus size={16} strokeWidth={2.5} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newItemQty}
              onChange={e => setNewItemQty(e.target.value)}
              placeholder={t('shopping.quantityPlaceholder')}
              className="w-24 rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-card)] px-2.5 py-1.5 text-[0.75rem] text-m-ink placeholder:text-m-faint focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <select
              value={newItemCategory}
              onChange={e => setNewItemCategory(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-card)] px-2.5 py-1.5 text-[0.75rem] text-m-ink focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {SHOPPING_DEFAULT_CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{t(c.key)}</option>
              ))}
            </select>
          </div>
        </form>
      )}

      {/* ── Filters ── */}
      {totalCount > 0 && (
        <div className="mt-[10px] flex items-center gap-[6px] overflow-x-auto whitespace-nowrap pb-1">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={filterPill(filter === 'all')}
          >
            {t('shopping.filter.all')}
            <span className="font-geist text-[0.5625rem] opacity-70">{totalCount}</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('open')}
            className={filterPill(filter === 'open')}
          >
            {t('shopping.filter.open')}
            <span className="font-geist text-[0.5625rem] opacity-70">{openCount}</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('done')}
            className={filterPill(filter === 'done')}
          >
            {t('shopping.filter.done')}
            <span className="font-geist text-[0.5625rem] opacity-70">{doneCount}</span>
          </button>

          {SHOPPING_DEFAULT_CATEGORIES.map(c => {
            const catLabel = t(c.key)
            const active = filter === c.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setFilter(active ? 'all' : c.id)}
                className={filterPill(active)}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                {catLabel}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Item List / Empty State ── */}
      <div className="mt-3 space-y-4">
        {totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 rounded-full bg-[color:var(--m-ic)] p-4 text-m-faint">
              <ShoppingBag size={32} />
            </div>
            <p className="text-sm font-medium text-m-faint">
              {t('shopping.empty')}
            </p>
          </div>
        ) : grouped.length === 0 ? (
          <div className="py-8 text-center text-xs text-m-faint">
            {t('shopping.empty')}
          </div>
        ) : (
          grouped.map(group => {
            const catDef = SHOPPING_DEFAULT_CATEGORIES.find(c => c.id === group.category)
            const catLabel = catDef ? t(catDef.key) : group.category
            const catColor = getCategoryColor(group.category)

            return (
              <div key={group.category} className="space-y-1.5">
                <div className="flex items-center gap-2 px-1">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: catColor }} />
                  <span className="font-geist text-[0.6875rem] font-bold uppercase tracking-wider text-m-faint">
                    {catLabel}
                  </span>
                  <CountPill>{group.items.length}</CountPill>
                </div>

                <div className="overflow-hidden rounded-2xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] divide-y divide-[color:var(--m-rowbr)]">
                  {group.items.map(item => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 px-3.5 py-3 transition-colors ${
                        item.checked ? 'bg-[rgba(127,127,130,.06)]' : ''
                      }`}
                    >
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => handleToggle(item.id, !item.checked)}
                        className={`flex h-6 w-6 flex-none items-center justify-center rounded-lg border transition-all ${
                          item.checked
                            ? 'border-accent bg-accent text-accent-contrast'
                            : 'border-edge-subtle bg-surface-card'
                        }`}
                        aria-label={`${item.checked ? t('shopping.filter.open') : t('shopping.filter.done')}: ${item.name}`}
                      >
                        {item.checked && <Check size={14} strokeWidth={3} />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm leading-snug break-words ${
                            item.checked ? 'text-m-faint line-through' : 'font-medium text-m-ink'
                          }`}
                        >
                          {item.name}
                        </p>
                      </div>

                      {item.quantity && (
                        <span className="flex-none rounded-lg bg-[rgba(127,127,130,.12)] px-2 py-0.5 font-geist text-xs font-semibold text-m-muted">
                          {item.quantity}
                        </span>
                      )}

                      {item.budget_item_id && (
                        <span
                          className="flex flex-none items-center gap-1 rounded-lg bg-emerald-500/10 px-1.5 py-0.5 font-geist text-[0.625rem] font-bold text-emerald-600"
                          title={t('shopping.inBudget')}
                        >
                          <Receipt size={10} strokeWidth={2.6} />
                          {t('shopping.inBudget')}
                        </span>
                      )}

                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-m-faint hover:text-red-500"
                          aria-label={t('common.delete')}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── Uncheck linked expense sheet ── */}
      <MSheet open={!!uncheckPrompt} onClose={handleCancelUncheck}>
        <FormSheetHeader
          title={t('shopping.uncheckLinkedTitle')}
          onClose={handleCancelUncheck}
          closeLabel={t('common.cancel')}
        />
        {uncheckPrompt && (
          <div className="space-y-3 px-4 py-3 pb-6">
            <p className="text-sm text-m-muted">
              {uncheckPrompt.otherItemsCount > 0
                ? t('shopping.uncheckLinkedMultipleDesc', { name: uncheckPrompt.linkedExpense.name, count: uncheckPrompt.otherItemsCount })
                : t('shopping.uncheckLinkedDesc', { name: uncheckPrompt.linkedExpense.name })}
            </p>
            <button
              type="button"
              onClick={handleConfirmUncheckKeepExpense}
              className="w-full rounded-full bg-m-act px-4 py-3 text-sm font-semibold text-m-actfg"
            >
              {t('shopping.uncheckKeepExpense')}
            </button>
            {canEditBudget && uncheckPrompt.otherItemsCount === 0 && (
              <button
                type="button"
                onClick={handleConfirmUncheckDeleteExpense}
                className="w-full rounded-full border border-[color:var(--m-rowbr)] px-4 py-3 text-sm font-semibold text-red-500"
              >
                {t('shopping.uncheckDeleteExpense')}
              </button>
            )}
          </div>
        )}
      </MSheet>

      {/* ── Budget Transfer Sheet ── */}
      <MSheet open={budgetModalOpen} onClose={() => setBudgetModalOpen(false)}>
        <FormSheetHeader
          title={t('shopping.addToBudget')}
          onClose={() => setBudgetModalOpen(false)}
          closeLabel={t('common.cancel')}
        />
        <div className="space-y-4 px-4 py-3">
          <div>
            <Eyebrow className="mb-1.5 uppercase">{t('shopping.totalSpent')}</Eyebrow>
            <div className="flex items-center gap-2 rounded-[12px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 py-[10px] focus-within:ring-1 focus-within:ring-accent">
              <span className="text-[0.84375rem] font-bold text-m-faint select-none">
                {currencySymbol}
              </span>
              <NumericInput
                autoFocus
                mode="decimal"
                value={budgetAmount}
                onValueChange={setBudgetAmount}
                placeholder="0.00"
                className="min-w-0 flex-1 border-0 bg-transparent text-[0.84375rem] font-semibold text-m-ink outline-none [font-variant-numeric:tabular-nums] placeholder:text-m-faint"
              />
            </div>
          </div>

          <div>
            <Eyebrow className="mb-1.5 uppercase">{t('common.date')}</Eyebrow>
            <CustomDatePicker
              value={budgetDate}
              onChange={setBudgetDate}
              placeholder={t('common.date')}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <Eyebrow className="mb-1.5 uppercase">{t('shopping.paidBy')}</Eyebrow>
            <div className="flex flex-wrap gap-1.5">
              {members.map(m => {
                const active = budgetPayerId === m.id
                const src = m.avatar_url || avatarSrc(m.avatar)
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setBudgetPayerId(m.id)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      active ? 'bg-m-act font-semibold text-m-actfg' : 'bg-[color:var(--m-ic)] text-m-ink border border-[color:var(--m-rowbr)]'
                    }`}
                  >
                    <span className="flex h-4 w-4 flex-none items-center justify-center overflow-hidden rounded-full bg-m-act text-[0.5rem] font-bold text-m-actfg">
                      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : m.username[0]?.toUpperCase()}
                    </span>
                    {m.username}
                  </button>
                )
              })}
            </div>
          </div>

          {members.length > 1 && (
            <div>
              <Eyebrow className="mb-1.5 uppercase">{t('costs.splitBetween')}</Eyebrow>
              <div className="flex flex-wrap gap-1.5">
                {members.map(m => {
                  const active = budgetParticipantIds.includes(m.id)
                  const src = m.avatar_url || avatarSrc(m.avatar)
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleBudgetParticipant(m.id)}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        active ? 'bg-m-act font-semibold text-m-actfg' : 'bg-[color:var(--m-ic)] text-m-ink border border-[color:var(--m-rowbr)]'
                      }`}
                    >
                      {active ? (
                        <Check size={12} strokeWidth={2.8} />
                      ) : (
                        <span className="flex h-3.5 w-3.5 flex-none items-center justify-center overflow-hidden rounded-full bg-m-faint/30 text-[0.45rem] font-bold text-m-ink">
                          {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : m.username[0]?.toUpperCase()}
                        </span>
                      )}
                      {m.username}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <FormSheetFooter
          onCancel={() => setBudgetModalOpen(false)}
          cancelLabel={t('common.cancel')}
          onSubmit={handleConfirmBudgetTransfer}
          submitLabel={t('shopping.addToBudget')}
          submitDisabled={!budgetAmount.trim() || isSubmittingBudget}
        />
      </MSheet>
    </TabScroller>
  )
}
