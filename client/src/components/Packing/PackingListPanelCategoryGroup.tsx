import React, { useState, useRef, useEffect } from 'react'
import { useTripStore } from '../../store/tripStore'
import { useToast } from '../shared/Toast'
import { useTranslation } from '../../i18n'
import {
  Trash2, Plus, ChevronDown, ChevronRight,
  X, Pencil, Check, MoreHorizontal, CheckCheck, RotateCcw, UserPlus,
} from 'lucide-react'
import type { PackingItem, PackingBag } from '../../types'
import { katColor } from './packingListPanel.helpers'
import type { TripMember, CategoryAssignee } from './usePackingListPanel'
import { ArtikelZeile } from './PackingListPanelItemRow'
import GuestBadge from '../shared/GuestBadge'

interface KategorieGruppeProps {
  kategorie: string
  items: PackingItem[]
  tripId: number
  allCategories: string[]
  onRename: (oldName: string, newName: string) => Promise<void>
  onDeleteAll: (items: PackingItem[]) => Promise<void>
  onDeleteItem: (item: PackingItem) => Promise<void>
  onAddItem: (category: string, name: string) => Promise<void>
  assignees: CategoryAssignee[]
  tripMembers: TripMember[]
  onSetAssignees: (category: string, userIds: number[]) => Promise<void>
  bagTrackingEnabled?: boolean
  bags?: PackingBag[]
  onCreateBag: (name: string) => Promise<PackingBag | undefined>
  canEdit?: boolean
  // Drag-to-reorder (#969): the full ordered item list + a persist callback. The
  // order is global, so a within-category drag is mapped back onto the full list.
  allItems: PackingItem[]
  onReorder: (orderedIds: number[]) => void
  // Three-tier sharing (#858) — threaded down to each item's share control.
  currentUserId?: number
  onSetSharing?: (id: number, visibility: 'common' | 'personal' | 'shared', recipientIds: number[]) => void
  onClone?: (id: number) => void
  onJoin?: (id: number) => void
  onLeave?: (id: number, userId: number) => void
}

