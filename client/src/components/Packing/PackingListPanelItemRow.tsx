import { useRef, useState, type CSSProperties } from 'react'
import { useTripStore } from '../../store/tripStore'
import { useToast } from '../shared/Toast'
import { useTranslation } from '../../i18n'
import {
  Check, Trash2, Plus, Pencil, Package, GripVertical, UserRound, HandHelping,
  MoreHorizontal, ChevronDown, ChevronRight,
} from 'lucide-react'
import type { PackingItem, PackingBag } from '../../types'
import { katColor } from './packingListPanel.helpers'
import { PACKING_PLACEHOLDER_NAME } from './packingListPanel.constants'
import { QuantityInput } from './PackingListPanelQuantityInput'
import PackingShareControl from './PackingShareControl'
import { PopoverItem } from './PackingPopover'
import { POPOVER, POPOVER_CAPTION, POPOVER_DIVIDER } from './packingPopoverStyles'
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
  /** Draws the hairline above the row; the category group leaves it off its first row. */
  divider?: boolean
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

export function ArtikelZeile({ item, tripId, categories, onCategoryChange: _onCategoryChange, onDelete, bagTrackingEnabled, bags = [], onCreateBag, canEdit = true, tripMembers = [], currentUserId, onSetSharing, onClone, onJoin, onLeave, divider = false, drag }: ArtikelZeileProps) {
  const isPlaceholder = item.name === PACKING_PLACEHOLDER_NAME
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(isPlaceholder ? '' : item.name)
  const [hovered, setHovered] = useState(false)
  // Keyboard focus anywhere in the row counts as hovering it, so every control
  // that only shows on hover is also there for someone tabbing through.
  const [focused, setFocused] = useState(false)
  const [showBagPicker, setShowBagPicker] = useState(false)
  const [showItemMenu, setShowItemMenu] = useState(false)
  const [showMenuCategories, setShowMenuCategories] = useState(false)
  const [bagInlineCreate, setBagInlineCreate] = useState(false)
  const [bagInlineName, setBagInlineName] = useState('')
  const itemMenuBtnRef = useRef<HTMLButtonElement>(null)
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
    setShowMenuCategories(false)
    setShowItemMenu(false)
    if (cat === item.category) return
    try { await updatePackingItem(tripId, item.id, { category: cat }) }
    catch { toast.error(t('common.error')) }
  }

  const canDrag = canEdit && !isPlaceholder && !!drag
  const selectedBag = bags.find(b => b.id === item.bag_id)
  const quantity = item.quantity || 1
  const owner = tripMembers.find(m => m.id === item.owner_id)
  const ownerAvatar = owner?.avatar_url ?? owner?.avatar ?? null

  // At rest a row reads as what it holds (owner, a quantity above one, a
  // weight, the bag) and everything else stays in place but dimmed: nothing
  // leaves a hole and nothing jumps. Pointer or focus brings it all up.
  const active = hovered || focused || showItemMenu || showBagPicker
  const reveal = (visible: boolean): CSSProperties => ({ opacity: visible ? 1 : 0.4, transition: 'opacity 120ms ease' })
  // Quantity and weight read as quiet pills; under the pointer an outline
  // shows they can be typed into.
  const badge = (visible: boolean): CSSProperties => ({
    ...reveal(visible), background: 'var(--bg-tertiary)', borderRadius: 99, padding: '2px 8px',
    borderColor: active ? 'var(--border-primary)' : 'transparent',
  })

  // Shared by both shells of the name: a renameable name is a real button so
  // the rename can be reached with the keyboard, everything else is plain text.
  const nameStyle: CSSProperties = {
    flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    fontSize: 'calc(13.5px * var(--fs-scale-body, 1))', fontWeight: 500,
    cursor: canEdit ? 'text' : 'default',
    color: isPlaceholder ? 'var(--text-faint)' : (item.checked ? 'var(--text-faint)' : 'var(--text-primary)'),
    transition: 'color 200ms cubic-bezier(0.23,1,0.32,1)',
    textDecoration: item.checked ? 'line-through' : 'none',
  }

  return (
    <div
      className="group packing-item-row"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false) }}
      onDragOver={canDrag ? (e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; drag!.onOver(item.id) }) : undefined}
      onDragLeave={canDrag ? (e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) drag!.onOver(-1) }) : undefined}
      onDrop={canDrag ? (e => { e.preventDefault(); e.stopPropagation(); drag!.onDrop(item.id) }) : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '8px 10px', borderRadius: 10, position: 'relative',
        background: hovered ? 'var(--bg-secondary)' : 'transparent',
        opacity: drag?.isDragging ? 0.4 : 1,
        boxShadow: drag?.isOver ? 'inset 3px 0 0 0 var(--accent)' : 'none',
        transition: 'background 0.1s, opacity 0.15s',
      }}
    >
      {divider && !hovered && <span aria-hidden className="pointer-events-none absolute inset-x-2.5 top-0 h-px bg-edge-faint" />}
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
      {/* The phone's box: filled with the accent once packed, an outline until then. */}
      <button type="button" onClick={handleToggle} className="packing-check" aria-pressed={!!item.checked} style={{
        flexShrink: 0, cursor: 'pointer', padding: 0, width: 20, height: 20, borderRadius: 6,
        display: 'grid', placeItems: 'center',
        border: `1.5px solid ${item.checked ? 'var(--accent)' : 'var(--text-faint)'}`,
        background: item.checked ? 'var(--accent)' : 'transparent',
        color: 'var(--accent-text)',
        transition: 'background 180ms cubic-bezier(0.23,1,0.32,1), border-color 180ms cubic-bezier(0.23,1,0.32,1)',
      }}>
        <Check size={12} strokeWidth={3} style={{
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
      ) : canEdit ? (
        <button
          type="button"
          onClick={() => setEditing(true)}
          style={{ ...nameStyle, border: 'none', background: 'none', padding: 0, textAlign: 'left', fontFamily: 'inherit' }}
        >
          {item.name}
        </button>
      ) : (
        <span style={nameStyle}>
          {item.name}
        </span>
      )}

      {/* Sharing badges (#858 three-tier), as compact chips like the phone's
          (#1525): the full sentence is the tooltip and the accessible name. */}
      {!isPlaceholder && sharedToMe && (
        <span className="packing-row-badge" title={t('packing.takenCareOf', { name: item.owner_username || '' })} aria-label={t('packing.takenCareOf', { name: item.owner_username || '' })}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: 22, height: 22, borderRadius: 99, color: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}>
          <HandHelping size={12} />
        </span>
      )}
      {!isPlaceholder && sharedByMe && (
        <span className="packing-row-badge" title={`${t('packing.sharedWithCount', { count: recipients.length })}: ${recipients.map(r => r.username).join(', ')}`} aria-label={t('packing.sharedWithCount', { count: recipients.length })}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0, height: 22, padding: '0 7px', borderRadius: 99, fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-tertiary)' }}>
          <UserRound size={11} /> {recipients.length}
        </span>
      )}
      {!isPlaceholder && broughtBy && (
        <span className="packing-row-badge" title={t('packing.broughtBy', { name: broughtBy })} aria-label={t('packing.broughtBy', { name: broughtBy })}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
          {ownerAvatar
            ? <img src={ownerAvatar} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
            : (
              <span aria-hidden style={{
                width: 20, height: 20, borderRadius: '50%', display: 'grid', placeItems: 'center',
                background: `hsl(${(broughtBy.codePointAt(0) ?? 0) * 37 % 360}, 55%, 55%)`, // theme-lint-disable: the colour comes from the bringer's name
                color: 'white', fontSize: 'calc(9px * var(--fs-scale-caption, 1))', fontWeight: 700, textTransform: 'uppercase',
              }}>{broughtBy[0]}</span>
            )}
          {contributors.length > 0 && <span style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 700, color: 'var(--text-faint)' }}>+{contributors.length}</span>}
        </span>
      )}

      <div className="packing-row-inline-actions" style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {/* Quantity */}
        {canEdit && <QuantityInput value={quantity} onSave={qty => updatePackingItem(tripId, item.id, { quantity: qty })} style={badge(active || quantity > 1)} />}

        {/* Weight + Bag (when enabled) */}
        {bagTrackingEnabled && (
          <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, border: '1px solid var(--border-primary)', borderRadius: 8, padding: '3px 6px', background: 'transparent', ...badge(active || item.weight_grams != null) }}>
            <NumericInput
              value={item.weight_grams ?? ''}
              readOnly={!canEdit}
              onValueChange={async raw => {
                if (!canEdit) return
                const v = raw === '' ? null : Number.parseInt(raw)
                try { await updatePackingItem(tripId, item.id, { weight_grams: v }) } catch { toast.error(t('packing.toast.saveError')) }
              }}
              placeholder="—"
              style={{ width: 36, border: 'none', fontSize: 'calc(12px * var(--fs-scale-body, 1))', textAlign: 'right', fontFamily: 'inherit', outline: 'none', color: 'var(--text-secondary)', background: 'transparent', padding: 0 }}
            />
            <span style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)', userSelect: 'none' }}>g</span>
          </div>
          <div style={{ position: 'relative' }}>
            <button type="button"
              onClick={() => canEdit && setShowBagPicker(p => !p)}
              style={{
                width: 22, height: 22, borderRadius: '50%', cursor: canEdit ? 'pointer' : 'default', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: item.bag_id ? `2.5px solid ${selectedBag?.color || 'var(--border-primary)'}` : '2px dashed var(--border-primary)',
                background: item.bag_id ? `${selectedBag?.color || 'var(--border-primary)'}30` : 'transparent',
                opacity: item.bag_id || active ? 1 : 0.45, transition: 'opacity 120ms ease',
              }}
            >
              {!item.bag_id && <Package size={9} className="text-content-faint" />}
            </button>
            {showBagPicker && (
              <>
              <div role="presentation" style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => { setShowBagPicker(false); setBagInlineCreate(false); setBagInlineName('') }} />
              <div className="trek-menu-enter" style={{ ...POPOVER, position: 'absolute', right: 0, top: '100%', marginTop: 6, zIndex: 50, width: 210 }}>
                <div style={POPOVER_CAPTION}>{t('packing.bags')}</div>
                {item.bag_id && (
                  <PopoverItem icon={<span style={{ width: 10, height: 10, borderRadius: '50%', border: '1.5px dashed var(--text-faint)', display: 'inline-block' }} />} label={t('packing.noBag')}
                    onClick={async () => { setShowBagPicker(false); try { await updatePackingItem(tripId, item.id, { bag_id: null }) } catch { toast.error(t('packing.toast.saveError')) } }} />
                )}
                {bags.map(b => (
                  <PopoverItem key={b.id} icon={<span style={{ width: 10, height: 10, borderRadius: '50%', background: b.color, display: 'inline-block' }} />} label={b.name} active={item.bag_id === b.id}
                    onClick={async () => { setShowBagPicker(false); try { await updatePackingItem(tripId, item.id, { bag_id: b.id }) } catch { toast.error(t('packing.toast.saveError')) } }} />
                ))}
                {bags.length > 0 && <div style={POPOVER_DIVIDER} />}
                {bagInlineCreate ? (
                  <div style={{ display: 'flex', gap: 6, padding: 4 }}>
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
                      style={{ flex: 1, minWidth: 0, padding: '6px 9px', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontFamily: 'inherit', outline: 'none', color: 'var(--text-primary)', background: 'var(--bg-input)' }} />
                    <button type="button" aria-label={t('common.add')} onClick={async () => {
                      if (bagInlineName.trim()) {
                        const newBag = await onCreateBag(bagInlineName.trim())
                        if (newBag) { try { await updatePackingItem(tripId, item.id, { bag_id: newBag.id }) } catch { toast.error(t('packing.toast.saveError')) } }
                        setBagInlineName(''); setBagInlineCreate(false); setShowBagPicker(false)
                      }
                    }}
                      style={{ width: 30, borderRadius: 8, border: 'none', background: 'var(--accent)', color: 'var(--accent-text)', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0, opacity: bagInlineName.trim() ? 1 : 0.35 }}>
                      <Plus size={13} strokeWidth={2.5} />
                    </button>
                  </div>
                ) : (
                  <PopoverItem icon={<Plus size={13} />} label={t('packing.addBag')} muted onClick={() => setBagInlineCreate(true)} />
                )}
              </div>
              </>
            )}
          </div>
          </>
        )}
      </div>

      {/* Deleting stays one click away; moving, sharing and renaming live in the
          menu next to it, and a click on the name renames as well. */}
      {canEdit && (
      <div className="packing-row-inline-actions" style={{ display: 'flex', gap: 2, alignItems: 'center', flexShrink: 0, ...reveal(active) }}>
        <button type="button" onClick={handleDelete} title={t('common.delete')} aria-label={t('common.delete')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 4px', borderRadius: 6, display: 'flex', color: 'var(--text-faint)' }}
          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
          <Trash2 size={13} />
        </button>
      </div>
      )}

      {canEdit && (
        <div className="packing-row-overflow" style={{ display: 'flex', flexShrink: 0, position: 'relative', ...reveal(active) }}>
          <button type="button"
            ref={itemMenuBtnRef}
            onClick={() => setShowItemMenu(m => !m)}
            title={t('common.showMore')}
            aria-label={t('common.showMore')} aria-expanded={showItemMenu}
            style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: showItemMenu ? 'var(--bg-tertiary)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', padding: 0 }}
          >
            <MoreHorizontal size={16} />
          </button>
          {showItemMenu && (() => {
            const rect = itemMenuBtnRef.current?.getBoundingClientRect()
            return (
              <>
                <div role="presentation" style={{ position: 'fixed', inset: 0, zIndex: 1098 }} onClick={() => { setShowItemMenu(false); setShowMenuCategories(false) }} />
                <div className="trek-menu-enter" style={{
                  ...POPOVER,
                  position: 'fixed',
                  right: rect ? Math.max(8, window.innerWidth - rect.right) : 8,
                  top: rect ? rect.bottom + 6 : 0,
                  zIndex: 1099,
                  width: 'min(240px, calc(100vw - 16px))',
                  maxHeight: '70vh',
                  overflowY: 'auto',
                }}>
                  {/* Quantity, weight and bag sit in the row itself on a wide screen. */}
                  <div className="packing-menu-phone-only">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '6px 8px' }}>
                    <span style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 0 }}>{t('packing.quantity')}</span>
                    <QuantityInput value={item.quantity || 1} onSave={qty => updatePackingItem(tripId, item.id, { quantity: qty })} />
                  </div>

                  {bagTrackingEnabled && (
                    <>
                      <div style={{ height: 1, background: 'var(--bg-tertiary)', margin: '4px 0' }} />
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '6px 8px' }}>
                        <span style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 0 }}>{t('packing.totalWeight')}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 2, border: '1px solid var(--border-primary)', borderRadius: 8, padding: '3px 6px', background: 'transparent' }}>
                          <NumericInput
                            value={item.weight_grams ?? ''}
                            readOnly={!canEdit}
                            onValueChange={async raw => {
                              const v = raw === '' ? null : Number.parseInt(raw)
                              try { await updatePackingItem(tripId, item.id, { weight_grams: v }) } catch { toast.error(t('packing.toast.saveError')) }
                            }}
                            placeholder="—"
                            style={{ width: 42, border: 'none', fontSize: 'calc(12px * var(--fs-scale-body, 1))', textAlign: 'right', fontFamily: 'inherit', outline: 'none', color: 'var(--text-secondary)', background: 'transparent', padding: 0 }}
                          />
                          <span style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)', userSelect: 'none' }}>g</span>
                        </div>
                      </div>
                      <div style={{ padding: '2px 0' }}>
                        <PopoverItem icon={<Package size={13} />} label={selectedBag?.name || t('packing.noBag')} onClick={async () => {
                          if (item.bag_id) {
                            try { await updatePackingItem(tripId, item.id, { bag_id: null }) } catch { toast.error(t('packing.toast.saveError')) }
                          }
                        }} />
                        {bags.map(b => (
                          <PopoverItem key={b.id} icon={<span style={{ width: 10, height: 10, borderRadius: '50%', background: b.color, display: 'inline-block' }} />} label={b.name} active={item.bag_id === b.id} onClick={async () => {
                            setShowItemMenu(false)
                            try { await updatePackingItem(tripId, item.id, { bag_id: b.id }) } catch { toast.error(t('packing.toast.saveError')) }
                          }} />
                        ))}
                      </div>
                    </>
                  )}

                  <div style={POPOVER_DIVIDER} />
                  </div>
                  <PopoverItem icon={<span style={{ width: 9, height: 9, borderRadius: '50%', background: katColor(item.category || t('packing.defaultCategory'), categories), display: 'inline-block' }} />} label={t('packing.changeCategory')} onClick={() => setShowMenuCategories(v => !v)}
                    trailing={showMenuCategories ? <ChevronDown size={13} style={{ color: 'var(--text-faint)', flexShrink: 0 }} /> : <ChevronRight size={13} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />} />
                  {showMenuCategories && (
                    <div style={{ margin: '2px 0 4px 18px', paddingLeft: 6, borderLeft: '1px solid var(--border-faint)' }}>
                      {categories.map(cat => (
                        <PopoverItem key={cat} icon={<span style={{ width: 8, height: 8, borderRadius: '50%', background: katColor(cat, categories), display: 'inline-block' }} />} label={cat} active={cat === (item.category || t('packing.defaultCategory'))} onClick={() => handleCatChange(cat)} />
                      ))}
                    </div>
                  )}

                  {canShare && onClone && onJoin && onLeave && (
                    <PackingShareControl
                      variant="menu"
                      item={item}
                      tripMembers={tripMembers}
                      currentUserId={currentUserId}
                      onSetSharing={onSetSharing!}
                      onClone={onClone}
                      onJoin={onJoin}
                      onLeave={onLeave}
                      onAction={() => setShowItemMenu(false)}
                    />
                  )}

                  <div style={POPOVER_DIVIDER} />
                  <PopoverItem icon={<Pencil size={13} />} label={t('common.rename')} onClick={() => { setEditing(true); setShowItemMenu(false) }} />
                  <PopoverItem icon={<Trash2 size={13} />} label={t('common.delete')} danger onClick={() => { setShowItemMenu(false); handleDelete() }} />
                </div>
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
