import { useRef, useState, type CSSProperties } from 'react'
import { useTripStore } from '../../store/tripStore'
import { useToast } from '../shared/Toast'
import { useTranslation } from '../../i18n'
import { Check, GripVertical, UserRound, HandHelping, ChevronRight } from 'lucide-react'
import type { PackingItem, PackingBag } from '../../types'
import { packedOf } from './packingListPanel.helpers'
import { PACKING_PLACEHOLDER_NAME } from './packingListPanel.constants'
import type { TripMember } from './usePackingListPanel'
import { bringersOf, packingBringerNames } from './packingBringers'
import { Tooltip } from '../shared/Tooltip'
import { BringerAvatar, BringersCard, MoreBringers } from './PackingBringersCard'
import { PackingItemDetail } from './PackingItemDetail'

interface ArtikelZeileProps {
  item: PackingItem
  tripId: number
  categories: string[]
  onCategoryChange: () => void
  onDelete?: (item: PackingItem) => Promise<void>
  /** Enter on the filled '...' row, so the category's add field can take over the typing (#2825). */
  onPlaceholderFilled?: () => void
  bagTrackingEnabled?: boolean
  bags?: PackingBag[]
  onCreateBag: (name: string) => Promise<PackingBag | undefined>
  canEdit?: boolean
  // Three-tier sharing (#858): members + handlers for the item's detail window.
  tripMembers?: TripMember[]
  currentUserId?: number
  onSetSharing?: (id: number, visibility: 'common' | 'personal' | 'shared', recipientIds: number[]) => void
  onClone?: (id: number) => void
  onJoin?: (id: number, userId?: number) => void
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

const nameStyle = (checked: boolean, placeholder: boolean): CSSProperties => ({
  flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  fontSize: 'calc(13.5px * var(--fs-scale-body, 1))', fontWeight: 500, textAlign: 'start',
  color: checked || placeholder ? 'var(--text-faint)' : 'var(--text-primary)',
  textDecoration: checked ? 'line-through' : 'none',
  transition: 'color 200ms cubic-bezier(0.23,1,0.32,1)',
})

/** The '...' row a new list starts with: typed into right here, so the next item follows (#2825). */
function PlaceholderField({ item, tripId, onFilled }: Readonly<{ item: PackingItem; tripId: number; onFilled?: () => void }>) {
  const [name, setName] = useState('')
  const updatePackingItem = useTripStore(s => s.updatePackingItem)
  const toast = useToast()
  const { t } = useTranslation()
  const save = async (viaEnter: boolean) => {
    if (!name.trim()) { setName(''); return }
    try {
      await updatePackingItem(tripId, item.id, { name: name.trim() })
      if (viaEnter) onFilled?.()
    } catch { toast.error(t('packing.toast.saveError')) }
  }
  return (
    <input type="text" value={name} placeholder="..." onChange={e => setName(e.target.value)}
      onBlur={() => void save(false)}
      onKeyDown={e => { if (e.key === 'Enter') void save(true); if (e.key === 'Escape') setName('') }}
      className="min-w-0 flex-1 rounded-md border border-edge bg-transparent px-2 py-0.5 font-[inherit] text-content outline-none"
      style={{ fontSize: 'calc(13.5px * var(--fs-scale-body, 1))' }} />
  )
}

/** What the row says about the item at rest: only what is set, never an empty field. */
function RowFacts({ item, tripMembers, currentUserId }: Readonly<{ item: PackingItem; tripMembers: TripMember[]; currentUserId?: number }>) {
  const { t } = useTranslation()
  const quantity = item.quantity || 1
  const packed = packedOf(item)
  const partly = !item.checked && packed > 0
  const recipients = item.recipients || []
  const sharedToMe = !!item.is_private && item.owner_id != null && item.owner_id !== currentUserId
  const sharedByMe = !!item.is_private && item.owner_id === currentUserId && recipients.length > 0
  const bringers = item.is_private ? [] : bringersOf(item, tripMembers)
  return (
    <>
      {partly && <span className="shrink-0 text-caption font-semibold tabular-nums text-content-muted">{packed}/{quantity}</span>}
      {!partly && quantity > 1 && <span className="shrink-0 text-caption font-medium tabular-nums text-content-faint">×{quantity}</span>}
      {sharedToMe && (
        <Tooltip label={t('packing.takenCareOf', { name: item.owner_username || '' })}>
          <span className="packing-row-badge inline-flex size-[22px] shrink-0 items-center justify-center rounded-full text-accent"
            aria-label={t('packing.takenCareOf', { name: item.owner_username || '' })}
            style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}>
            <HandHelping size={12} />
          </span>
        </Tooltip>
      )}
      {sharedByMe && (
        <Tooltip label={`${t('packing.sharedWithCount', { count: recipients.length })}: ${recipients.map(r => r.username).join(', ')}`}>
          <span className="packing-row-badge inline-flex h-[22px] shrink-0 items-center gap-[3px] rounded-full bg-surface-tertiary px-[7px] text-caption font-bold text-content-muted"
            aria-label={t('packing.sharedWithCount', { count: recipients.length })}>
            <UserRound size={11} /> {recipients.length}
          </span>
        </Tooltip>
      )}
      {bringers.length > 0 && (
        <Tooltip label={t('packing.broughtBy', { name: packingBringerNames(item) })} content={<BringersCard bringers={bringers} />}>
          <span className="packing-row-badge inline-flex shrink-0 items-center" aria-label={t('packing.broughtBy', { name: packingBringerNames(item) })}>
            <BringerAvatar bringer={bringers[0]} />
            {bringers.length > 1 && <MoreBringers count={bringers.length - 1} />}
          </span>
        </Tooltip>
      )}
    </>
  )
}

