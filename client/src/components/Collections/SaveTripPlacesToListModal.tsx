import React, { useId } from 'react'
import { Search, Bookmark, ArrowRight, Loader2 } from 'lucide-react'
import { DialogButton, DialogFooter, DialogHeader, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { INPUT } from '../shared/dialogParts'
import { useTranslation } from '../../i18n'
import { useSaveTripPlacesToList } from './useSaveTripPlacesToList'

interface SaveTripPlacesToListModalProps {
  isOpen: boolean
  tripId: number
  /** The selected trip place ids to copy into the chosen list. */
  placeIds: number[]
  onClose: () => void
  /** Called after a successful save (e.g. to clear the trip selection). */
  onDone: () => void
}

/**
 * Bulk "save to collection" for the trip place list: pick one of the user's lists
 * and copy every selected trip place into it at once (server dedups by name/coords).
 */
export default function SaveTripPlacesToListModal({ isOpen, tripId, placeIds, onClose, onDone }: SaveTripPlacesToListModalProps): React.ReactElement | null {
  const { t } = useTranslation()
  const labelId = useId()
  const { lists, loading, search, setSearch, filtered, busyId, pick } = useSaveTripPlacesToList({
    open: isOpen, tripId, placeIds, onClose, onDone,
  })

  if (!isOpen) return null

  return (
    <DialogShell
      onClose={onClose}
      labelledBy={labelId}
      width="narrow"
      align="top"
      header={(
        <DialogHeader
          tile={<DialogTile><Bookmark size={20} strokeWidth={1.9} className="text-content-muted" /></DialogTile>}
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={onClose}
          title={t('collections.saveNToList', { count: placeIds.length })}
          sub={t('collections.saveToListHint')}
        />
      )}
      footer={(
        <DialogFooter>
          <FooterSpacer />
          <DialogButton onClick={onClose}>{t('common.cancel')}</DialogButton>
        </DialogFooter>
      )}
    >
      {lists.length > 5 && (
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-content-faint" aria-hidden="true" />
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('collections.searchLists')}
            aria-label={t('collections.searchLists')}
            className={`${INPUT} ps-8`}
          />
        </div>
      )}
      {loading ? (
        <div className="flex items-center justify-center py-8 text-content-faint"><Loader2 size={20} className="animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <p className="m-0 rounded-[12px] bg-surface-secondary px-4 py-6 text-center text-content-faint" style={fs(12.5, 'body')}>{t('collections.noOwnLists')}</p>
      ) : (
        <div className="flex flex-col gap-0.5 rounded-[14px] border border-edge-faint bg-surface-secondary p-1.5">
          {filtered.map(list => {
            const busy = busyId === list.id
            return (
              <button
                key={list.id}
                type="button"
                onClick={() => pick(list)}
                disabled={busyId != null}
                className="flex min-h-[48px] items-center gap-3 rounded-[10px] px-3 py-2 text-start hover:bg-surface-card disabled:opacity-60"
              >
                <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: list.color || '#6366f1' }} /* theme-lint-disable: the list's own colour, and the default a list without one is drawn in (ListsRail) */ />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-content" style={fs(13, 'body')}>{list.name}</span>
                  <span className="block text-content-faint" style={fs(11.5)}>{t('collections.placeCount', { count: list.place_count ?? 0 })}</span>
                </span>
                {busy ? <Loader2 size={15} className="flex-none animate-spin text-content-faint" /> : <ArrowRight size={15} className="flex-none text-content-faint" />}
              </button>
            )
          })}
        </div>
      )}
    </DialogShell>
  )
}
