import { useCallback, useRef } from 'react'
import { Briefcase, Plus, X } from 'lucide-react'
import type { PackingState } from './usePackingListPanel'
import { bagFillPct, bagTotalWeight, countsTowardsMyLoad, unassignedTotalWeight } from './packingListPanel.helpers'
import { BagCard } from './PackingListPanelBagCard'
import { COMPOSER, composerConfirm, useDismissOnOutside } from './packingPopoverStyles'

const kgOrG = (grams: number) => (grams >= 1000 ? `${(grams / 1000).toFixed(1)} kg` : `${grams} g`)

/**
 * The bags beside the list, as a card like the categories: a tinted head band
 * with the add action, one block per bag between hairlines, what sits in no bag
 * as a quiet last row, and the total in a matching foot band.
 */
export function BagSidebar(S: PackingState) {
  const {
    t, bags, items, tripId, tripMembers, canEdit, currentUserId, handleDeleteBag, handleUpdateBag, handleSetBagMembers,
    showAddBag, setShowAddBag, newBagName, setNewBagName, handleCreateBag, unassignedWeightGrams, serverWeightsFresh,
  } = S
  // The ITEM LISTS still describe what you are carrying — an item someone shared
  // with you stays in your list, but they are the one bringing it (#1767).
  const myItems = items.filter(i => countsTowardsMyLoad(i, currentUserId))
  // The WEIGHTS no longer do: a bag's load is the bag's, whoever packed it (#2191).
  const bagWeightOf = (bag: typeof bags[number]) =>
    bagTotalWeight(bag, myItems.filter(i => i.bag_id === bag.id), serverWeightsFresh)
  // Reference for bags without a limit of their own — computed once instead of per bag.
  const heaviestBagWeight = Math.max(...bags.map(bagWeightOf), 1)
  const unassigned = myItems.filter(i => !i.bag_id)
  const unassignedWeight = unassignedTotalWeight(unassignedWeightGrams, unassigned, serverWeightsFresh)
  // Same rule as the rows above it (#2191).
  const totalWeight = bags.reduce((s, b) => s + bagWeightOf(b), 0) + unassignedWeight
  const hairline = (first: boolean): React.CSSProperties => ({ borderTop: first ? 'none' : '1px solid var(--border-faint)' })
  const composerRef = useRef<HTMLDivElement>(null)
  const closeComposer = useCallback(() => { setShowAddBag(false); setNewBagName('') }, [setShowAddBag, setNewBagName])
  useDismissOnOutside(composerRef, showAddBag, closeComposer)

  return (
    <div className="hidden xl:block" style={{ width: 272, marginLeft: 16, overflowY: 'auto', padding: '10px 0 16px', flexShrink: 0 }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px 9px 14px', background: 'var(--bg-tertiary)', borderRadius: '15px 15px 0 0' }}>
          <Briefcase size={14} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            {t('packing.bags')}
          </span>
          {canEdit && !showAddBag && (
            <button type="button" onClick={() => setShowAddBag(true)} aria-label={t('packing.addBag')} title={t('packing.addBag')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 99, border: '1px solid var(--border-secondary)', background: 'var(--bg-card)', cursor: 'pointer', fontSize: 'calc(11.5px * var(--fs-scale-caption, 1))', fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'inherit' }}>
              <Plus size={12} /> {t('packing.bags')}
            </button>
          )}
        </div>

        {canEdit && showAddBag && (
          <div ref={composerRef} style={{ ...COMPOSER, margin: '10px 10px 0', padding: '4px 4px 4px 10px' }}>
            <span aria-hidden style={{ width: 10, height: 10, borderRadius: '50%', border: '1.5px dashed var(--text-faint)', flexShrink: 0 }} />
            <input autoFocus value={newBagName} onChange={e => setNewBagName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreateBag(); if (e.key === 'Escape') closeComposer() }}
              placeholder={t('packing.bagName')}
              style={{ flex: 1, minWidth: 0, padding: '5px 0', border: 'none', fontSize: 'calc(12.5px * var(--fs-scale-body, 1))', fontWeight: 500, fontFamily: 'inherit', outline: 'none', color: 'var(--text-primary)', background: 'transparent' }} />
            <button type="button" onClick={handleCreateBag} disabled={!newBagName.trim()} aria-label={t('common.add')} style={composerConfirm(!!newBagName.trim())}>
              <Plus size={14} strokeWidth={2.5} />
            </button>
            <button type="button" onClick={closeComposer} aria-label={t('common.cancel')} style={{ width: 26, height: 28, border: 'none', background: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0, color: 'var(--text-faint)' }}>
              <X size={13} />
            </button>
          </div>
        )}

        <div style={{ padding: '0 14px' }}>
          {bags.map((bag, index) => {
            const bagItems = myItems.filter(i => i.bag_id === bag.id)
            const weight = bagWeightOf(bag)
            const pct = bagFillPct(weight, bag.weight_limit_grams, heaviestBagWeight)
            return (
              <div key={bag.id} style={{ ...hairline(index === 0), paddingTop: 12 }}>
                <BagCard bag={bag} bagItems={bagItems} totalWeight={weight} pct={pct} tripId={tripId} tripMembers={tripMembers} canEdit={canEdit} onDelete={() => handleDeleteBag(bag.id)} onUpdate={handleUpdateBag} onSetMembers={handleSetBagMembers} t={t} compact />
              </div>
            )
          })}

          {/* Whatever sits in no bag. Shown whenever there is weight to account
              for, even with no visible items: the total counts it either way (#2191). */}
          {(unassigned.length > 0 || unassignedWeight > 0) && (
            <div style={{ ...hairline(bags.length === 0), display: 'flex', alignItems: 'center', gap: 6, padding: '11px 0' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', border: '1.5px dashed var(--text-faint)', flexShrink: 0 }} />
              <span style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600, color: 'var(--text-muted)' }}>{t('packing.noBag')}</span>
              <span title={`${unassigned.length} ${t('admin.packingTemplates.items')}`} style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 700, padding: '1px 6px', borderRadius: 99, minWidth: 18, textAlign: 'center', background: 'var(--bg-tertiary)', color: 'var(--text-faint)', fontVariantNumeric: 'tabular-nums' }}>{unassigned.length}</span>
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 600, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{kgOrG(unassignedWeight)}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: '0 0 15px 15px', fontSize: 'calc(12.5px * var(--fs-scale-body, 1))', fontWeight: 700, color: 'var(--text-primary)' }}>
          <span>{t('packing.totalWeight')}</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{kgOrG(totalWeight)}</span>
        </div>
      </div>
    </div>
  )
}
