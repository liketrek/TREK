import React, { useId, useMemo, useState } from 'react'
import { Search, ArrowRight, Copy, CopyPlus, FolderInput, Loader2 } from 'lucide-react'
import { DialogButton, DialogFooter, DialogHeader, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { INPUT } from '../shared/dialogParts'
import type { Collection } from '@trek/shared'
import type { TranslationFn } from '../../types'

interface MoveToListModalProps {
  mode: 'move' | 'copy'
  /** Candidate target lists (owned, excluding the current one). */
  lists: Collection[]
  /** Number of selected places. */
  count: number
  onPick: (targetId: number) => Promise<void> | void
  onClose: () => void
  t: TranslationFn
}

/**
 * Target-list picker for moving or duplicating the selected places into another
 * of the user's lists. `mode` only changes the wording + the icons; the action
 * itself is the parent's onPick.
 */
export default function MoveToListModal({ mode, lists, count, onPick, onClose, t }: MoveToListModalProps): React.ReactElement {
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState<number | null>(null)
  const labelId = useId()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? lists.filter(l => l.name.toLowerCase().includes(q)) : lists
  }, [lists, search])

  const pick = async (id: number) => {
    if (busy != null) return
    setBusy(id)
    try { await onPick(id) } finally { setBusy(null) }
  }

  // The head tile repeats the icon of the selection bar button that opened the dialog.
  const Tile = mode === 'move' ? FolderInput : CopyPlus
  const Trailing = mode === 'move' ? ArrowRight : Copy

  return (
    <DialogShell
      onClose={onClose}
      labelledBy={labelId}
      width="narrow"
      align="top"
      header={(
        <DialogHeader
          tile={<DialogTile><Tile size={20} strokeWidth={1.9} className="text-content-muted" /></DialogTile>}
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={onClose}
          title={mode === 'move' ? t('collections.moveToListTitle', { count }) : t('collections.duplicateToListTitle', { count })}
        />
      )}
      footer={(
        <DialogFooter>
          <FooterSpacer />
          <DialogButton onClick={onClose}>{t('common.cancel')}</DialogButton>
        </DialogFooter>
      )}
    >
      {lists.length > 3 && (
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-faint" aria-hidden="true" />
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('collections.copyToTripSearch')}
            aria-label={t('collections.copyToTripSearch')}
            className={`${INPUT} pl-8`}
          />
        </div>
      )}
      {filtered.length === 0 ? (
        <p className="m-0 rounded-[12px] bg-surface-secondary px-4 py-6 text-center text-content-faint" style={fs(12.5, 'body')}>{t('collections.noOtherLists')}</p>
      ) : (
        <div className="flex flex-col gap-0.5 rounded-[14px] border border-edge-faint bg-surface-secondary p-1.5">
          {filtered.map(list => {
            const isBusy = busy === list.id
            return (
              <button
                key={list.id}
                type="button"
                onClick={() => pick(list.id)}
                disabled={busy != null}
                className="flex min-h-[48px] items-center gap-3 rounded-[10px] px-3 py-2 text-left hover:bg-surface-card disabled:opacity-60"
              >
                <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: list.color || '#6366f1' }} /* theme-lint-disable: the list's own colour, and the default a list without one is drawn in (ListsRail) */ />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-content" style={fs(13, 'body')}>{list.name}</span>
                  <span className="block text-content-faint" style={fs(11.5)}>{t('collections.placeCount', { count: list.place_count ?? 0 })}</span>
                </span>
                {isBusy ? <Loader2 size={15} className="flex-none animate-spin text-content-faint" /> : <Trailing size={15} className="flex-none text-content-faint" />}
              </button>
            )
          })}
        </div>
      )}
    </DialogShell>
  )
}
