import { Check, Layers, Plus, X } from 'lucide-react'
import type { Collection } from '@trek/shared'
import type { TranslationFn } from '../../../types'
import type { ActiveCollectionId } from '../../../store/collectionStore'
import type { IncomingCollectionInvite } from '../../../store/collectionStore'
import { ALL_SAVED } from '../../../store/collectionStore'
import MSheet from '../../components/MSheet'
import { Eyebrow } from './MCollSheetKit'

interface MCollListsDrawerProps {
  open: boolean
  onClose: () => void
  ownedLists: Collection[]
  sharedLists: Collection[]
  activeId: ActiveCollectionId
  incomingInvites: IncomingCollectionInvite[]
  onSelect: (id: ActiveCollectionId) => void
  onNewList: () => void
  onAcceptInvite: (collectionId: number) => void
  onDeclineInvite: (collectionId: number) => void
  t: TranslationFn
}

function ListRow({ list, active, onClick }: { list: Collection; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mb-1 flex w-full items-center gap-[10px] rounded-[13px] px-3 py-[11px] text-left ${active ? 'bg-[color:var(--m-ic)]' : ''}`}
      style={active ? { boxShadow: `inset 0 0 0 1.5px ${list.color || '#6366F1'}` } : undefined}
    >
      <span className="h-[9px] w-[9px] flex-none rounded-full" style={{ background: list.color || '#6366F1' }} />
      <span className="min-w-0 flex-1 truncate text-[0.84375rem] font-semibold text-m-ink">{list.name}</span>
      <span className="font-geist text-[0.6875rem] font-bold text-m-faint">{list.place_count ?? 0}</span>
    </button>
  )
}

/**
 * The left lists drawer: new list, the "All saved" union, the owned and shared
 * lists, and — when present — incoming share invites with accept/decline.
 */
export default function MCollListsDrawer({
  open, onClose, ownedLists, sharedLists, activeId, incomingInvites,
  onSelect, onNewList, onAcceptInvite, onDeclineInvite, t,
}: MCollListsDrawerProps) {
  return (
    <MSheet open={open} onClose={onClose} variant="drawer" material="opaque" ariaLabel={t('collections.title')}>
      <div className="flex h-full min-h-0 flex-col px-[18px] py-5">
        <div className="flex flex-none justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--m-ic)] text-m-ink"
          >
            <X size={15} strokeWidth={2.2} />
          </button>
        </div>
        <button
          type="button"
          onClick={onNewList}
          className="mt-[6px] flex flex-none items-center gap-2 rounded-[14px] border border-dashed border-[color:var(--m-rowbr)] px-[14px] py-3 text-[0.8125rem] font-bold text-m-muted"
        >
          <Plus size={15} strokeWidth={2.2} /> {t('collections.newList')}
        </button>
        <button
          type="button"
          onClick={() => onSelect(ALL_SAVED)}
          className={`mt-[10px] flex flex-none items-center gap-[9px] rounded-[11px] px-[6px] py-[10px] text-[0.84375rem] font-semibold text-m-ink ${activeId === ALL_SAVED ? 'bg-[color:var(--m-ic)]' : ''}`}
        >
          <Layers size={16} strokeWidth={2} /> {t('collections.allSaved')}
        </button>
        <div className="my-2 h-px flex-none bg-[color:var(--m-rowbr)]" />
        <div className="min-h-0 flex-1 overflow-y-auto">
          {ownedLists.map(l => (
            <ListRow key={l.id} list={l} active={activeId === l.id} onClick={() => onSelect(l.id)} />
          ))}
          {sharedLists.length > 0 && (
            <>
              <Eyebrow className="mb-[6px] mt-3 px-1 uppercase">{t('collections.shared')}</Eyebrow>
              {sharedLists.map(l => (
                <ListRow key={l.id} list={l} active={activeId === l.id} onClick={() => onSelect(l.id)} />
              ))}
            </>
          )}
          {incomingInvites.length > 0 && (
            <>
              <Eyebrow className="mb-[6px] mt-3 px-1 uppercase">{t('collections.invites.title')}</Eyebrow>
              {incomingInvites.map(inv => (
                <div
                  key={inv.collection_id}
                  className="mb-1 flex items-center gap-[10px] rounded-[13px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] px-3 py-[10px]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.8125rem] font-semibold text-m-ink">{inv.name}</span>
                    <span className="block truncate font-geist text-[0.625rem] text-m-muted">
                      {t('collections.invites.from')} {inv.from.username}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onAcceptInvite(inv.collection_id)}
                    aria-label={t('collections.invites.accept')}
                    className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-m-act text-m-actfg"
                  >
                    <Check size={13} strokeWidth={2.6} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeclineInvite(inv.collection_id)}
                    aria-label={t('collections.invites.decline')}
                    className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[color:var(--m-ic)] text-m-ink"
                  >
                    <X size={13} strokeWidth={2.4} />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </MSheet>
  )
}
