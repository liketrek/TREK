import React, { useEffect, useRef, useState } from 'react'
import { Plus, Bookmark, Layers, MoreHorizontal, Pencil, Trash2, Users, Check } from 'lucide-react'
import type { Collection } from '@trek/shared'
import type { TranslationFn } from '../../types'
import { ALL_SAVED } from '../../store/collectionStore'
import type { ActiveCollectionId, IncomingCollectionInvite } from '../../store/collectionStore'

const SWATCHES = ['#6366f1', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#ef4444', '#3b82f6', '#22c55e']

interface ListsRailProps {
  ownedLists: Collection[]
  sharedLists: Collection[]
  activeId: ActiveCollectionId
  incomingInvites: IncomingCollectionInvite[]
  editingListId: number | null
  editingName: string
  setEditingName: (v: string) => void
  onSelect: (id: ActiveCollectionId) => void
  onNewList: () => void
  onStartRename: (id: number, name: string) => void
  onCommitRename: () => void
  onSetColor: (id: number, color: string) => void
  onRequestDelete: (id: number) => void
  onAcceptInvite: (id: number) => void
  onDeclineInvite: (id: number) => void
  t: TranslationFn
}

function ColorDot({ color }: { color?: string | null }): React.ReactElement {
  return <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color || '#6366f1' }} />
}

interface ListRowProps {
  list: Collection
  active: boolean
  editing: boolean
  editingName: string
  setEditingName: (v: string) => void
  onSelect: (id: number) => void
  onStartRename: (id: number, name: string) => void
  onCommitRename: () => void
  onSetColor: (id: number, color: string) => void
  onRequestDelete: (id: number) => void
  t: TranslationFn
}

