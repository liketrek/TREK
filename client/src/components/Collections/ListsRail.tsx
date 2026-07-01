import React, { useEffect, useRef, useState } from 'react'
import { Plus, Layers, MoreHorizontal, Pencil, Trash2, Users, Check, Palette } from 'lucide-react'
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
      <div className="col-row">
        <input
          autoFocus
          value={editingName}
          onChange={e => setEditingName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') onCommitRename() }}
          onBlur={onCommitRename}
          className="col-row-edit"
        />
      </div>
    )
  }

  return (
    <div ref={rowRef} className="col-row">
      <button type="button" onClick={() => onSelect(list.id)} className={`col-row-btn${active ? ' on' : ''}`}>
        <span className="dot" style={{ background: list.color || '#6366f1' }} />
        <span className="nm">{list.name}</span>
        <span className="ct">{list.place_count ?? 0}</span>
      </button>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); setColorOpen(false) }}
        className="col-row-menu"
        aria-label={t('collections.listMenu')}
      >
        <MoreHorizontal size={15} />
      </button>
      {menuOpen && !colorOpen && (
        <div className="col-pop">
          <button type="button" onClick={() => { setMenuOpen(false); onStartRename(list.id, list.name) }} className="col-pop-item">
            <Pencil size={14} /> {t('collections.editList')}
          </button>
          <button type="button" onClick={() => setColorOpen(true)} className="col-pop-item">
            <Palette size={14} /> {t('collections.listColor')}
          </button>
          {canDelete && (
            <button type="button" onClick={() => { setMenuOpen(false); onRequestDelete(list.id) }} className="col-pop-item danger">
              <Trash2 size={14} /> {t('collections.deleteList')}
            </button>
          )}
        </div>
      )}
      {colorOpen && (
        <div className="col-pop">
          <div className="col-pop-swatches">
            {SWATCHES.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => { onSetColor(list.id, c); setColorOpen(false); setMenuOpen(false) }}
                className="col-swatch"
                style={{ background: c }}
                aria-label={c}
              >
                {list.color === c && <Check size={13} strokeWidth={3} />}
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
 * pseudo-list, owned lists (colour dot + count + rename/colour/delete menu), a
 * shared section, and an incoming-invites block. Styled with the collections
 * glass tokens (`.col-*`); rendered both in the desktop rail and the mobile
 * drawer.
 */
export default function ListsRail(props: ListsRailProps): React.ReactElement {
  const {
    ownedLists, sharedLists, activeId, incomingInvites,
    editingListId, editingName, setEditingName,
    onSelect, onNewList, onStartRename, onCommitRename, onSetColor, onRequestDelete,
    onAcceptInvite, onDeclineInvite, t,
  } = props

  return (
    <>
      <button type="button" onClick={onNewList} className="col-rail-new">
        <Plus size={16} /> {t('collections.newList')}
      </button>

      <div className="col-row">
        <button type="button" onClick={() => onSelect(ALL_SAVED)} className={`col-row-btn${activeId === ALL_SAVED ? ' on' : ''}`}>
          <span className="ico"><Layers size={16} /></span>
          <span className="nm">{t('collections.allSaved')}</span>
        </button>
      </div>

      {ownedLists.length > 0 && <div className="col-rail-sep" />}
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
          <div className="col-rail-label"><Users size={12} /> {t('collections.shared')}</div>
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
          <div className="col-rail-label">
            {t('collections.invites.title')}
            <span className="badge">{incomingInvites.length}</span>
          </div>
          {incomingInvites.map(inv => (
            <div key={inv.collection_id} className="col-invite">
              <div className="t">{inv.name}</div>
              <div className="s">{t('collections.invites.from')} {inv.from.username}</div>
              <div className="col-invite-actions">
                <button type="button" onClick={() => onAcceptInvite(inv.collection_id)} className="col-invite-accept">
                  {t('collections.invites.accept')}
                </button>
                <button type="button" onClick={() => onDeclineInvite(inv.collection_id)} className="col-invite-decline">
                  {t('collections.invites.decline')}
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </>
  )
}
