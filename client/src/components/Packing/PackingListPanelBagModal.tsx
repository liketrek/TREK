import { X, Plus } from 'lucide-react'
import type { PackingState } from './usePackingListPanel'
import { itemWeight } from './packingListPanel.helpers'
import { BagCard } from './PackingListPanelBagCard'

export function BagModal(S: PackingState) {
  const {
    setShowBagModal, t, bags, items, tripId, tripMembers, canEdit, handleDeleteBag, handleUpdateBag, handleSetBagMembers,
    showAddBag, setShowAddBag, newBagName, setNewBagName, handleCreateBag,
  } = S
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, paddingTop: 140, paddingBottom: 'calc(20px + var(--bottom-nav-h))', overflowY: 'auto' }}
      onClick={() => setShowBagModal(false)}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 360, maxHeight: 'calc(100vh - 80px)', overflow: 'auto', padding: 20, boxShadow: '0 16px 48px rgba(0,0,0,0.15)', flexShrink: 0 }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 'calc(16px * var(--fs-scale-subtitle, 1))', fontWeight: 700, color: 'var(--text-primary)' }}>{t('packing.bags')}</h3>
          <button onClick={() => setShowBagModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', display: 'flex' }}><X size={18} /></button>
        </div>

        {bags.map(bag => {
          const bagItems = items.filter(i => i.bag_id === bag.id)
          const totalWeight = bagItems.reduce((sum, i) => sum + itemWeight(i), 0)
          const maxWeight = Math.max(...bags.map(b => items.filter(i => i.bag_id === b.id).reduce((s, i) => s + itemWeight(i), 0)), 1)
          const pct = Math.min(100, Math.round((totalWeight / maxWeight) * 100))
          return (
            <BagCard key={bag.id} bag={bag} bagItems={bagItems} totalWeight={totalWeight} pct={pct} tripId={tripId} tripMembers={tripMembers} canEdit={canEdit} onDelete={() => handleDeleteBag(bag.id)} onUpdate={handleUpdateBag} onSetMembers={handleSetBagMembers} t={t} />
          )
        })}

        {/* Unassigned */}
        {(() => {
          const unassigned = items.filter(i => !i.bag_id)
          const unassignedWeight = unassigned.reduce((s, i) => s + itemWeight(i), 0)
          if (unassigned.length === 0) return null
          return (
            <div style={{ marginBottom: 16, opacity: 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px dashed var(--border-primary)', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 600, color: 'var(--text-faint)' }}>{t('packing.noBag')}</span>
                <span style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', color: 'var(--text-faint)' }}>
                  {unassignedWeight >= 1000 ? `${(unassignedWeight / 1000).toFixed(1)} kg` : `${unassignedWeight} g`}
                </span>
              </div>
              <div style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)' }}>{unassigned.length} {t('admin.packingTemplates.items')}</div>
            </div>
          )
        })()}

        {/* Total */}
        <div style={{ borderTop: '1px solid var(--border-secondary)', paddingTop: 12, marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 700, color: 'var(--text-primary)' }}>
            <span>{t('packing.totalWeight')}</span>
            <span>{(() => { const w = items.reduce((s, i) => s + itemWeight(i), 0); return w >= 1000 ? `${(w / 1000).toFixed(1)} kg` : `${w} g` })()}</span>
          </div>
        </div>

        {/* Add bag */}
        {canEdit && (showAddBag ? (
          <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
            <input autoFocus value={newBagName} onChange={e => setNewBagName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreateBag(); if (e.key === 'Escape') { setShowAddBag(false); setNewBagName('') } }}
              placeholder={t('packing.bagName')}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border-primary)', fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontFamily: 'inherit', outline: 'none' }} />
            <button onClick={handleCreateBag} disabled={!newBagName.trim()}
              style={{ padding: '8px 12px', borderRadius: 10, border: 'none', background: newBagName.trim() ? 'var(--text-primary)' : 'var(--border-primary)', color: 'var(--bg-primary)', cursor: newBagName.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center' }}>
              <Plus size={14} />
            </button>
          </div>
        ) : (
          <button onClick={() => setShowAddBag(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, padding: '9px 14px', borderRadius: 10, border: '1px dashed var(--border-primary)', background: 'none', cursor: 'pointer', fontSize: 'calc(13px * var(--fs-scale-body, 1))', color: 'var(--text-faint)', fontFamily: 'inherit', width: '100%', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-muted)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.color = 'var(--text-faint)' }}>
            <Plus size={14} /> {t('packing.addBag')}
          </button>
        ))}
      </div>
    </div>
  )
}