/**
 * One packing item. At rest it shows its box, its name and only what is set
 * (the amount from two up, the pieces packed, who brings it); a click anywhere
 * past the box opens the item's window with every choice in it.
 */
export function ArtikelZeile({ item, tripId, categories, onDelete, onPlaceholderFilled, bagTrackingEnabled, bags = [], onCreateBag, canEdit = true, tripMembers = [], currentUserId, onSetSharing, onClone, onJoin, onLeave, divider = false, drag }: ArtikelZeileProps) {
  const isPlaceholder = item.name === PACKING_PLACEHOLDER_NAME
  const [hovered, setHovered] = useState(false)
  const [open, setOpen] = useState(false)
  const rowRef = useRef<HTMLDivElement>(null)
  const togglePackingItem = useTripStore(s => s.togglePackingItem)
  const deletePackingItem = useTripStore(s => s.deletePackingItem)
  const toast = useToast()
  const { t } = useTranslation()

  const handleDelete = async () => {
    // The panel routes deletion through onDelete so an emptied custom category
    // keeps its placeholder; fall back to a plain delete when used standalone.
    if (onDelete) { await onDelete(item); return }
    try { await deletePackingItem(tripId, item.id) }
    catch { toast.error(t('packing.toast.deleteError')) }
  }

  // The drag handlers only when this row can be dragged at all.
  const dnd = canEdit && !isPlaceholder ? drag : undefined
  const partlyPacked = !item.checked && packedOf(item) > 0
  const active = hovered || open

  return (
    <div
      ref={rowRef}
      className="group packing-item-row"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onDragOver={dnd ? (e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; dnd.onOver(item.id) }) : undefined}
      onDragLeave={dnd ? (e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) dnd.onOver(-1) }) : undefined}
      onDrop={dnd ? (e => { e.preventDefault(); e.stopPropagation(); dnd.onDrop(item.id) }) : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '8px 10px', borderRadius: 10, position: 'relative', minHeight: 40,
        background: active ? 'var(--bg-secondary)' : 'transparent',
        boxShadow: drag?.isOver ? 'inset 3px 0 0 0 var(--accent)' : (open ? 'inset 0 0 0 1px var(--border-primary)' : 'none'),
        opacity: drag?.isDragging ? 0.4 : 1,
        transition: 'background 0.1s, opacity 0.15s',
      }}
    >
      {divider && !active && <span aria-hidden className="pointer-events-none absolute inset-x-2.5 top-0 h-px bg-edge-faint" />}
      {dnd && (
        <div
          draggable
          onDragStart={e => { e.stopPropagation(); e.dataTransfer.effectAllowed = 'move'; dnd.onStart(item.id) }}
          onDragEnd={() => dnd.onEnd()}
          className="flex shrink-0 cursor-grab items-center text-content-faint transition-opacity"
          style={{ opacity: hovered ? 1 : 0 }}
        >
          <GripVertical size={13} />
        </div>
      )}
      {/* Sorted A-Z there is nothing to drag, but the box keeps its column. */}
      {!dnd && canEdit && !isPlaceholder && <span aria-hidden style={{ width: 13, flexShrink: 0 }} />}
      <button type="button" onClick={() => void togglePackingItem(tripId, item.id, !item.checked)} className="packing-check" aria-pressed={!!item.checked} style={{
        flexShrink: 0, cursor: 'pointer', padding: 0, width: 20, height: 20, borderRadius: 6,
        display: 'grid', placeItems: 'center',
        border: `1.5px solid ${item.checked || partlyPacked ? 'var(--accent)' : 'var(--text-faint)'}`,
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

      {isPlaceholder && canEdit ? (
        <PlaceholderField item={item} tripId={tripId} onFilled={onPlaceholderFilled} />
      ) : (
        <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-md border-0 bg-transparent p-0 font-[inherit] outline-none [-webkit-tap-highlight-color:transparent] focus-visible:ring-2 focus-visible:ring-accent">
          <span style={nameStyle(!!item.checked, isPlaceholder)}>{item.name}</span>
          {!isPlaceholder && <RowFacts item={item} tripMembers={tripMembers} currentUserId={currentUserId} />}
          <ChevronRight size={14} aria-hidden className="shrink-0 text-content-faint transition-opacity" style={{ opacity: active ? 1 : 0 }} />
        </button>
      )}

      {open && (
        <PackingItemDetail
          item={item} tripId={tripId} anchorRef={rowRef} onClose={() => setOpen(false)}
          categories={categories} canEdit={canEdit} bagTrackingEnabled={bagTrackingEnabled} bags={bags} onCreateBag={onCreateBag}
          tripMembers={tripMembers} currentUserId={currentUserId}
          onSetSharing={onSetSharing} onClone={onClone} onJoin={onJoin} onLeave={onLeave}
          onDelete={() => void handleDelete()}
        />
      )}
    </div>
  )
}
