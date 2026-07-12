import { useState } from 'react'
import { useTripStore } from '../../store/tripStore'
import { useToast } from '../shared/Toast'
import { useTranslation } from '../../i18n'
import {
  CheckSquare, Square, Trash2, Plus, Pencil, Package, GripVertical, UserRound, Users, HandHelping,
} from 'lucide-react'
import type { PackingItem, PackingBag } from '../../types'
import { katColor } from './packingListPanel.helpers'
import { PACKING_PLACEHOLDER_NAME } from './packingListPanel.constants'
import { QuantityInput } from './PackingListPanelQuantityInput'
import PackingShareControl from './PackingShareControl'
import type { TripMember } from './usePackingListPanel'
import { NumericInput } from '../shared/NumericInput'

interface ArtikelZeileProps {
  item: PackingItem
  tripId: number
  categories: string[]
  onCategoryChange: () => void
  onDelete?: (item: PackingItem) => Promise<void>
  bagTrackingEnabled?: boolean
  bags?: PackingBag[]
  onCreateBag: (name: string) => Promise<PackingBag | undefined>
  canEdit?: boolean
  // Three-tier sharing (#858): members + handlers for the per-item share control.
  tripMembers?: TripMember[]
  currentUserId?: number
  onSetSharing?: (id: number, visibility: 'common' | 'personal' | 'shared', recipientIds: number[]) => void
  onClone?: (id: number) => void
  onJoin?: (id: number) => void
  onLeave?: (id: number, userId: number) => void
  // Drag-to-reorder (#969) — wired by the category group, which owns the order.
  drag?: {
    isDragging: boolean
    isOver: boolean
    onStart: (id: number) => void
    onOver: (id: number) => void
    onEnd: () => void
    onDrop: (targetId: number) => void
  }
}

