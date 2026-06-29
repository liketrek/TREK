import { Plus, Calculator, Download } from 'lucide-react'
import CustomSelect from '../shared/CustomSelect'
import { CURRENCIES, SYMBOLS } from './BudgetPanel.constants'
import { useBudgetPanel } from './useBudgetPanel'
import type { TripMember } from './BudgetPanelMemberChips'
import BudgetCategoryTable from './BudgetPanelCategoryTable'
import BudgetSummary from './BudgetPanelSummary'

export { splitColorFor } from './BudgetPanel.helpers'

// ── Main Component ───────────────────────────────────────────────────────────
interface BudgetPanelProps {
  tripId: number
  tripMembers?: TripMember[]
}

export default function BudgetPanel({ tripId, tripMembers = [] }: BudgetPanelProps) {
  const {
    budgetItems,
    setBudgetItemMembers, toggleBudgetMemberPaid, reorderBudgetItems, reorderBudgetCategories,
    t, locale, isDark, theme,
    newCategoryName, setNewCategoryName,
    editingCat, setEditingCat,
    settlement, settlementOpen, setSettlementOpen,
    currency, canEdit, fmt, hasMultipleMembers,
    dragCat, setDragCat, dragOverCat, setDragOverCat,
    dragItem, setDragItem, dragOverItem, setDragOverItem, dragItemCat, setDragItemCat,
    setCurrency,
    grouped, categoryNames, categoryColor, grandTotal, pieSegments,
    handleAddItem, handleUpdateField, handleDeleteItem, handleDeleteCategory, handleRenameCategory, handleAddCategory, handleExportCsv,
    th, td,
  } = useBudgetPanel(tripId, tripMembers)

  // ── Empty State ──────────────────────────────────────────────────────────
  if (!budgetItems || budgetItems.length === 0) {
    return (
      <div style={{ padding: 24, maxWidth: 600, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Calculator size={28} color="#6b7280" />
        </div>
        <h2 style={{ fontSize: 'calc(20px * var(--fs-scale-title, 1))', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>{t('budget.emptyTitle')}</h2>
        <p style={{ fontSize: 'calc(14px * var(--fs-scale-body, 1))', color: 'var(--text-muted)', margin: '0 0 24px', lineHeight: 1.5 }}>{t('budget.emptyText')}</p>
        {canEdit && (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'stretch', maxWidth: 320, margin: '0 auto' }}>
            <input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
              placeholder={t('budget.emptyPlaceholder')}
              style={{ flex: 1, padding: '9px 14px', borderRadius: 10, border: '1px solid var(--border-primary)', fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontFamily: 'inherit', outline: 'none', background: 'var(--bg-input)', color: 'var(--text-primary)', minWidth: 0 }} />
            <button onClick={handleAddCategory} disabled={!newCategoryName.trim()}
              style={{ background: 'var(--accent)', color: 'var(--accent-text)', border: 'none', borderRadius: 10, padding: '0 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: newCategoryName.trim() ? 1 : 0.5, flexShrink: 0 }}>
              <Plus size={16} />
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── Main Layout ──────────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ padding: '24px 28px 0' }} className="max-md:!px-4 max-md:!pt-4">
        <div style={{
          background: 'var(--bg-tertiary)', borderRadius: 18,
          padding: '14px 16px 14px 22px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
        }}>
          <h2 style={{ margin: 0, fontSize: 'calc(18px * var(--fs-scale-subtitle, 1))', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em', flexShrink: 0 }}>
            {t('budget.title')}
          </h2>
          <div className="flex flex-wrap max-md:!w-full max-md:!mt-2" style={{ alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>
            <div className="max-md:!w-full" style={{ width: 150 }}>
              <CustomSelect
                value={currency}
                onChange={setCurrency}
                disabled={!canEdit}
                options={CURRENCIES.map(c => ({ value: c, label: `${c} (${SYMBOLS[c] || c})` }))}
                searchable
              />
            </div>
            {canEdit && (
              <div className="max-md:!w-full" style={{ display: 'flex', gap: 6, width: 260 }}>
                <input
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddCategory() }}
                  placeholder={t('budget.categoryName')}
                  style={{ flex: 1, minWidth: 0, border: '1px solid var(--border-primary)', borderRadius: 10, padding: '9px 14px', fontSize: 'calc(13px * var(--fs-scale-body, 1))', outline: 'none', fontFamily: 'inherit', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                />
                <button onClick={handleAddCategory} disabled={!newCategoryName.trim()}
                  title={t('budget.addCategory')}
                  style={{
                    appearance: 'none', border: 'none', cursor: newCategoryName.trim() ? 'pointer' : 'default', fontFamily: 'inherit',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '9px 14px', borderRadius: 10, fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500,
                    background: 'var(--accent)', color: 'var(--accent-text)', flexShrink: 0,
                    opacity: newCategoryName.trim() ? 1 : 0.4,
                    transition: 'opacity 0.15s ease',
                  }}>
                  <Plus size={14} strokeWidth={2.5} />
                </button>
              </div>
            )}
            <button onClick={handleExportCsv} title={t('budget.exportCsv')}
              style={{
                appearance: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 14px', borderRadius: 10, fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500,
                background: 'var(--accent)', color: 'var(--accent-text)', flexShrink: 0,
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <Download size={14} strokeWidth={2.5} /> <span className="hidden sm:inline">CSV</span>
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, padding: '24px 28px 40px', alignItems: 'flex-start', flexWrap: 'wrap' }} className="max-md:!px-4">
        <div style={{ flex: 1, minWidth: 0 }}>
          {categoryNames.map(cat => (
            <BudgetCategoryTable key={cat} cat={cat} grouped={grouped} categoryColor={categoryColor}
              canEdit={canEdit} editingCat={editingCat} setEditingCat={setEditingCat}
              dragCat={dragCat} setDragCat={setDragCat} dragOverCat={dragOverCat} setDragOverCat={setDragOverCat}
              dragItem={dragItem} setDragItem={setDragItem} dragOverItem={dragOverItem} setDragOverItem={setDragOverItem}
              dragItemCat={dragItemCat} setDragItemCat={setDragItemCat}
              categoryNames={categoryNames} reorderBudgetCategories={reorderBudgetCategories} reorderBudgetItems={reorderBudgetItems}
              handleRenameCategory={handleRenameCategory} handleDeleteCategory={handleDeleteCategory} handleDeleteItem={handleDeleteItem}
              handleUpdateField={handleUpdateField} handleAddItem={handleAddItem}
              tripId={tripId} currency={currency} locale={locale} t={t} fmt={fmt}
              hasMultipleMembers={hasMultipleMembers} tripMembers={tripMembers}
              setBudgetItemMembers={setBudgetItemMembers} toggleBudgetMemberPaid={toggleBudgetMemberPaid}
              th={th} td={td} />
          ))}
        </div>

        <BudgetSummary theme={theme} currency={currency} locale={locale} grandTotal={grandTotal}
          hasMultipleMembers={hasMultipleMembers} budgetItems={budgetItems} settlement={settlement}
          settlementOpen={settlementOpen} setSettlementOpen={setSettlementOpen} pieSegments={pieSegments}
          isDark={isDark} tripId={tripId} t={t} fmt={fmt} />
      </div>
    </div>
  )
}
