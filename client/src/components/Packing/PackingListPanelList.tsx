import { Luggage } from 'lucide-react'
import type { PackingState } from './usePackingListPanel'
import { KategorieGruppe } from './PackingListPanelCategoryGroup'

export function PackingList(S: PackingState) {
  const {
    items, gruppiert, t, tripId, allCategories, handleRenameCategory, handleDeleteCategory,
    handleAddItemToCategory, categoryAssignees, tripMembers, handleSetAssignees,
    bagTrackingEnabled, bags, handleCreateBagByName, canEdit,
  } = S
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0 16px' }}>
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Luggage size={40} style={{ color: 'var(--text-faint)', display: 'block', margin: '0 auto 10px' }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 4px' }}>{t('packing.emptyTitle')}</p>
          <p style={{ fontSize: 13, color: 'var(--text-faint)', margin: 0 }}>{t('packing.emptyHint')}</p>
        </div>
      ) : Object.keys(gruppiert).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-faint)' }}>
          <p style={{ fontSize: 13, margin: 0 }}>{t('packing.emptyFiltered')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {Object.entries(gruppiert).map(([kat, katItems]) => (
            <KategorieGruppe
              key={kat}
              kategorie={kat}
              items={katItems}
              tripId={tripId}
              allCategories={allCategories}
              onRename={handleRenameCategory}
              onDeleteAll={handleDeleteCategory}
              onAddItem={handleAddItemToCategory}
              assignees={categoryAssignees[kat] || []}
              tripMembers={tripMembers}
              onSetAssignees={handleSetAssignees}
              bagTrackingEnabled={bagTrackingEnabled}
              bags={bags}
              onCreateBag={handleCreateBagByName}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </div>
  )
}