export function ArtikelZeile({ item, tripId, categories, onCategoryChange, onDelete, bagTrackingEnabled, bags = [], onCreateBag, canEdit = true, tripMembers = [], currentUserId, onSetSharing, onClone, onJoin, onLeave, drag }: ArtikelZeileProps) {
  const isPlaceholder = item.name === PACKING_PLACEHOLDER_NAME
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(isPlaceholder ? '' : item.name)
  const [hovered, setHovered] = useState(false)
  const [showCatPicker, setShowCatPicker] = useState(false)
  const [showBagPicker, setShowBagPicker] = useState(false)
  const [bagInlineCreate, setBagInlineCreate] = useState(false)
  const [bagInlineName, setBagInlineName] = useState('')
  const { togglePackingItem, updatePackingItem, deletePackingItem } = useTripStore()
  const toast = useToast()
  const { t } = useTranslation()

  // Three-tier sharing display (#858).
  const sharedToMe = !!item.is_private && item.owner_id != null && item.owner_id !== currentUserId
  const recipients = item.recipients || []
  const sharedByMe = !!item.is_private && item.owner_id === currentUserId && recipients.length > 0
  const broughtBy = !item.is_private && item.owner_username ? item.owner_username : null
  const contributors = item.contributors || []
  const canShare = canEdit && !isPlaceholder && !!onSetSharing

  const handleToggle = () => togglePackingItem(tripId, item.id, !item.checked)

  const handleSaveName = async () => {
    if (!editName.trim()) { setEditing(false); setEditName(isPlaceholder ? '' : item.name); return }
    try { await updatePackingItem(tripId, item.id, { name: editName.trim() }); setEditing(false) }
    catch { toast.error(t('packing.toast.saveError')) }
  }

  const handleDelete = async () => {
    // The panel routes deletion through onDelete so an emptied custom category
    // keeps its placeholder; fall back to a plain delete when used standalone.
    if (onDelete) { await onDelete(item); return }
    try { await deletePackingItem(tripId, item.id) }
    catch { toast.error(t('packing.toast.deleteError')) }
  }

  const handleCatChange = async (cat: string) => {
    setShowCatPicker(false)
    if (cat === item.category) return
    try { await updatePackingItem(tripId, item.id, { category: cat }) }
    catch { toast.error(t('common.error')) }
  }

  const canDrag = canEdit && !isPlaceholder && !!drag

  return (
    <div
      className="group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowCatPicker(false); setShowBagPicker(false) }}
      onDragOver={canDrag ? (e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; drag!.onOver(item.id) }) : undefined}
      onDragLeave={canDrag ? (e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) drag!.onOver(-1) }) : undefined}
      onDrop={canDrag ? (e => { e.preventDefault(); e.stopPropagation(); drag!.onDrop(item.id) }) : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 10px', borderRadius: 10, position: 'relative',
        background: hovered ? 'var(--bg-secondary)' : 'transparent',
        opacity: drag?.isDragging ? 0.4 : 1,
        boxShadow: drag?.isOver ? 'inset 3px 0 0 0 var(--accent)' : 'none',
        transition: 'background 0.1s, opacity 0.15s',
      }}
    >
      {canDrag && (
        <div
          draggable
          onDragStart={e => { e.stopPropagation(); e.dataTransfer.effectAllowed = 'move'; drag!.onStart(item.id) }}
          onDragEnd={() => drag!.onEnd()}
          title=""
          style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: 'var(--text-faint)', flexShrink: 0, opacity: hovered ? 1 : 0.35, transition: 'opacity 0.15s' }}
        >
          <GripVertical size={13} />
        </div>
      )}
      <button onClick={handleToggle} style={{
        flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0, position: 'relative',
        width: 18, height: 18,
        color: item.checked ? '#10b981' : 'var(--text-faint)',
        transition: 'color 200ms cubic-bezier(0.23,1,0.32,1)',
      }}>
        <Square size={18} style={{
          position: 'absolute', inset: 0,
          opacity: item.checked ? 0 : 1,
          transform: item.checked ? 'scale(0.7)' : 'scale(1)',
          transition: 'opacity 180ms cubic-bezier(0.23,1,0.32,1), transform 180ms cubic-bezier(0.23,1,0.32,1)',
        }} />
        <CheckSquare size={18} style={{
          position: 'absolute', inset: 0,
          opacity: item.checked ? 1 : 0,
          transform: item.checked ? 'scale(1)' : 'scale(0.5)',
          transition: 'opacity 200ms cubic-bezier(0.23,1,0.32,1), transform 220ms cubic-bezier(0.34,1.56,0.64,1)',
        }} />
      </button>

      {editing && canEdit ? (
        <input
          type="text" value={editName} autoFocus
          placeholder={isPlaceholder ? '...' : undefined}
          onChange={e => setEditName(e.target.value)}
          onBlur={handleSaveName}
          onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') { setEditing(false); setEditName(isPlaceholder ? '' : item.name) } }}
          style={{ flex: 1, minWidth: 0, fontSize: 'calc(13.5px * var(--fs-scale-body, 1))', padding: '2px 8px', borderRadius: 6, border: '1px solid var(--border-primary)', outline: 'none', fontFamily: 'inherit' }}
        />
      ) : (
        <span
          onClick={() => canEdit && !item.checked && setEditing(true)}
          style={{
            flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontSize: 'calc(13.5px * var(--fs-scale-body, 1))',
            cursor: !canEdit || item.checked ? 'default' : 'text',
            color: isPlaceholder ? 'var(--text-faint)' : (item.checked ? 'var(--text-faint)' : 'var(--text-primary)'),
            transition: 'color 200ms cubic-bezier(0.23,1,0.32,1)',
            textDecoration: item.checked ? 'line-through' : 'none',
          }}
        >
          {item.name}
        </span>
      )}

      {/* Sharing badges (#858 three-tier) */}
      {!isPlaceholder && sharedToMe && (
        <span title={t('packing.takenCareOf', { name: item.owner_username || '' })}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0, fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 600, color: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 12%, transparent)', padding: '1px 7px', borderRadius: 99 }}>
          <HandHelping size={10} /> {t('packing.takenCareOf', { name: item.owner_username || '' })}
        </span>
      )}
      {!isPlaceholder && sharedByMe && (
        <span title={recipients.map(r => r.username).join(', ')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0, fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '1px 7px', borderRadius: 99 }}>
          <UserRound size={10} /> {t('packing.sharedWithCount', { count: recipients.length })}
        </span>
      )}
      {!isPlaceholder && broughtBy && (
        <span title={t('packing.broughtBy', { name: broughtBy })}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0, fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 600, color: 'var(--text-faint)', padding: '1px 4px' }}>
          <Users size={10} /> {broughtBy}{contributors.length > 0 ? ` +${contributors.length}` : ''}
        </span>
      )}

      {/* Quantity */}
      {canEdit && <QuantityInput value={item.quantity || 1} onSave={qty => updatePackingItem(tripId, item.id, { quantity: qty })} />}

      {/* Weight + Bag (when enabled) */}
      {bagTrackingEnabled && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, border: '1px solid var(--border-primary)', borderRadius: 8, padding: '3px 6px', background: 'transparent' }}>
            <NumericInput
              value={item.weight_grams ?? ''}
              readOnly={!canEdit}
              onValueChange={async raw => {
                if (!canEdit) return
                const v = raw === '' ? null : parseInt(raw)
                try { await updatePackingItem(tripId, item.id, { weight_grams: v }) } catch { toast.error(t('packing.toast.saveError')) }
              }}
              placeholder="—"
              style={{ width: 36, border: 'none', fontSize: 'calc(12px * var(--fs-scale-body, 1))', textAlign: 'right', fontFamily: 'inherit', outline: 'none', color: 'var(--text-secondary)', background: 'transparent', padding: 0 }}
            />
            <span style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)', userSelect: 'none' }}>g</span>
          </div>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => canEdit && setShowBagPicker(p => !p)}
              style={{
                width: 22, height: 22, borderRadius: '50%', cursor: canEdit ? 'pointer' : 'default', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: item.bag_id ? `2.5px solid ${bags.find(b => b.id === item.bag_id)?.color || 'var(--border-primary)'}` : '2px dashed var(--border-primary)',
                background: item.bag_id ? `${bags.find(b => b.id === item.bag_id)?.color || 'var(--border-primary)'}30` : 'transparent',
              }}
            >
              {!item.bag_id && <Package size={9} className="text-content-faint" />}
            </button>
            {showBagPicker && (
              <div style={{
                position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 50,
                background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 10,
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)', padding: 4, minWidth: 160,
              }}>
                {item.bag_id && (
                  <button onClick={async () => { setShowBagPicker(false); try { await updatePackingItem(tripId, item.id, { bag_id: null }) } catch { toast.error(t('packing.toast.saveError')) } }}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', padding: '6px 10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontFamily: 'inherit', color: 'var(--text-faint)', borderRadius: 7 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', border: '2px dashed var(--border-primary)' }} />
                    {t('packing.noBag')}
                  </button>
                )}
                {bags.map(b => (
                  <button key={b.id} onClick={async () => { setShowBagPicker(false); try { await updatePackingItem(tripId, item.id, { bag_id: b.id }) } catch { toast.error(t('packing.toast.saveError')) } }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7, width: '100%', padding: '6px 10px',
                      background: item.bag_id === b.id ? 'var(--bg-tertiary)' : 'none',
                      border: 'none', cursor: 'pointer', fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontFamily: 'inherit', color: 'var(--text-secondary)', borderRadius: 7,
                    }}
                    onMouseEnter={e => { if (item.bag_id !== b.id) e.currentTarget.style.background = 'var(--bg-tertiary)' }}
                    onMouseLeave={e => { if (item.bag_id !== b.id) e.currentTarget.style.background = 'none' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
                    {b.name}
                  </button>
                ))}
                {bags.length > 0 && <div style={{ height: 1, background: 'var(--bg-tertiary)', margin: '4px 0' }} />}
                <div style={{ padding: '4px 6px' }}>
                  {bagInlineCreate ? (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <input autoFocus value={bagInlineName} onChange={e => setBagInlineName(e.target.value)}
                        onKeyDown={async e => {
                          if (e.key === 'Enter' && bagInlineName.trim()) {
                            const newBag = await onCreateBag(bagInlineName.trim())
                            if (newBag) { try { await updatePackingItem(tripId, item.id, { bag_id: newBag.id }) } catch { toast.error(t('packing.toast.saveError')) } }
                            setBagInlineName(''); setBagInlineCreate(false); setShowBagPicker(false)
                          }
                          if (e.key === 'Escape') { setBagInlineCreate(false); setBagInlineName('') }
                        }}
                        placeholder={t('packing.bagName')}
                        style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border-primary)', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontFamily: 'inherit', outline: 'none' }} />
                      <button onClick={async () => {
                        if (bagInlineName.trim()) {
                          const newBag = await onCreateBag(bagInlineName.trim())
                          if (newBag) { try { await updatePackingItem(tripId, item.id, { bag_id: newBag.id }) } catch { toast.error(t('packing.toast.saveError')) } }
                          setBagInlineName(''); setBagInlineCreate(false); setShowBagPicker(false)
                        }
                      }}
                        style={{ padding: '3px 6px', borderRadius: 6, border: 'none', background: 'var(--text-primary)', color: 'var(--bg-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Plus size={11} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setBagInlineCreate(true)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, width: '100%', padding: '5px 6px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontFamily: 'inherit', color: 'var(--text-faint)', borderRadius: 7 }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
                      <Plus size={11} /> {t('packing.addBag')}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {canEdit && (
      <div style={{ display: 'flex', gap: 2, alignItems: 'center', flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowCatPicker(p => !p)}
            title={t('packing.changeCategory')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 5px', borderRadius: 6, display: 'flex', alignItems: 'center', color: 'var(--text-faint)', fontSize: 'calc(10px * var(--fs-scale-caption, 1))', gap: 2 }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: katColor(item.category || t('packing.defaultCategory'), categories), display: 'inline-block' }} />
          </button>
          {showCatPicker && (
            <div style={{
              position: 'absolute', right: 0, top: '100%', zIndex: 50, background: 'var(--bg-card)',
              border: '1px solid var(--border-primary)', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              padding: 4, minWidth: 140,
            }}>
              {categories.map(cat => (
                <button key={cat} onClick={() => handleCatChange(cat)} style={{
                  display: 'flex', alignItems: 'center', gap: 7, width: '100%',
                  padding: '6px 10px', background: cat === (item.category || t('packing.defaultCategory')) ? 'var(--bg-tertiary)' : 'none',
                  border: 'none', cursor: 'pointer', fontSize: 'calc(12.5px * var(--fs-scale-body, 1))', fontFamily: 'inherit',
                  color: 'var(--text-secondary)', borderRadius: 7, textAlign: 'left',
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: katColor(cat, categories), flexShrink: 0 }} />
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {canShare && onClone && onJoin && onLeave && (
          <PackingShareControl
            item={item}
            tripMembers={tripMembers}
            currentUserId={currentUserId}
            onSetSharing={onSetSharing!}
            onClone={onClone}
            onJoin={onJoin}
            onLeave={onLeave}
          />
        )}

        <button onClick={() => setEditing(true)} title={t('common.rename')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 4px', borderRadius: 6, display: 'flex', color: 'var(--text-faint)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
          <Pencil size={13} />
        </button>

        <button onClick={handleDelete} title={t('common.delete')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 4px', borderRadius: 6, display: 'flex', color: 'var(--text-faint)' }}
          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
          <Trash2 size={13} />
        </button>
      </div>
      )}
    </div>
  )
}
