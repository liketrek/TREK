import React, { useId } from 'react'
import { Bookmark, BookmarkCheck, Check, CheckCircle2, Loader2, Plus } from 'lucide-react'
import { DialogButton, DialogFooter, DialogHeader, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, PILL, fs } from '../shared/DialogShell'
import { useTranslation } from '../../i18n'
import StatusBadge from './StatusBadge'
import { VISITED_EVERYWHERE_BUSY, useSaveToCollection } from './useSaveToCollection'

/**
 * Globally-mounted list picker for the "Save to Collection" entry points
 * (PlaceInspector footer button + the two trip-sidebar context menus). Reads the
 * active target from saveToCollectionStore, shows every list the user owns or
 * co-owns, and toggles the place in/out of each — a check marks the lists that
 * already hold it. Each change refreshes membership and bumps the store version
 * so the inspector bookmark indicator stays in sync. One mount, no prop drilling.
 */
export default function SaveToCollectionModal(): React.ReactElement | null {
  const { target, close, lists, loading, busyId, savedByCollection, unvisited, handleStatus, handleVisitedEverywhere, handleToggle, openCollections } = useSaveToCollection()
  const { t } = useTranslation()
  const labelId = useId()

  if (!target) return null

  return (
    <DialogShell
      onClose={close}
      labelledBy={labelId}
      width="narrow"
      header={(
        <DialogHeader
          tile={<DialogTile><Bookmark size={20} strokeWidth={1.9} className="text-content-muted" /></DialogTile>}
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={close}
          eyebrow={t('collections.pickList')}
          title={target.name}
          // One tap for "I have been here", however many lists hold it (#1469).
          pills={unvisited.length > 0 ? (
            <button type="button" onClick={handleVisitedEverywhere} disabled={busyId != null}
              className={`${PILL} hover:opacity-80 disabled:opacity-60`}>
              {busyId === VISITED_EVERYWHERE_BUSY ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} strokeWidth={2.2} />}
              {unvisited.length > 1 ? t('collections.markVisitedAll') : t('collections.markVisited')}
            </button>
          ) : undefined}
        />
      )}
      footer={lists.length > 0 ? (
        <DialogFooter>
          <DialogButton onClick={openCollections} icon={<Bookmark size={14} strokeWidth={2.2} />}>{t('collections.viewInCollection')}</DialogButton>
          <FooterSpacer />
        </DialogFooter>
      ) : undefined}
    >
      {loading ? (
        <div className="flex items-center justify-center py-8 text-content-faint">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : lists.length === 0 ? (
        <div className="flex flex-col items-center px-4 py-6 text-center">
          <div className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-surface-secondary text-content-faint">
            <Bookmark size={20} />
          </div>
          <p className="m-0 mb-4 text-content-faint" style={fs(13, 'body')}>{t('collections.noListsYet')}</p>
          <DialogButton variant="primary" onClick={openCollections} icon={<Plus size={14} strokeWidth={2.2} />}>{t('collections.newList')}</DialogButton>
        </div>
      ) : (
        <div className="flex flex-col gap-0.5 rounded-[14px] border border-edge-faint bg-surface-secondary p-1.5">
          {lists.map(list => {
            const entry = savedByCollection.get(list.id)
            const saved = !!entry
            const busy = busyId === list.id
            return (
              <button
                key={list.id}
                type="button"
                aria-pressed={saved}
                onClick={() => handleToggle(list)}
                disabled={busyId != null}
                className={`flex min-h-[46px] items-center gap-3 rounded-[10px] px-3 py-2 text-start disabled:opacity-60 ${saved ? 'bg-surface-card shadow-sm' : 'hover:bg-surface-card'}`}
              >
                <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: list.color || 'var(--accent)' }} />
                <span className="min-w-0 flex-1 truncate font-semibold text-content" style={fs(13, 'body')}>{list.name}</span>
                {list.is_owner === false && (
                  <span className="flex-none rounded-full bg-surface-tertiary px-2 py-[2px] font-semibold text-content-muted" style={fs(10.5)}>{t('collections.shared')}</span>
                )}
                {/* Per-list status, so one place can be an idea in one list and
                    visited in another. A role=button span, safe to nest here. */}
                {entry && (
                  <StatusBadge
                    status={entry.status}
                    showLabel={false}
                    size={12}
                    onChange={entry.can_edit ? next => { void handleStatus(entry, next) } : undefined}
                    t={t}
                  />
                )}
                <span className={`grid h-6 w-6 flex-none place-items-center rounded-[8px] ${saved ? 'bg-accent text-accent-text' : 'border border-edge bg-surface-card text-transparent'}`}>
                  {busy ? <Loader2 size={13} className="animate-spin text-content-faint" /> : saved ? <BookmarkCheck size={13} /> : <Check size={13} />}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </DialogShell>
  )
}
