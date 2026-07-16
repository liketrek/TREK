import { useState } from 'react'
import { Check, Plus, X } from 'lucide-react'
import type { PackingUpdateBagRequest } from '@trek/shared'
import MSheet from '../../../components/MSheet'
import { FIELD_CLS, FormSheetHeader } from '../sheets/PlSheetChrome'
import { avatarSrc } from '../../../../utils/avatarSrc'
import type { PackingBag, PackingItem, TripMember } from '../../../../types'
import type { TripPlanner } from '../MTripShell'
import { formatWeight, packingItemWeight } from './listsModel'

export interface MBagsSheetProps {
  planner: TripPlanner
  open: boolean
  onClose: () => void
  bags: PackingBag[]
  items: PackingItem[]
  tripMembers: TripMember[]
  canEdit: boolean
  onCreateBag: (name: string) => void
  onUpdateBag: (bagId: number, data: PackingUpdateBagRequest) => void
  onDeleteBag: (bagId: number) => void
  onSetBagMembers: (bagId: number, userIds: number[]) => void
}

/**
 * Bags sheet (spec 03 §4.4 `openBags`): name, weight/limit bar, members,
 * unassigned pile and the grand total. Bag-tracking gate (`bagTrackingEnabled`)
 * is the caller's business — this sheet just renders whatever bags it's given.
 */
export default function MBagsSheet({
  planner, open, onClose, bags, items, tripMembers, canEdit, onCreateBag, onUpdateBag, onDeleteBag, onSetBagMembers,
}: MBagsSheetProps) {
  const { t } = planner
  const [addingBag, setAddingBag] = useState(false)
  const [newBagName, setNewBagName] = useState('')

  const unassigned = items.filter(i => !i.bag_id)
  const unassignedWeight = unassigned.reduce((s, i) => s + packingItemWeight(i), 0)
  const totalWeight = items.reduce((s, i) => s + packingItemWeight(i), 0)

  const submitNewBag = () => {
    if (!newBagName.trim()) return
    onCreateBag(newBagName.trim())
    setNewBagName('')
    setAddingBag(false)
  }

  return (
    <MSheet open={open} onClose={onClose} ariaLabel={t('packing.bags')}>
      <FormSheetHeader title={t('packing.bags')} onClose={onClose} closeLabel={t('common.close')} />

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[6px] pt-1">
        {bags.map(bag => {
          const bagItems = items.filter(i => i.bag_id === bag.id)
          const bagWeight = bagItems.reduce((s, i) => s + packingItemWeight(i), 0)
          const maxWeight = bag.weight_limit_grams
            || Math.max(...bags.map(b => items.filter(i => i.bag_id === b.id).reduce((s, i) => s + packingItemWeight(i), 0)), 1)
          const pct = Math.min(100, Math.round((bagWeight / maxWeight) * 100))
          return (
            <BagRow
              key={bag.id}
              planner={planner}
              bag={bag}
              itemCount={bagItems.length}
              weight={bagWeight}
              pct={pct}
              tripMembers={tripMembers}
              canEdit={canEdit}
              onUpdate={data => onUpdateBag(bag.id, data)}
              onDelete={() => onDeleteBag(bag.id)}
              onSetMembers={userIds => onSetBagMembers(bag.id, userIds)}
            />
          )
        })}

        {unassigned.length > 0 && (
          <div className="mb-4 opacity-60">
            <div className="mb-1 flex items-center gap-[8px]">
              <span className="h-3 w-3 flex-none rounded-full border-2 border-dashed border-[color:var(--m-faint)]" />
              <span className="flex-1 text-[0.8125rem] font-semibold text-m-faint">{t('packing.noBag')}</span>
              <span className="font-geist text-[0.71875rem] text-m-faint">{formatWeight(unassignedWeight)}</span>
            </div>
            <div className="font-geist text-[0.65625rem] text-m-faint">
              {unassigned.length} {t('admin.packingTemplates.items')}
            </div>
          </div>
        )}

        <div className="mt-2 flex items-center justify-between border-t border-[color:var(--m-rowbr)] pt-3 text-[0.8125rem] font-bold text-m-ink">
          <span>{t('packing.totalWeight')}</span>
          <span className="tabular-nums">{formatWeight(totalWeight)}</span>
        </div>

        {canEdit && (
          addingBag ? (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                autoFocus
                value={newBagName}
                onChange={e => setNewBagName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') submitNewBag()
                  if (e.key === 'Escape') { setAddingBag(false); setNewBagName('') }
                }}
                placeholder={t('packing.bagName')}
                className={`${FIELD_CLS} flex-1`}
              />
              <button
                type="button"
                onClick={submitNewBag}
                disabled={!newBagName.trim()}
                aria-label={t('common.add')}
                className="flex h-10 w-10 flex-none items-center justify-center rounded-[12px] bg-m-act text-m-actfg disabled:opacity-40"
              >
                <Check size={15} strokeWidth={2.4} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingBag(true)}
              className="mt-3 flex w-full items-center justify-center gap-[6px] rounded-[13px] border-[1.5px] border-dashed border-[color:var(--m-trackoff)] p-[11px] text-[0.78125rem] font-semibold text-m-muted"
            >
              <Plus size={14} strokeWidth={2.2} />
              {t('packing.addBag')}
            </button>
          )
        )}
      </div>
    </MSheet>
  )
}

