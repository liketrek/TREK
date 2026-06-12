import { Plus } from 'lucide-react'
import type { PackingState } from './usePackingListPanel'
import { itemWeight } from './packingListPanel.helpers'
import { BagCard } from './PackingListPanelBagCard'

export function BagSidebar(S: PackingState) {
  const {
    t, bags, items, tripId, tripMembers, canEdit, handleDeleteBag, handleUpdateBag, handleSetBagMembers,
    showAddBag, setShowAddBag, newBagName, setNewBagName, handleCreateBag,
  } = S
  return (
    <div className="hidden xl:block" style={{ width: 260, borderLeft: '1px solid var(--border-secondary)', overflowY: 'auto', padding: 16, flexShrink: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-faint)', marginBottom: 12 }}>
        {t('packing.bags')}
      </div>

      {bags.map(bag => {
        const bagItems = items.filter(i => i.bag_id === bag.id)
        const totalWeight = bagItems.reduce((sum, i) => sum + itemWeight(i), 0)
        const maxWeight = bag.weight_limit_grams || Math.max(...bags.map(b => items.filter(i => i.bag_id === b.id).reduce((s, i) => s + itemWeight(i), 0)), 1)
        const pct = Math.min(100, Math.round((totalWeight / maxWeight) * 100))
        return (
          <BagCard key={bag.id} bag={bag} bagItems={bagItems} totalWeight={totalWeight} pct={pct} tripId={tripId} tripMembers={tripMembers} canEdit={canEdit} onDelete={() => handleDeleteBag(bag.id)} onUpdate={handleUpdateBag} onSetMembers={handleSetBagMembers} t={t} compact />
        )
      })}

      {/* Unassigned */}
      {(() => {
        const unassigned = items.filter(i => !i.bag_id)
        const unassignedWeight = unassigned.reduce((s, i) => s + itemWeight(i), 0)
        if (unassigned.length === 0) return null
        return (
          <div style={{ marginBottom: 14, opacity: 0.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', border: '2px dashed var(--border-primary)', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--text-faint)' }}>{t('packing.noBag')}</span>
              <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                {unassignedWeight >= 1000 ? `${(unassignedWeight / 1000).toFixed(1)} kg` : `${unassignedWeight} g`}
              </span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>{unassigned.length} {t('admin.packingTemplates.items')}</div>
          </div>
        )
      })()}

      {/* Total */}
      <div style={{ borderTop: '1px solid var(--border-secondary)', paddingTop: 10, marginTop: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
          <span>{t('packing.totalWeight')}</span>
          <span>{(() => { const w = items.reduce((s, i) => s + itemWeight(i), 0); return w >= 1000 ? `${(w / 1000).toFixed(1)} kg` : `${w} g` })()}</span>
        </div>
      </div>

      {/* Add bag */}
      {canEdit && (showAddBag ? (
        <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
          <input autoFocus value={newBagName} onChange={e => setNewBagName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreateBag(); if (e.key === 'Escape') { setShowAddBag(false); setNewBagName('') } }}
            placeholder={t('packing.bagName')}
            style={{ flex: 1, padding: '5px 8px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 11, fontFamily: 'inherit', outline: 'none' }} />
          <button onClick={handleCreateBag} style={{ padding: '4px 8px', borderRadius: 8, border: 'none', background: 'var(--text-primary)', color: 'var(--bg-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Plus size={12} />
          </button>
        </div>
      ) : (
        <button onClick={() => setShowAddBag(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12, padding: '5px 8px', borderRadius: 8, border: '1px dashed var(--border-primary)', background: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--text-faint)', fontFamily: 'inherit', width: '100%' }}>
          <Plus size={11} /> {t('packing.addBag')}
        </button>
      ))}
    </div>
  )
}
