import React, { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import { Plus, Layers, MoreHorizontal, Pencil, Trash2, Users } from 'lucide-react'
import type { Collection } from '@trek/shared'
import type { TranslationFn } from '../../types'
import { ALL_SAVED } from '../../store/collectionStore'
import type { ActiveCollectionId, IncomingCollectionInvite } from '../../store/collectionStore'

interface ListsRailProps {
  ownedLists: Collection[]
  sharedLists: Collection[]
  activeId: ActiveCollectionId
  incomingInvites: IncomingCollectionInvite[]
  onSelect: (id: ActiveCollectionId) => void
  onNewList: () => void
  onEdit: (list: Collection) => void
  onRequestDelete: (id: number) => void
  onAcceptInvite: (id: number) => void
  onDeclineInvite: (id: number) => void
  t: TranslationFn
}

interface ListRowProps {
  list: Collection
  active: boolean
  onSelect: (id: number) => void
  onEdit: (list: Collection) => void
  onRequestDelete: (id: number) => void
  t: TranslationFn
}

function ListRow({ list, active, onSelect, onEdit, onRequestDelete, t }: ListRowProps): React.ReactElement {
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  // Owner or accepted member may edit any accessible list; only the owner may
  // delete it.
  const canDelete = list.is_owner !== false

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (open) { setOpen(false); return }
    const r = btnRef.current?.getBoundingClientRect()
    if (r) setAnchor({ top: r.bottom + 6, right: Math.max(8, window.innerWidth - r.right) })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    const onDown = (e: MouseEvent) => {
      const el = e.target as HTMLElement
      if (rowRef.current?.contains(el) || el.closest?.('[data-list-pop]')) return
      close()
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('mousedown', onDown, true)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('mousedown', onDown, true)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [open])

  const popover = open && anchor && ReactDOM.createPortal(
    <div
      data-list-pop
      className="fixed z-[300] min-w-[172px] p-1.5 rounded-xl bg-surface-card border border-edge shadow-dropdown"
      style={{ top: anchor.top, right: anchor.right }}
    >
      <button type="button" onClick={() => { setOpen(false); onEdit(list) }} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-content-secondary hover:bg-surface-hover">
        <Pencil size={14} /> {t('common.edit')}
      </button>
      {canDelete && (
        <button type="button" onClick={() => { setOpen(false); onRequestDelete(list.id) }} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-danger hover:bg-danger-soft">
          <Trash2 size={14} /> {t('collections.deleteList')}
        </button>
      )}
    </div>,
    document.body,
  )

  return (
    <div ref={rowRef} className={`col-row${open ? ' menu-open' : ''}`}>
      <button type="button" onClick={() => onSelect(list.id)} className={`col-row-btn${active ? ' on' : ''}`}>
        <span className="dot" style={{ background: list.color || '#6366f1' }} />
        <span className="nm">{list.name}</span>
        <span className="ct">{list.place_count ?? 0}</span>
      </button>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className="col-row-menu"
        aria-label={t('collections.listMenu')}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal size={16} />
      </button>
      {popover}
    </div>
  )
}

/**
 * Left rail of the user's lists: a "New list" action, the "All saved" union
 * pseudo-list, owned lists (colour dot + count + an always-visible kebab →
 * edit/delete), a shared section, and an incoming-invites block. Editing opens
 * the shared ListEditorModal (name/colour/cover/description/links) via onEdit.
 */
export default function ListsRail(props: ListsRailProps): React.ReactElement {
  const {
    ownedLists, sharedLists, activeId, incomingInvites,
    onSelect, onNewList, onEdit, onRequestDelete,
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
        <ListRow key={list.id} list={list} active={activeId === list.id} onSelect={onSelect} onEdit={onEdit} onRequestDelete={onRequestDelete} t={t} />
      ))}

      {sharedLists.length > 0 && (
        <>
          <div className="col-rail-label"><Users size={12} /> {t('collections.shared')}</div>
          {sharedLists.map(list => (
            <ListRow key={list.id} list={list} active={activeId === list.id} onSelect={onSelect} onEdit={onEdit} onRequestDelete={onRequestDelete} t={t} />
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
