import { useState } from 'react'
import type { PackingState } from './usePackingListPanel'
import { KategorieGruppe } from './PackingListPanelCategoryGroup'
import EmptyState from '../shared/EmptyState'

export function PackingList(S: PackingState) {
  const {
    items, gruppiert, t, tripId, allCategories, handleRenameCategory, handleDeleteCategory, handleDeleteItem,
    handleAddItemToCategory, categoryAssignees, tripMembers, handleSetAssignees,
    bagTrackingEnabled, bags, handleCreateBagByName, canEdit, reorderPackingItems,
    currentUserId, handleSetSharing, handleCloneItem, handleJoinItem, handleLeaveItem, sort, moveCategory,
  } = S
  // Which category is being dragged and which card it is over. Held here, above
  // the cards, because the drag starts in one card and ends in another.
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null)
  const [overCategory, setOverCategory] = useState<string | null>(null)
  const endCategoryDrag = () => { setDraggedCategory(null); setOverCategory(null) }
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0 16px' }}>
      {items.length === 0 ? (
        <EmptyState scene="packing" title={t('packing.emptyTitle')} />
      ) : Object.keys(gruppiert).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-faint)' }}>
          <p style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', margin: 0 }}>{t('packing.emptyFiltered')}</p>
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
              onDeleteItem={handleDeleteItem}
              onAddItem={handleAddItemToCategory}
              assignees={categoryAssignees[kat] || []}
              tripMembers={tripMembers}
              onSetAssignees={handleSetAssignees}
              bagTrackingEnabled={bagTrackingEnabled}
              bags={bags}
              onCreateBag={handleCreateBagByName}
              canEdit={canEdit}
              allItems={items}
              onReorder={(orderedIds) => reorderPackingItems(tripId, orderedIds)}
              reorderable={sort === 'manual'}
              categoryDrag={canEdit ? {
                isDragging: draggedCategory === kat,
                isOver: overCategory === kat && draggedCategory !== null && draggedCategory !== kat,
                onStart: () => { setDraggedCategory(kat); setOverCategory(null) },
                onOver: () => setOverCategory(kat),
                onEnd: endCategoryDrag,
                onDrop: (dragged) => { moveCategory(dragged, kat); endCategoryDrag() },
              } : undefined}
              currentUserId={currentUserId}
              onSetSharing={handleSetSharing}
              onClone={handleCloneItem}
              onJoin={handleJoinItem}
              onLeave={handleLeaveItem}
            />
          ))}
        </div>
      )}
    </div>
  )
}
