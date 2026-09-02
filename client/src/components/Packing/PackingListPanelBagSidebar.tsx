import { Plus } from 'lucide-react'
import type { PackingState } from './usePackingListPanel'
import { bagFillPct, bagTotalWeight, countsTowardsMyLoad, unassignedTotalWeight } from './packingListPanel.helpers'
import { BagCard } from './PackingListPanelBagCard'

export function BagSidebar(S: PackingState) {
  const {
    t, bags, items, tripId, tripMembers, canEdit, currentUserId, handleDeleteBag, handleUpdateBag, handleSetBagMembers,
    showAddBag, setShowAddBag, newBagName, setNewBagName, handleCreateBag, unassignedWeightGrams,
  } = S
  // The ITEM LISTS still describe what you are carrying — an item someone shared
  // with you stays in your list, but they are the one bringing it (#1767).
  const myItems = items.filter(i => countsTowardsMyLoad(i, currentUserId))
  // The WEIGHTS no longer do: a bag's load is the bag's, whoever packed it (#2191).
  const bagWeightOf = (bag: typeof bags[number]) =>
    bagTotalWeight(bag, myItems.filter(i => i.bag_id === bag.id))
  // Reference for bags without a limit of their own — computed once instead of per bag.
  const heaviestBagWeight = Math.max(...bags.map(bagWeightOf), 1)
  return (
    <div className="hidden xl:block" style={{ width: 260, marginLeft: 16, borderLeft: '1px solid var(--border-secondary)', overflowY: 'auto', padding: 16, flexShrink: 0 }}>
      <div style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-faint)', marginBottom: 12 }}>
        {t('packing.bags')}
      </div>

      {bags.map(bag => {
        const bagItems = myItems.filter(i => i.bag_id === bag.id)
        const totalWeight = bagWeightOf(bag)
        const pct = bagFillPct(totalWeight, bag.weight_limit_grams, heaviestBagWeight)
        return (
          <BagCard key={bag.id} bag={bag} bagItems={bagItems} totalWeight={totalWeight} pct={pct} tripId={tripId} tripMembers={tripMembers} canEdit={canEdit} onDelete={() => handleDeleteBag(bag.id)} onUpdate={handleUpdateBag} onSetMembers={handleSetBagMembers} t={t} compact />
        )
      })}

      {/* Unassigned */}
      {(() => {
        const unassigned = myItems.filter(i => !i.bag_id)
        const unassignedWeight = unassignedTotalWeight(unassignedWeightGrams, unassigned)
        if (unassigned.length === 0) return null
        return (
          <div style={{ marginBottom: 14, opacity: 0.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', border: '2px dashed var(--border-primary)', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600, color: 'var(--text-faint)' }}>{t('packing.noBag')}</span>
              <span style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)' }}>
                {unassignedWeight >= 1000 ? `${(unassignedWeight / 1000).toFixed(1)} kg` : `${unassignedWeight} g`}
              </span>
            </div>
            <div style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)' }}>{unassigned.length} {t('admin.packingTemplates.items')}</div>
          </div>
        )
      })()}

      {/* Total */}
      <div style={{ borderTop: '1px solid var(--border-secondary)', paddingTop: 10, marginTop: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 700, color: 'var(--text-primary)' }}>
          <span>{t('packing.totalWeight')}</span>
          <span>{(() => {
            // Same rule as the rows above it (#2191).
            const w = bags.reduce((s, b) => s + bagWeightOf(b), 0)
              + unassignedTotalWeight(unassignedWeightGrams, myItems.filter(i => !i.bag_id))
            return w >= 1000 ? `${(w / 1000).toFixed(1)} kg` : `${w} g`
          })()}</span>
        </div>
      </div>

      {/* Add bag */}
      {canEdit && (showAddBag ? (
        <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
          <input autoFocus value={newBagName} onChange={e => setNewBagName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreateBag(); if (e.key === 'Escape') { setShowAddBag(false); setNewBagName('') } }}
            placeholder={t('packing.bagName')}
            style={{ flex: 1, padding: '5px 8px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontFamily: 'inherit', outline: 'none' }} />
          <button type="button" onClick={handleCreateBag} style={{ padding: '4px 8px', borderRadius: 8, border: 'none', background: 'var(--text-primary)', color: 'var(--bg-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Plus size={12} />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setShowAddBag(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12, padding: '5px 8px', borderRadius: 8, border: '1px dashed var(--border-primary)', background: 'none', cursor: 'pointer', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)', fontFamily: 'inherit', width: '100%' }}>
          <Plus size={11} /> {t('packing.addBag')}
        </button>
      ))}
    </div>
  )
}
