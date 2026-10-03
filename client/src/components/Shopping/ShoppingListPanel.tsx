import { ShoppingBag, Plus, Trash2, Check, Receipt, X } from 'lucide-react';
import type { ShoppingItem, TripMember } from '../../types';
import { useShoppingList } from './useShoppingList';
import { SHOPPING_DEFAULT_CATEGORIES, getCategoryColor } from './shoppingModel';
import { NumericInput } from '../shared/NumericInput';
import { CustomDatePicker } from '../shared/CustomDateTimePicker';

export default function ShoppingListPanel({
  tripId,
  items,
  tripMembers,
}: {
  tripId: number;
  items: ShoppingItem[];
  tripMembers?: TripMember[];
}) {
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
  } = useShoppingList(tripId, items, tripMembers);

  const currencySymbol = trip?.currency || '€';

  return (
    <div className="flex flex-col h-full min-h-[480px]">
      {/* ── Quick Add Bar ── */}
      {canEdit && (
        <form
          onSubmit={e => { e.preventDefault(); handleAddItem(); }}
          className="flex flex-wrap items-center gap-2.5 p-3 mb-5 rounded-2xl bg-surface-card border border-edge shadow-xs"
        >
          <input
            type="text"
            value={newItemName}
            onChange={e => setNewItemName(e.target.value)}
            placeholder={t('shopping.inputPlaceholder')}
            className="flex-1 min-w-[180px] px-3.5 py-2 rounded-xl bg-surface-input text-content placeholder:text-content-faint text-sm border border-edge outline-none focus:ring-2 focus:ring-accent"
          />
          <input
            type="text"
            value={newItemQty}
            onChange={e => setNewItemQty(e.target.value)}
            placeholder={t('shopping.quantityPlaceholder')}
            className="w-36 max-sm:w-28 px-3 py-2 rounded-xl bg-surface-input text-content placeholder:text-content-faint text-sm border border-edge outline-none focus:ring-2 focus:ring-accent"
          />
          <select
            value={newItemCategory}
            onChange={e => setNewItemCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-surface-input text-content text-sm border border-edge outline-none cursor-pointer focus:ring-2 focus:ring-accent"
          >
            {SHOPPING_DEFAULT_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>
                {t(cat.key)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!newItemName.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-accent-text font-semibold text-sm hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer shadow-xs"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>{t('shopping.addItem')}</span>
          </button>
        </form>
      )}

      {/* ── Header & Action Filters ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-edge">
        <div className="flex items-center gap-2">
          {(['all', 'open', 'done'] as const).map(tab => {
            const active = filter === tab;
            const label = tab === 'all'
              ? t('shopping.filter.all')
              : tab === 'open'
                ? t('shopping.filter.open')
                : t('shopping.filter.done');
            const count = tab === 'all'
              ? totalCount
              : tab === 'open'
                ? totalCount - doneCount
                : doneCount;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                  active
                    ? 'bg-surface-card text-content shadow-xs border border-edge'
                    : 'text-content-muted hover:text-content'
                }`}
              >
                <span>{label}</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-surface-tertiary text-content-faint">
                  {count}
                </span>
              </button>
            );
          })}

          <div className="h-4 w-px bg-edge mx-1" />

          {SHOPPING_DEFAULT_CATEGORIES.map(cat => {
            const active = filter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilter(active ? 'all' : cat.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs cursor-pointer transition-colors ${
                  active
                    ? 'bg-surface-card text-content font-medium border border-edge shadow-xs'
                    : 'text-content-faint hover:text-content-muted'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                <span>{t(cat.key)}</span>
              </button>
            );
          })}
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            {doneCount > 0 && (
              <>
                {canTransferToBudget && unbookedDoneCount > 0 && (
                <button
                  type="button"
                  onClick={handleOpenBudgetModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-accent-text text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                >
                  <Receipt size={14} />
                  <span>{t('shopping.addToBudget')}</span>
                </button>
                )}
                <button
                  type="button"
                  onClick={handleClearChecked}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-secondary text-content-muted hover:text-red-500 text-xs transition-colors cursor-pointer"
                  title={t('shopping.clearChecked')}
                >
                  <Trash2 size={13} />
                  <span className="hidden sm:inline">{t('shopping.clearChecked')}</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── List Content ── */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        {totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="p-4 mb-3 rounded-full bg-surface-secondary text-content-faint">
              <ShoppingBag size={32} />
            </div>
            <p className="text-sm font-medium text-content-muted">
              {t('shopping.empty')}
            </p>
          </div>
        ) : (
          grouped.map(group => {
            const catDef = SHOPPING_DEFAULT_CATEGORIES.find(c => c.id === group.category);
            const catLabel = catDef ? t(catDef.key) : group.category;
            const catColor = getCategoryColor(group.category);

            return (
              <div key={group.category} className="space-y-1.5">
                <div className="flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wider text-content-faint">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: catColor }} />
                  <span>{catLabel}</span>
                  <span className="text-[10px] font-normal text-content-faint">({group.items.length})</span>
                </div>

                <div className="divide-y divide-edge-faint rounded-2xl bg-surface-card border border-edge overflow-hidden">
                  {group.items.map(item => {
                    const isChecked = !!item.checked;
                    return (
                      <div
                        key={item.id}
                        className={`group flex items-center gap-3 px-4 py-3 transition-colors ${
                          isChecked ? 'bg-surface-secondary/40' : 'hover:bg-surface-secondary/20'
                        }`}
                      >
                        <button
                          type="button"
                          disabled={!canEdit}
                          onClick={() => handleToggle(item.id, !isChecked)}
                          aria-label={`${isChecked ? t('shopping.filter.open') : t('shopping.filter.done')}: ${item.name}`}
                          className={`flex items-center justify-center w-5 h-5 rounded-md border transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-edge text-transparent hover:border-content-muted'
                          }`}
                        >
                          <Check size={12} strokeWidth={3} className={isChecked ? 'opacity-100' : 'opacity-0'} />
                        </button>

                        <div className="flex-1 min-w-0 flex items-baseline gap-2">
                          <span className={`text-sm ${isChecked ? 'line-through text-content-faint' : 'text-content font-medium'}`}>
                            {item.name}
                          </span>
                          {item.quantity && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-surface-tertiary text-content-muted font-medium">
                              {item.quantity}
                            </span>
                          )}
                          {item.budget_item_id && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-emerald-500/10 text-emerald-600 font-semibold"
                              title={t('shopping.inBudget')}
                            >
                              <Receipt size={11} />
                              {t('shopping.inBudget')}
                            </span>
                          )}
                        </div>

                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-content-faint hover:text-red-500 hover:bg-surface-tertiary transition-all cursor-pointer"
                            title={t('common.delete')}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Uncheck linked expense prompt ── */}
      {uncheckPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-surface-card border border-edge p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-content flex items-center gap-2">
              <Receipt size={18} className="text-accent" />
              <span>{t('shopping.uncheckLinkedTitle')}</span>
            </h3>
            <p className="text-sm text-content-muted">
              {uncheckPrompt.otherItemsCount > 0
                ? t('shopping.uncheckLinkedMultipleDesc', { name: uncheckPrompt.linkedExpense.name, count: uncheckPrompt.otherItemsCount })
                : t('shopping.uncheckLinkedDesc', { name: uncheckPrompt.linkedExpense.name })}
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmUncheckKeepExpense}
                className="w-full px-4 py-2 rounded-xl bg-accent text-accent-text text-sm font-semibold hover:opacity-90 cursor-pointer"
              >
                {t('shopping.uncheckKeepExpense')}
              </button>
              {canEditBudget && uncheckPrompt.otherItemsCount === 0 && (
                <button
                  type="button"
                  onClick={handleConfirmUncheckDeleteExpense}
                  className="w-full px-4 py-2 rounded-xl border border-edge text-red-500 text-sm font-semibold hover:bg-surface-secondary cursor-pointer"
                >
                  {t('shopping.uncheckDeleteExpense')}
                </button>
              )}
              <button
                type="button"
                onClick={handleCancelUncheck}
                className="w-full px-4 py-2 rounded-xl text-sm font-medium text-content-muted hover:bg-surface-secondary cursor-pointer"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Budget Transfer Modal ── */}
      {budgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-surface-card border border-edge p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-edge">
              <h3 className="text-base font-bold text-content flex items-center gap-2">
                <Receipt size={18} className="text-accent" />
                <span>{t('shopping.addToBudget')}</span>
              </h3>
              <button
                type="button"
                onClick={() => setBudgetModalOpen(false)}
                className="p-1 rounded-lg text-content-faint hover:text-content hover:bg-surface-secondary cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-content-muted mb-1.5">
                  {t('shopping.totalSpent')}
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-edge bg-surface-input px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-accent">
                  <span className="text-base font-bold text-content-muted select-none">
                    {currencySymbol}
                  </span>
                  <NumericInput
                    autoFocus
                    mode="decimal"
                    value={budgetAmount}
                    onValueChange={val => setBudgetAmount(val)}
                    placeholder="0.00"
                    className="min-w-0 flex-1 border-0 bg-transparent text-base font-semibold text-content outline-none [font-variant-numeric:tabular-nums] placeholder:text-content-faint"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-muted mb-1">
                  {t('common.date')}
                </label>
                <CustomDatePicker
                  value={budgetDate}
                  onChange={setBudgetDate}
                  placeholder={t('common.date')}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-muted mb-1">
                  {t('shopping.paidBy')}
                </label>
                <select
                  value={budgetPayerId ?? ''}
                  onChange={e => setBudgetPayerId(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-card text-content text-sm border border-edge focus:outline-none cursor-pointer"
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.username}
                    </option>
                  ))}
                </select>
              </div>

              {members.length > 1 && (
                <div>
                  <label className="block text-xs font-semibold text-content-muted mb-1.5">
                    {t('costs.splitBetween')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {members.map(m => {
                      const active = budgetParticipantIds.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => toggleBudgetParticipant(m.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                            active
                              ? 'bg-accent/10 border-accent text-accent font-semibold'
                              : 'bg-surface-secondary border-edge text-content-muted hover:border-edge-secondary'
                          }`}
                        >
                          {active && <Check size={13} className="stroke-[2.5]" />}
                          <span>{m.username}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-edge">
              <button
                type="button"
                onClick={() => setBudgetModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-content-muted hover:bg-surface-secondary cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                disabled={isSubmittingBudget || !budgetAmount.trim()}
                onClick={handleConfirmBudgetTransfer}
                className="px-4 py-2 rounded-xl bg-accent text-accent-text text-sm font-semibold hover:opacity-90 disabled:opacity-40 cursor-pointer transition-opacity"
              >
                {isSubmittingBudget ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
