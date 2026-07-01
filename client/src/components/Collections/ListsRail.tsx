import React from 'react'
import { Plus, Layers, Users } from 'lucide-react'
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
  onAcceptInvite: (id: number) => void
  onDeclineInvite: (id: number) => void
  t: TranslationFn
}

function ListRow({ list, active, onSelect }: { list: Collection; active: boolean; onSelect: (id: number) => void }): React.ReactElement {
  return (
    <div className="col-row">
      <button type="button" onClick={() => onSelect(list.id)} className={`col-row-btn${active ? ' on' : ''}`}>
        <span className="dot" style={{ background: list.color || '#6366f1' }} />
        <span className="nm">{list.name}</span>
        <span className="ct">{list.place_count ?? 0}</span>
      </button>
    </div>
  )
}

/**
 * Left rail of the user's lists: a "New list" action, the "All saved" union
 * pseudo-list, owned lists (colour dot + count), a shared section, and an
 * incoming-invites block. Selecting a list makes it active; editing / deleting
 * happens from the Edit button in the hero of the active list.
 */
export default function ListsRail(props: ListsRailProps): React.ReactElement {
  const {
    ownedLists, sharedLists, activeId, incomingInvites,
    onSelect, onNewList, onAcceptInvite, onDeclineInvite, t,
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
        <ListRow key={list.id} list={list} active={activeId === list.id} onSelect={onSelect} />
      ))}

      {sharedLists.length > 0 && (
        <>
          <div className="col-rail-label"><Users size={12} /> {t('collections.shared')}</div>
          {sharedLists.map(list => (
            <ListRow key={list.id} list={list} active={activeId === list.id} onSelect={onSelect} />
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