function ListRow({
  list, active, editing, editingName, setEditingName,
  onSelect, onStartRename, onCommitRename, onSetColor, onRequestDelete, t,
}: ListRowProps): React.ReactElement {
  const [menuOpen, setMenuOpen] = useState(false)
  const [colorOpen, setColorOpen] = useState(false)
  const rowRef = useRef<HTMLDivElement>(null)
  // Owner or accepted member may rename/recolour any accessible list; only the
  // owner may delete it.
  const canDelete = list.is_owner !== false

  useEffect(() => {
    if (!menuOpen && !colorOpen) return
    const onDown = (e: MouseEvent) => {
      if (rowRef.current && !rowRef.current.contains(e.target as Node)) { setMenuOpen(false); setColorOpen(false) }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [menuOpen, colorOpen])

  if (editing) {
    return (
      <div className="px-2 py-1.5">
        <input
          autoFocus
          value={editingName}
          onChange={e => setEditingName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onCommitRename(); if (e.key === 'Escape') onCommitRename() }}
          onBlur={onCommitRename}
          className="w-full px-2 py-1.5 rounded-lg border border-accent bg-surface-input text-content text-[13px] outline-none"
        />
      </div>
    )
  }

  return (
    <div ref={rowRef} className="relative group">
      <button
        type="button"
        onClick={() => onSelect(list.id)}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${active ? 'bg-surface-selected text-content' : 'text-content-secondary hover:bg-surface-hover'}`}
      >
        <ColorDot color={list.color} />
        <span className="flex-1 text-[13px] font-medium truncate">{list.name}</span>
        <span className="text-[11px] tabular-nums text-content-faint shrink-0">{list.place_count ?? 0}</span>
      </button>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); setColorOpen(false) }}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-content-faint opacity-0 group-hover:opacity-100 hover:bg-surface-hover transition-opacity"
        aria-label={t('collections.listMenu')}
      >
        <MoreHorizontal size={15} />
      </button>
      {menuOpen && !colorOpen && (
        <div className="absolute right-1 top-9 z-20 w-40 py-1 rounded-lg border border-edge bg-surface-card shadow-dropdown">
          <button type="button" onClick={() => { setMenuOpen(false); onStartRename(list.id, list.name) }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-content-secondary hover:bg-surface-hover">
            <Pencil size={13} /> {t('collections.editList')}
          </button>
          <button type="button" onClick={() => setColorOpen(true)} className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-content-secondary hover:bg-surface-hover">
            <ColorDot color={list.color} /> {t('collections.listColor')}
          </button>
          {canDelete && (
            <button type="button" onClick={() => { setMenuOpen(false); onRequestDelete(list.id) }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-danger hover:bg-surface-hover">
              <Trash2 size={13} /> {t('collections.deleteList')}
            </button>
          )}
        </div>
      )}
      {colorOpen && (
        <div className="absolute right-1 top-9 z-20 p-2 rounded-lg border border-edge bg-surface-card shadow-dropdown">
          <div className="grid grid-cols-4 gap-1.5">
            {SWATCHES.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => { onSetColor(list.id, c); setColorOpen(false); setMenuOpen(false) }}
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: c }}
                aria-label={c}
              >
                {list.color === c && <Check size={13} className="text-white" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Left rail of the user's lists: a "New list" action, the "All saved" union
 * pseudo-list, owned lists (colour dot + count + rename/colour/delete menu),
 * a shared section, and an incoming-invites block.
 */
export default function ListsRail(props: ListsRailProps): React.ReactElement {
  const {
    ownedLists, sharedLists, activeId, incomingInvites,
    editingListId, editingName, setEditingName,
    onSelect, onNewList, onStartRename, onCommitRename, onSetColor, onRequestDelete,
    onAcceptInvite, onDeclineInvite, t,
  } = props

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={onNewList}
        className="flex items-center gap-2 px-3 py-2 mb-1 rounded-lg border border-dashed border-edge text-content-secondary hover:bg-surface-hover hover:text-content transition-colors text-[13px] font-medium"
      >
        <Plus size={15} /> {t('collections.newList')}
      </button>

      <button
        type="button"
        onClick={() => onSelect(ALL_SAVED)}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${activeId === ALL_SAVED ? 'bg-surface-selected text-content' : 'text-content-secondary hover:bg-surface-hover'}`}
      >
        <Layers size={15} className="shrink-0 text-content-faint" />
        <span className="flex-1 text-[13px] font-medium">{t('collections.allSaved')}</span>
      </button>

      {ownedLists.length > 0 && <div className="h-px bg-edge-faint my-1.5" />}
      {ownedLists.map(list => (
        <ListRow
          key={list.id}
          list={list}
          active={activeId === list.id}
          editing={editingListId === list.id}
          editingName={editingName}
          setEditingName={setEditingName}
          onSelect={onSelect}
          onStartRename={onStartRename}
          onCommitRename={onCommitRename}
          onSetColor={onSetColor}
          onRequestDelete={onRequestDelete}
          t={t}
        />
      ))}

      {sharedLists.length > 0 && (
        <>
          <div className="flex items-center gap-1.5 px-3 mt-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-content-faint">
            <Users size={11} /> {t('collections.shared')}
          </div>
          {sharedLists.map(list => (
            <ListRow
              key={list.id}
              list={list}
              active={activeId === list.id}
              editing={editingListId === list.id}
              editingName={editingName}
              setEditingName={setEditingName}
              onSelect={onSelect}
              onStartRename={onStartRename}
              onCommitRename={onCommitRename}
              onSetColor={onSetColor}
              onRequestDelete={onRequestDelete}
              t={t}
            />
          ))}
        </>
      )}

      {incomingInvites.length > 0 && (
        <>
          <div className="flex items-center gap-1.5 px-3 mt-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-content-faint">
            <Bookmark size={11} /> {t('collections.invites.title')} ({incomingInvites.length})
          </div>
          {incomingInvites.map(inv => (
            <div key={inv.collection_id} className="px-3 py-2 rounded-lg bg-surface-secondary">
              <p className="text-[12px] font-semibold text-content truncate">{inv.name}</p>
              <p className="text-[11px] text-content-faint truncate">{t('collections.invites.from')} {inv.from.username}</p>
              <div className="flex gap-1.5 mt-1.5">
                <button type="button" onClick={() => onAcceptInvite(inv.collection_id)} className="flex-1 px-2 py-1 rounded-md bg-accent text-accent-text text-[11px] font-semibold hover:bg-accent-hover">
                  {t('collections.invites.accept')}
                </button>
                <button type="button" onClick={() => onDeclineInvite(inv.collection_id)} className="flex-1 px-2 py-1 rounded-md border border-edge text-content-secondary text-[11px] font-semibold hover:bg-surface-hover">
                  {t('collections.invites.decline')}
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
