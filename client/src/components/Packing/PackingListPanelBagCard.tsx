import { useState, useEffect } from 'react'
import { X, Plus, Check } from 'lucide-react'
import type { PackingItem, PackingBag } from '../../types'
import type { TripMember } from './usePackingListPanel'

interface BagCardProps {
  bag: PackingBag; bagItems: PackingItem[]; totalWeight: number; pct: number; tripId: number
  tripMembers: TripMember[]; canEdit: boolean; onDelete: () => void
  onUpdate: (bagId: number, data: Record<string, any>) => void
  onSetMembers: (bagId: number, userIds: number[]) => void; t: any; compact?: boolean
}

export function BagCard({ bag, bagItems, totalWeight, pct, tripId, tripMembers, canEdit, onDelete, onUpdate, onSetMembers, t, compact }: BagCardProps) {
  const [editingName, setEditingName] = useState(false)
  const [nameVal, setNameVal] = useState(bag.name)
  const [showUserPicker, setShowUserPicker] = useState(false)
  useEffect(() => setNameVal(bag.name), [bag.name])

  const saveName = () => {
    if (nameVal.trim() && nameVal.trim() !== bag.name) onUpdate(bag.id, { name: nameVal.trim() })
    setEditingName(false)
  }

  const memberIds = (bag.members || []).map(m => m.user_id)
  const toggleMember = (userId: number) => {
    const next = memberIds.includes(userId) ? memberIds.filter(id => id !== userId) : [...memberIds, userId]
    onSetMembers(bag.id, next)
  }

  const sz = compact ? { dot: 10, name: 12, weight: 11, bar: 6, count: 10, gap: 6, mb: 14, icon: 11, avatar: 18 } : { dot: 12, name: 14, weight: 13, bar: 8, count: 11, gap: 8, mb: 16, icon: 13, avatar: 22 }

  return (
    <div style={{ marginBottom: sz.mb }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: sz.gap, marginBottom: 4 }}>
        <span style={{ width: sz.dot, height: sz.dot, borderRadius: '50%', background: bag.color, flexShrink: 0 }} />
        {editingName && canEdit ? (
          <input autoFocus value={nameVal} onChange={e => setNameVal(e.target.value)}
            onBlur={saveName} onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setEditingName(false); setNameVal(bag.name) } }}
            style={{ flex: 1, fontSize: sz.name, fontWeight: 600, padding: '1px 4px', borderRadius: 4, border: '1px solid var(--border-primary)', outline: 'none', fontFamily: 'inherit', color: 'var(--text-primary)', background: 'transparent' }} />
        ) : (
          <span onClick={() => canEdit && setEditingName(true)} style={{ flex: 1, fontSize: sz.name, fontWeight: 600, color: compact ? 'var(--text-secondary)' : 'var(--text-primary)', cursor: canEdit ? 'text' : 'default' }}>{bag.name}</span>
        )}
        <span style={{ fontSize: sz.weight, color: 'var(--text-faint)', fontWeight: 500 }}>
          {totalWeight >= 1000 ? `${(totalWeight / 1000).toFixed(1)} kg` : `${totalWeight} g`}
        </span>
        {canEdit && <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-faint)', display: 'flex' }}><X size={sz.icon} /></button>}
      </div>
      {/* Members */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4, flexWrap: 'wrap', position: 'relative' }}>
        {(bag.members || []).map(m => (
          <span key={m.user_id} title={m.username} onClick={() => canEdit && toggleMember(m.user_id)} style={{ cursor: canEdit ? 'pointer' : 'default', display: 'inline-flex' }}>
            {m.avatar ? (
              <img src={m.avatar} alt={m.username} style={{ width: sz.avatar, height: sz.avatar, borderRadius: '50%', objectFit: 'cover', border: `1.5px solid ${bag.color}`, boxSizing: 'border-box' }} />
            ) : (
              <span style={{ width: sz.avatar, height: sz.avatar, borderRadius: '50%', background: bag.color + '25', color: bag.color, fontSize: sz.avatar * 0.45, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${bag.color}`, boxSizing: 'border-box' }}>
                {m.username[0].toUpperCase()}
              </span>
            )}
          </span>
        ))}
        {canEdit && (
          <button onClick={() => setShowUserPicker(v => !v)} style={{ width: sz.avatar, height: sz.avatar, borderRadius: '50%', border: '1.5px dashed var(--border-primary)', background: 'none', color: 'var(--text-faint)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, boxSizing: 'border-box' }}>
            <Plus size={sz.avatar * 0.5} />
          </button>
        )}
        {showUserPicker && (
          <div style={{ position: 'absolute', left: 0, top: '100%', marginTop: 4, zIndex: 50, background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: 4, minWidth: 160 }}>
            {tripMembers.map(m => {
              const isSelected = memberIds.includes(m.id)
              return (
                <button key={m.id} onClick={() => { toggleMember(m.id); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 10px', borderRadius: 6, border: 'none', background: isSelected ? 'var(--bg-tertiary)' : 'transparent', cursor: 'pointer', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: 'var(--text-primary)', fontFamily: 'inherit' }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-secondary)' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}>
                  {m.avatar ? (
                    <img src={m.avatar} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--bg-tertiary)', fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)' }}>
                      {m.username[0].toUpperCase()}
                    </span>
                  )}
                  <span style={{ flex: 1, fontWeight: isSelected ? 600 : 400 }}>{m.username}</span>
                  {isSelected && <Check size={12} style={{ color: '#10b981' }} />}
                </button>
              )
            })}
            {tripMembers.length === 0 && <div style={{ padding: '8px 10px', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)' }}>{t('packing.noMembers')}</div>}
            <div style={{ borderTop: '1px solid var(--border-secondary)', marginTop: 4, paddingTop: 4 }}>
              <button onClick={() => setShowUserPicker(false)} style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)', fontFamily: 'inherit', textAlign: 'center' }}>
                {t('common.close')}
              </button>
            </div>
          </div>
        )}
      </div>
      <div style={{ height: sz.bar, background: 'var(--bg-tertiary)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 99, background: bag.color, width: `${pct}%`, transition: 'width 0.3s' }} />
      </div>
      <div style={{ fontSize: sz.count, color: 'var(--text-faint)', marginTop: 2 }}>{bagItems.length} {t('admin.packingTemplates.items')}</div>
    </div>
  )
}
