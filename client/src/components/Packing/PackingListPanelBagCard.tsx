import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus } from 'lucide-react'
import type { PackingItem, PackingBag } from '../../types'
import type { TripMember } from './usePackingListPanel'
import { PopoverItem } from './PackingPopover'
import { POPOVER, POPOVER_CAPTION, useDismissOnOutside } from './packingPopoverStyles'
import { useAnchoredPosition } from '../../hooks/useAnchoredPosition'
import { useBagCardEditor } from './useBagCardEditor'

interface BagCardProps {
  bag: PackingBag; bagItems: PackingItem[]; totalWeight: number; pct: number; tripId: number
  tripMembers: TripMember[]; canEdit: boolean; onDelete: () => void
  onUpdate: (bagId: number, data: Record<string, any>) => void
  onSetMembers: (bagId: number, userIds: number[]) => void; t: any; compact?: boolean
}

export function BagCard({ bag, bagItems, totalWeight, pct, tripId, tripMembers, canEdit, onDelete, onUpdate, onSetMembers, t, compact }: BagCardProps) {
  const [showUserPicker, setShowUserPicker] = useState(false)
  const membersRef = useRef<HTMLDivElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const closePicker = useCallback(() => setShowUserPicker(false), [])
  useDismissOnOutside(membersRef, showUserPicker, closePicker, pickerRef)
  // The bag sidebar scrolls and would clip the list, so it hangs off the body under the faces.
  const pickerBox = useAnchoredPosition(membersRef, showUserPicker, { estimatedHeight: 260, offset: 6 })
  const {
    editingName, setEditingName, nameVal, setNameVal, saveName, cancelName,
    editingLimit, setEditingLimit, limitVal, setLimitVal, saveLimit, cancelLimit, memberIds, toggleMember,
  } = useBagCardEditor({ bag, onUpdate: data => onUpdate(bag.id, data), onSetMembers: ids => onSetMembers(bag.id, ids), followBag: true })

  const sz = compact ? { dot: 10, name: 12, weight: 11, bar: 6, count: 10, gap: 6, mb: 14, icon: 11, avatar: 18 } : { dot: 12, name: 14, weight: 13, bar: 8, count: 11, gap: 8, mb: 16, icon: 13, avatar: 22 }

  // Three lines, each with one job: who the bag is (name, who carries it, delete),
  // how full it is, and the numbers under the bar (items left, weight and limit right).
  return (
    <div style={{ marginBottom: sz.mb }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: sz.gap }}>
        <span style={{ width: sz.dot, height: sz.dot, borderRadius: '50%', background: bag.color, flexShrink: 0 }} />
        {editingName && canEdit ? (
          <input autoFocus value={nameVal} onChange={e => setNameVal(e.target.value)}
            onBlur={saveName} onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') cancelName() }}
            style={{ flex: 1, fontSize: sz.name, fontWeight: 600, padding: '1px 4px', borderRadius: 4, border: '1px solid var(--border-primary)', outline: 'none', fontFamily: 'inherit', color: 'var(--text-primary)', background: 'transparent' }} />
        ) : (
          <button type="button" disabled={!canEdit} onClick={() => setEditingName(true)}
            style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: sz.name, fontWeight: 700, color: 'var(--text-primary)', cursor: canEdit ? 'text' : 'default', background: 'none', border: 'none', padding: 0, textAlign: 'start', fontFamily: 'inherit' }}>{bag.name}</button>
        )}
        {/* Members */}
        <div ref={membersRef} style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, position: 'relative' }}>
        {(bag.members || []).map(m => {
          const face = m.avatar ? (
            <img src={m.avatar} alt={m.username} style={{ width: sz.avatar, height: sz.avatar, borderRadius: '50%', objectFit: 'cover', border: `1.5px solid ${bag.color}`, boxSizing: 'border-box' }} />
          ) : (
            <span style={{ width: sz.avatar, height: sz.avatar, borderRadius: '50%', background: bag.color + '25', color: bag.color, fontSize: sz.avatar * 0.45, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${bag.color}`, boxSizing: 'border-box' }}>
              {m.username[0].toUpperCase()}
            </span>
          )
          if (!canEdit) return <span key={m.user_id} title={m.username} style={{ display: 'inline-flex' }}>{face}</span>
          return (
            <button type="button" key={m.user_id} title={m.username} aria-label={m.username} onClick={() => toggleMember(m.user_id)}
              style={{ cursor: 'pointer', display: 'inline-flex', background: 'none', border: 'none', padding: 0 }}>
              {face}
            </button>
          )
        })}
        {canEdit && (
          <button type="button" onClick={() => setShowUserPicker(v => !v)} style={{ width: sz.avatar, height: sz.avatar, borderRadius: '50%', border: '1.5px dashed var(--border-primary)', background: 'none', color: 'var(--text-faint)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, boxSizing: 'border-box' }}>
            <Plus size={sz.avatar * 0.5} />
          </button>
        )}
        {showUserPicker && pickerBox && createPortal(
          <div ref={pickerRef} className="trek-menu-enter" style={{
            ...POPOVER, position: 'fixed', zIndex: 'var(--z-toast)', width: 200, overflowY: 'auto',
            top: pickerBox.top, bottom: pickerBox.bottom, maxHeight: pickerBox.maxHeight,
            left: Math.max(8, pickerBox.left + pickerBox.width - 200),
          }}>
            <div style={POPOVER_CAPTION}>{t('packing.assignMembers')}</div>
            {tripMembers.map(m => (
              <PopoverItem key={m.id} label={m.username} active={memberIds.includes(m.id)} onClick={() => toggleMember(m.id)}
                icon={m.avatar ? (
                  <img src={m.avatar} alt="" style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--bg-tertiary)', fontSize: 'calc(9px * var(--fs-scale-caption, 1))', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)' }}>
                    {m.username[0].toUpperCase()}
                  </span>
                )} />
            ))}
            {tripMembers.length === 0 && <div style={{ padding: '8px 10px', fontSize: 'calc(11.5px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)' }}>{t('packing.noMembers')}</div>}
          </div>,
          document.body,
        )}
        </div>
        {canEdit && <button type="button" onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-faint)', display: 'flex' }}><X size={sz.icon} /></button>}
      </div>
      <div style={{ height: sz.bar, marginTop: 9, background: 'var(--bg-tertiary)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 99, background: bag.color, width: `${pct}%`, transition: 'width 0.3s' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 5 }}>
        <span style={{ fontSize: sz.count, color: 'var(--text-faint)' }}>{bagItems.length} {t('admin.packingTemplates.items', { count: bagItems.length })}</span>
        <span style={{ fontSize: sz.weight, color: 'var(--text-muted)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3, fontVariantNumeric: 'tabular-nums' }}>
          {totalWeight >= 1000 ? `${(totalWeight / 1000).toFixed(1)} kg` : `${totalWeight} g`}
          {editingLimit && canEdit ? (
            <>
              <span>/</span>
              <input autoFocus value={limitVal} onChange={e => setLimitVal(e.target.value)}
                onBlur={saveLimit}
                onKeyDown={e => { if (e.key === 'Enter') saveLimit(); if (e.key === 'Escape') cancelLimit() }}
                inputMode="decimal" aria-label={t('packing.bagLimit')} placeholder={t('packing.bagLimit')}
                style={{ width: 42, fontSize: sz.weight, padding: '1px 3px', borderRadius: 4, border: '1px solid var(--border-primary)', outline: 'none', fontFamily: 'inherit', color: 'var(--text-primary)', background: 'transparent' }} />
              <span>kg</span>
            </>
          ) : bag.weight_limit_grams ? (
            <button type="button" disabled={!canEdit} onClick={() => setEditingLimit(true)} title={t('packing.bagLimit')}
              style={{ cursor: canEdit ? 'text' : 'default', background: 'none', border: 'none', padding: 0, fontFamily: 'inherit', fontSize: 'inherit' }}>
              / {(bag.weight_limit_grams / 1000).toFixed(1)} kg
            </button>
          ) : canEdit ? (
            <button type="button" onClick={() => setEditingLimit(true)} title={t('packing.bagLimit')}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text-faint)', fontSize: sz.count, fontFamily: 'inherit', textDecoration: 'underline dotted' }}>
              {t('packing.setBagLimit')}
            </button>
          ) : null}
        </span>
      </div>
    </div>
  )
}