export function KategorieGruppe({ kategorie, items, tripId, allCategories, onRename, onDeleteAll, onDeleteItem, onAddItem, assignees, tripMembers, onSetAssignees, bagTrackingEnabled, bags, onCreateBag, canEdit = true, allItems, onReorder, currentUserId, onSetSharing, onClone, onJoin, onLeave }: KategorieGruppeProps) {
  const [offen, setOffen] = useState(true)
  const [dragId, setDragId] = useState<number | null>(null)
  const [overId, setOverId] = useState<number | null>(null)

  const handleReorderDrop = (targetId: number) => {
    const from = dragId
    setDragId(null); setOverId(null)
    if (from == null || from === targetId) return
    const catOrder = items.map(i => i.id)
    const fi = catOrder.indexOf(from)
    const ti = catOrder.indexOf(targetId)
    if (fi < 0 || ti < 0) return
    catOrder.splice(fi, 1)
    catOrder.splice(ti, 0, from)
    // Slot the reordered category ids back into the positions this category's
    // items occupy in the global list, leaving every other category untouched.
    const catIds = new Set(items.map(i => i.id))
    let ci = 0
    const globalIds = allItems.map(i => (catIds.has(i.id) ? catOrder[ci++] : i.id))
    onReorder(globalIds)
  }
  const [editingName, setEditingName] = useState(false)
  const [editKatName, setEditKatName] = useState(kategorie)
  const [showMenu, setShowMenu] = useState(false)
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const addItemRef = useRef<HTMLInputElement>(null)
  const menuBtnRef = useRef<HTMLButtonElement>(null)
  const assigneeDropdownRef = useRef<HTMLDivElement>(null)
  const { togglePackingItem } = useTripStore()
  const toast = useToast()
  const { t } = useTranslation()
  useEffect(() => {
    if (!showAssigneeDropdown) return
    const handleClickOutside = (e: MouseEvent) => {
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(e.target as Node)) {
        setShowAssigneeDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showAssigneeDropdown])

  const abgehakt = items.filter(i => i.checked).length
  const alleAbgehakt = abgehakt === items.length
  const dot = katColor(kategorie, allCategories)

  const handleSaveKatName = async () => {
    const neu = editKatName.trim()
    if (!neu || neu === kategorie) { setEditingName(false); setEditKatName(kategorie); return }
    try { await onRename(kategorie, neu); setEditingName(false) }
    catch { toast.error(t('packing.toast.renameError')) }
  }

  const handleCheckAll = async () => {
    try {
      for (const item of Array.from(items)) {
        if (!item.checked) await togglePackingItem(tripId, item.id, true)
      }
    } catch { toast.error(t('packing.toast.saveError')) }
  }
  const handleUncheckAll = async () => {
    try {
      for (const item of Array.from(items)) {
        if (item.checked) await togglePackingItem(tripId, item.id, false)
      }
    } catch { toast.error(t('packing.toast.saveError')) }
  }
  const handleDeleteAll = async () => {
    await onDeleteAll(items)
    setShowMenu(false)
  }

  return (
    <div style={{ marginBottom: 6, background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-secondary)', overflow: 'visible' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: offen ? '1px solid var(--border-secondary)' : 'none' }}>
        <button onClick={() => setOffen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--text-faint)', flexShrink: 0 }}>
          {offen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>

        <span style={{ width: 10, height: 10, borderRadius: '50%', background: dot, flexShrink: 0 }} />

        {editingName && canEdit ? (
          <input
            autoFocus value={editKatName}
            onChange={e => setEditKatName(e.target.value)}
            onBlur={handleSaveKatName}
            onKeyDown={e => { if (e.key === 'Enter') handleSaveKatName(); if (e.key === 'Escape') { setEditingName(false); setEditKatName(kategorie) } }}
            style={{ flex: 1, fontSize: 'calc(12.5px * var(--fs-scale-body, 1))', fontWeight: 600, border: 'none', borderBottom: '2px solid var(--text-primary)', outline: 'none', background: 'transparent', fontFamily: 'inherit', color: 'var(--text-primary)', padding: '0 2px' }}
          />
        ) : (
          <span style={{ fontSize: 'calc(12.5px * var(--fs-scale-body, 1))', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {kategorie}
          </span>
        )}

        {/* Assignee chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1, minWidth: 0, marginLeft: 4 }}>
          {assignees.map(a => (
            <div key={a.user_id} style={{ position: 'relative' }}
              onClick={e => { e.stopPropagation(); if (canEdit) onSetAssignees(kategorie, assignees.filter(x => x.user_id !== a.user_id).map(x => x.user_id)) }}
            >
              <div className="assignee-chip"
                style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0, cursor: canEdit ? 'pointer' : 'default',
                  background: `hsl(${a.username.charCodeAt(0) * 37 % 360}, 55%, 55%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 700, color: 'white', textTransform: 'uppercase',
                  border: '2px solid var(--bg-card)', transition: 'opacity 0.15s',
                }}
              >
                {a.username[0]}
              </div>
              <div className="assignee-tooltip" style={{
                position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                marginTop: 6, padding: '3px 8px', borderRadius: 6, zIndex: 60,
                background: 'var(--text-primary)', color: 'var(--bg-primary)',
                fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 600, whiteSpace: 'nowrap',
                pointerEvents: 'none', opacity: 0, transition: 'opacity 0.15s',
              }}>
                {a.username}
              </div>
            </div>
          ))}
          {canEdit && (
          <div ref={assigneeDropdownRef} style={{ position: 'relative' }}>
            <button onClick={e => { e.stopPropagation(); setShowAssigneeDropdown(v => !v) }}
              style={{
                width: 20, height: 20, borderRadius: '50%', border: '1.5px dashed var(--border-primary)',
                background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-faint)', flexShrink: 0, padding: 0, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-muted)'; e.currentTarget.style.color = 'var(--text-muted)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.color = 'var(--text-faint)' }}
            >
              <UserPlus size={10} />
            </button>
            {showAssigneeDropdown && (
              <div style={{
                position: 'absolute', left: 0, top: '100%', marginTop: 4, zIndex: 50,
                background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 10,
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)', padding: 4, minWidth: 160,
              }}>
                {tripMembers.map(m => {
                  const isAssigned = assignees.some(a => a.user_id === m.id)
                  return (
                    <button key={m.id} onClick={e => {
                      e.stopPropagation()
                      const newIds = isAssigned
                        ? assignees.filter(a => a.user_id !== m.id).map(a => a.user_id)
                        : [...assignees.map(a => a.user_id), m.id]
                      onSetAssignees(kategorie, newIds)
                    }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                        padding: '6px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: isAssigned ? 'var(--bg-hover)' : 'transparent',
                        fontFamily: 'inherit', fontSize: 'calc(12px * var(--fs-scale-body, 1))', color: 'var(--text-primary)',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { if (!isAssigned) e.currentTarget.style.background = 'var(--bg-tertiary)' }}
                      onMouseLeave={e => { if (!isAssigned) e.currentTarget.style.background = 'transparent' }}
                    >
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        background: `hsl(${m.username.charCodeAt(0) * 37 % 360}, 55%, 55%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 700, color: 'white', textTransform: 'uppercase',
                      }}>
                        {m.username[0]}
                      </div>
                      <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.username}</span>
                        {m.is_guest && <GuestBadge size="xs" />}
                      </span>
                      {isAssigned && <Check size={12} className="text-content-muted" />}
                    </button>
                  )
                })}
                {tripMembers.length === 0 && (
                  <div style={{ padding: '8px 10px', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)' }}>{t('packing.noMembers')}</div>
                )}
              </div>
            )}
          </div>
          )}
        </div>

        <span style={{
          fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 600, padding: '1px 8px', borderRadius: 99,
          background: alleAbgehakt ? 'rgba(22,163,74,0.12)' : 'var(--bg-tertiary)',
          color: alleAbgehakt ? '#16a34a' : 'var(--text-muted)',
        }}>
          {abgehakt}/{items.length}
        </span>

        <div style={{ position: 'relative' }}>
          <button ref={menuBtnRef} onClick={() => setShowMenu(m => !m)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 6, display: 'flex', color: 'var(--text-faint)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
            <MoreHorizontal size={15} />
          </button>
          {showMenu && (() => {
            const rect = menuBtnRef.current?.getBoundingClientRect();
            return (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowMenu(false)} />
              <div style={{ position: 'fixed', right: rect ? window.innerWidth - rect.right : 0, top: rect ? rect.bottom + 4 : 0, zIndex: 100, background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', padding: 4, minWidth: 170 }}>
                {canEdit && <MenuItem icon={<Pencil size={13} />} label={t('packing.menuRename')} onClick={() => { setEditingName(true); setShowMenu(false) }} />}
                <MenuItem icon={<CheckCheck size={13} />} label={t('packing.menuCheckAll')} onClick={() => { handleCheckAll(); setShowMenu(false) }} />
                <MenuItem icon={<RotateCcw size={13} />} label={t('packing.menuUncheckAll')} onClick={() => { handleUncheckAll(); setShowMenu(false) }} />
                {canEdit && <>
                <div style={{ height: 1, background: 'var(--bg-tertiary)', margin: '4px 0' }} />
                <MenuItem icon={<Trash2 size={13} />} label={t('packing.menuDeleteCat')} danger onClick={handleDeleteAll} />
                </>}
              </div>
            </>
            );
          })()}
        </div>
      </div>

      {offen && (
        <div style={{ padding: '4px 4px 6px' }}>
          {items.map(item => (
            <ArtikelZeile key={item.id} item={item} tripId={tripId} categories={allCategories} onCategoryChange={() => {}} onDelete={onDeleteItem} bagTrackingEnabled={bagTrackingEnabled} bags={bags} onCreateBag={onCreateBag} canEdit={canEdit}
              tripMembers={tripMembers} currentUserId={currentUserId} onSetSharing={onSetSharing} onClone={onClone} onJoin={onJoin} onLeave={onLeave}
              drag={canEdit ? {
                isDragging: dragId === item.id,
                isOver: overId === item.id && dragId !== null && dragId !== item.id,
                onStart: (id) => { setDragId(id); setOverId(null) },
                onOver: (id) => setOverId(id),
                onEnd: () => { setDragId(null); setOverId(null) },
                onDrop: handleReorderDrop,
              } : undefined} />
          ))}
          {/* Inline add item */}
          {canEdit && (showAddItem ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px' }}>
              <input
                ref={addItemRef}
                autoFocus
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newItemName.trim()) {
                    onAddItem(kategorie, newItemName.trim())
                    setNewItemName('')
                    setTimeout(() => addItemRef.current?.focus(), 30)
                  }
                  if (e.key === 'Escape') { setShowAddItem(false); setNewItemName('') }
                }}
                placeholder={t('packing.addItemPlaceholder')}
                style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 'calc(12.5px * var(--fs-scale-body, 1))', fontFamily: 'inherit', outline: 'none', color: 'var(--text-primary)', background: 'var(--bg-input)' }}
              />
              <button onClick={() => { if (newItemName.trim()) { onAddItem(kategorie, newItemName.trim()); setNewItemName(''); setTimeout(() => addItemRef.current?.focus(), 30) } }}
                disabled={!newItemName.trim()}
                style={{ padding: '5px 8px', borderRadius: 8, border: 'none', background: newItemName.trim() ? 'var(--text-primary)' : 'var(--border-primary)', color: 'var(--bg-primary)', cursor: newItemName.trim() ? 'pointer' : 'default', display: 'flex' }}>
                <Plus size={14} />
              </button>
              <button onClick={() => { setShowAddItem(false); setNewItemName('') }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: 'var(--text-faint)' }}>
                <X size={14} />
              </button>
            </div>
          ) : (
            <button onClick={() => { setShowAddItem(true); setTimeout(() => addItemRef.current?.focus(), 30) }}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', margin: '2px 4px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontSize: 'calc(12px * var(--fs-scale-body, 1))', color: 'var(--text-faint)', fontFamily: 'inherit' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
              <Plus size={12} /> {t('packing.addItem')}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface MenuItemProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}

function MenuItem({ icon, label, onClick, danger = false }: MenuItemProps) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 8, width: '100%',
      padding: '7px 10px', background: 'none', border: 'none', cursor: 'pointer',
      fontSize: 'calc(12.5px * var(--fs-scale-body, 1))', fontFamily: 'inherit', borderRadius: 7, textAlign: 'left',
      color: danger ? '#ef4444' : 'var(--text-secondary)',
    }}
      onMouseEnter={e => e.currentTarget.style.background = danger ? '#fef2f2' : 'var(--bg-tertiary)'}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}
    >
      {icon}{label}
    </button>
  )
}