function BagRow({ planner, bag, itemCount, weight, pct, tripMembers, canEdit, onUpdate, onDelete, onSetMembers }: {
  planner: TripPlanner
  bag: PackingBag
  itemCount: number
  weight: number
  pct: number
  tripMembers: TripMember[]
  canEdit: boolean
  onUpdate: (data: PackingUpdateBagRequest) => void
  onDelete: () => void
  onSetMembers: (userIds: number[]) => void
}) {
  const { t } = planner
  const [editingName, setEditingName] = useState(false)
  const [nameVal, setNameVal] = useState(bag.name)
  const [showPicker, setShowPicker] = useState(false)

  const memberIds = (bag.members || []).map(m => m.user_id)
  const toggleMember = (userId: number) => onSetMembers(memberIds.includes(userId) ? memberIds.filter(id => id !== userId) : [...memberIds, userId])

  const saveName = () => {
    const trimmed = nameVal.trim()
    if (trimmed && trimmed !== bag.name) onUpdate({ name: trimmed })
    else setNameVal(bag.name)
    setEditingName(false)
  }

  return (
    <div className="mb-4">
      <div className="mb-1 flex items-center gap-[8px]">
        <span className="h-3 w-3 flex-none rounded-full" style={{ background: bag.color }} />
        {editingName && canEdit ? (
          <input
            type="text"
            autoFocus
            value={nameVal}
            onChange={e => setNameVal(e.target.value)}
            onBlur={saveName}
            onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setEditingName(false); setNameVal(bag.name) } }}
            className="min-w-0 flex-1 border-b border-[color:var(--m-rowbr)] bg-transparent text-[0.8125rem] font-semibold text-m-ink outline-none"
          />
        ) : (
          <button type="button" onClick={() => canEdit && setEditingName(true)} className="min-w-0 flex-1 truncate text-left text-[0.8125rem] font-semibold text-m-ink">
            {bag.name}
          </button>
        )}
        <span className="font-geist text-[0.71875rem] font-medium text-m-faint">{formatWeight(weight)}</span>
        {canEdit && (
          <button type="button" onClick={onDelete} aria-label={t('common.delete')} className="flex flex-none items-center text-m-faint">
            <X size={14} strokeWidth={2} />
          </button>
        )}
      </div>

      <div className="relative mb-[6px] flex flex-wrap items-center gap-1">
        {(bag.members || []).map(m => (
          <button
            key={m.user_id}
            type="button"
            title={m.username}
            onClick={() => canEdit && toggleMember(m.user_id)}
            className="h-[22px] w-[22px] flex-none overflow-hidden rounded-full"
            style={{ border: `1.5px solid ${bag.color}` }}
          >
            {m.avatar
              ? <img src={m.avatar} alt="" className="h-full w-full object-cover" />
              : (
                <span
                  className="flex h-full w-full items-center justify-center text-[0.5625rem] font-bold"
                  style={{ background: `${bag.color}25`, color: bag.color }}
                >
                  {m.username[0]?.toUpperCase()}
                </span>
              )}
          </button>
        ))}
        {canEdit && (
          <button
            type="button"
            onClick={() => setShowPicker(v => !v)}
            aria-label={t('common.add')}
            className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[color:var(--m-trackoff)] text-m-faint"
          >
            <Plus size={11} strokeWidth={2.2} />
          </button>
        )}
        {showPicker && (
          <div className="absolute left-0 top-[26px] z-[5] max-h-[180px] w-[190px] overflow-y-auto rounded-[12px] border border-[color:var(--m-rowbr)] bg-m-sheetop p-1 shadow-[0_16px_40px_-16px_rgba(0,0,0,.45)]">
            {tripMembers.length === 0 && (
              <div className="px-[10px] py-2 font-geist text-[0.6875rem] text-m-faint">{t('packing.noMembers')}</div>
            )}
            {tripMembers.map(m => {
              const selected = memberIds.includes(m.id)
              const src = m.avatar_url || avatarSrc(m.avatar)
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMember(m.id)}
                  className="flex w-full items-center gap-[8px] rounded-[8px] px-[8px] py-[6px] text-left"
                >
                  <span className="flex h-5 w-5 flex-none items-center justify-center overflow-hidden rounded-full bg-[color:var(--m-ic)] text-[0.5625rem] font-bold text-m-muted">
                    {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : m.username[0]?.toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[0.75rem] font-semibold text-m-ink">{m.username}</span>
                  {selected && <Check size={12} strokeWidth={2.4} className="flex-none text-m-ink" />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="h-[7px] overflow-hidden rounded-full bg-[color:var(--m-ic)]">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: bag.color }} />
      </div>
      <div className="mt-[3px] font-geist text-[0.65625rem] text-m-faint">{itemCount} {t('admin.packingTemplates.items')}</div>
    </div>
  )
}
