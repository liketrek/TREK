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
import { PopoverItem } from './PackingPopover'
import { COMPOSER, POPOVER, POPOVER_DIVIDER, composerConfirm } from './packingPopoverStyles'
import { usePluginViewContributions, PluginCardFooter } from '../Plugins/PluginContributions'
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
  const contribFor = usePluginViewContributions('packing', tripId)

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

  // togglePackingItem rolls its own optimistic update back and reports the
  // failure itself, so the bulk actions just drive it item by item. They go out
  // together: serialised, a long list costs one round trip per item.
  const handleCheckAll = async () => {
    await Promise.all(items.filter(i => !i.checked).map(i => togglePackingItem(tripId, i.id, true)))
  }
  const handleUncheckAll = async () => {
    await Promise.all(items.filter(i => i.checked).map(i => togglePackingItem(tripId, i.id, false)))
  }
  const handleDeleteAll = async () => {
    await onDeleteAll(items)
    setShowMenu(false)
  }

  return (
    // Shaped after the phone's category card: a tinted head band carrying the
    // name as written, the count, and the fold arrow on the far right.
    <div style={{ marginBottom: 6, background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-secondary)', overflow: 'visible' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 12px 11px 14px', background: 'var(--bg-tertiary)', borderRadius: offen ? '15px 15px 0 0' : 15 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: dot, flexShrink: 0 }} />

        {editingName && canEdit ? (
          <input
            autoFocus value={editKatName}
            onChange={e => setEditKatName(e.target.value)}
            onBlur={handleSaveKatName}
            onKeyDown={e => { if (e.key === 'Enter') handleSaveKatName(); if (e.key === 'Escape') { setEditingName(false); setEditKatName(kategorie) } }}
            style={{ flex: 1, fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 700, border: 'none', borderBottom: '2px solid var(--text-primary)', outline: 'none', background: 'transparent', fontFamily: 'inherit', color: 'var(--text-primary)', padding: '0 2px' }}
          />
        ) : (
          <span style={{ fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
            {kategorie}
          </span>
        )}

        {/* Assignee chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1, minWidth: 0, marginLeft: 4 }}>
          {assignees.map(a => {
            // The chip is only ever clickable for an editor, so read-only members
            // get the plain div back rather than a focusable stop that does nothing.
            const chip = (
              <>
                <div className="assignee-chip"
                  style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0, cursor: canEdit ? 'pointer' : 'default',
                    background: `hsl(${(a.username.codePointAt(0) ?? 0) * 37 % 360}, 55%, 55%)`,
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
              </>
            )
            if (!canEdit) return <div key={a.user_id} style={{ position: 'relative' }}>{chip}</div>
            return (
              <button type="button" key={a.user_id}
                style={{ position: 'relative', background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}
                onClick={e => { e.stopPropagation(); onSetAssignees(kategorie, assignees.filter(x => x.user_id !== a.user_id).map(x => x.user_id)) }}
              >
                {chip}
              </button>
            )
          })}
          {canEdit && (
          <div ref={assigneeDropdownRef} style={{ position: 'relative' }}>
            <button type="button" onClick={e => { e.stopPropagation(); setShowAssigneeDropdown(v => !v) }}
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
              <div className="trek-menu-enter" style={{ ...POPOVER, position: 'absolute', left: 0, top: '100%', marginTop: 6, zIndex: 50, minWidth: 190 }}>
                {tripMembers.map(m => {
                  const isAssigned = assignees.some(a => a.user_id === m.id)
                  return (
                    <button type="button" key={m.id} onClick={e => {
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
                        background: `hsl(${(m.username.codePointAt(0) ?? 0) * 37 % 360}, 55%, 55%)`,
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
          fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 700, padding: '2px 8px', borderRadius: 99,
          fontVariantNumeric: 'tabular-nums',
          background: alleAbgehakt ? 'rgba(22,163,74,0.12)' : 'var(--bg-card)',
          color: alleAbgehakt ? '#16a34a' : 'var(--text-muted)',
        }}>
          {abgehakt}/{items.length}
        </span>

        <div style={{ position: 'relative' }}>
          <button type="button" ref={menuBtnRef} onClick={() => setShowMenu(m => !m)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 6, display: 'flex', color: 'var(--text-faint)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
            <MoreHorizontal size={15} />
          </button>
          {showMenu && (() => {
            const rect = menuBtnRef.current?.getBoundingClientRect();
            return (
            <>
              <div role="presentation" style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowMenu(false)} />
              <div className="trek-menu-enter" style={{ ...POPOVER, position: 'fixed', right: rect ? window.innerWidth - rect.right : 0, top: rect ? rect.bottom + 6 : 0, zIndex: 100, minWidth: 200 }}>
                {canEdit && <PopoverItem icon={<Pencil size={13} />} label={t('packing.menuRename')} onClick={() => { setEditingName(true); setShowMenu(false) }} />}
                <PopoverItem icon={<CheckCheck size={13} />} label={t('packing.menuCheckAll')} onClick={() => { handleCheckAll(); setShowMenu(false) }} />
                <PopoverItem icon={<RotateCcw size={13} />} label={t('packing.menuUncheckAll')} onClick={() => { handleUncheckAll(); setShowMenu(false) }} />
                {canEdit && <>
                <div style={POPOVER_DIVIDER} />
                <PopoverItem icon={<Trash2 size={13} />} label={t('packing.menuDeleteCat')} danger onClick={handleDeleteAll} />
                </>}
              </div>
            </>
            );
          })()}
        </div>

        <button type="button" onClick={() => setOffen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--text-faint)', flexShrink: 0 }}>
          {offen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>
      </div>

      {offen && (
        <div style={{ padding: '4px 4px 6px' }}>
          {items.map((item, index) => {
            const contributions = contribFor(item.id)
            return (
              <React.Fragment key={item.id}>
                <ArtikelZeile item={item} tripId={tripId} categories={allCategories} onCategoryChange={() => {}} onDelete={onDeleteItem} bagTrackingEnabled={bagTrackingEnabled} bags={bags} onCreateBag={onCreateBag} canEdit={canEdit} divider={index > 0}
                  tripMembers={tripMembers} currentUserId={currentUserId} onSetSharing={onSetSharing} onClone={onClone} onJoin={onJoin} onLeave={onLeave}
                  drag={canEdit ? {
                    isDragging: dragId === item.id,
                    isOver: overId === item.id && dragId !== null && dragId !== item.id,
                    onStart: (id) => { setDragId(id); setOverId(null) },
                    onOver: (id) => setOverId(id),
                    onEnd: () => { setDragId(null); setOverId(null) },
                    onDrop: handleReorderDrop,
                  } : undefined} />
                {contributions.length > 0 && <div style={{ padding: '0 8px 2px' }}><PluginCardFooter items={contributions} tripId={tripId} /></div>}
              </React.Fragment>
            )
          })}
          {/* Inline add item */}
          {canEdit && (showAddItem ? (
            // The new item already looks like a row: an empty box in the checkbox
            // column, the name typed where names sit, and the add as the accent.
            <div style={{ ...COMPOSER, gap: 9, margin: '6px 4px 0', padding: '4px 4px 4px 27px' }}>
              <span aria-hidden style={{ width: 20, height: 20, borderRadius: 6, border: '1.5px solid var(--text-faint)', opacity: 0.6, flexShrink: 0 }} />
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
                style={{ flex: 1, minWidth: 0, padding: '5px 0', border: 'none', fontSize: 'calc(13.5px * var(--fs-scale-body, 1))', fontWeight: 500, fontFamily: 'inherit', outline: 'none', color: 'var(--text-primary)', background: 'transparent' }}
              />
              {/* disabled while the field is empty, so no extra guard here */}
              <button type="button" onClick={() => { onAddItem(kategorie, newItemName.trim()); setNewItemName(''); setTimeout(() => addItemRef.current?.focus(), 30) }}
                disabled={!newItemName.trim()} aria-label={t('common.add')}
                style={composerConfirm(!!newItemName.trim())}>
                <Plus size={15} strokeWidth={2.5} />
              </button>
              <button type="button" onClick={() => { setShowAddItem(false); setNewItemName('') }} aria-label={t('common.cancel')}
                style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0, color: 'var(--text-faint)' }}>
                <X size={14} />
              </button>
            </div>
          ) : (
            // A row of its own on a faint tint, so it closes the card instead
            // of trailing off: a dashed box in the checkbox column (past the drag
            // grip's width) and the label where an item's name sits.
            <button type="button" onClick={() => { setShowAddItem(true); setTimeout(() => addItemRef.current?.focus(), 30) }}
              style={{ display: 'flex', alignItems: 'center', gap: 9, width: 'calc(100% - 8px)', margin: '6px 4px 0', padding: '8px 10px 8px 28px', borderRadius: 10, border: 'none', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500, color: 'var(--text-faint)', fontFamily: 'inherit', textAlign: 'left' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
              <span style={{ width: 20, height: 20, borderRadius: 6, border: '1.5px dashed currentColor', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Plus size={12} strokeWidth={2.5} />
              </span>
              {t('packing.addItem')}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
