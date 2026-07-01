import React, { useMemo, useState } from 'react'
import { Search, ArrowRight, Copy, Loader2, Bookmark } from 'lucide-react'
import Modal from '../shared/Modal'
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
 * of the user's lists. `mode` only changes the wording + the trailing icon; the
 * action itself is the parent's onPick.
 */
export default function MoveToListModal({ mode, lists, count, onPick, onClose, t }: MoveToListModalProps): React.ReactElement {
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState<number | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? lists.filter(l => l.name.toLowerCase().includes(q)) : lists
  }, [lists, search])

  const pick = async (id: number) => {
    if (busy != null) return
    setBusy(id)
    try { await onPick(id) } finally { setBusy(null) }
  }

  const Trailing = mode === 'move' ? ArrowRight : Copy

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={mode === 'move' ? t('collections.moveToListTitle', { count }) : t('collections.duplicateToListTitle', { count })}
      size="sm"
    >
      <div className="flex flex-col gap-3">
        {lists.length > 3 && (
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-content-faint" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('collections.copyToTripSearch')}
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-edge bg-surface-input text-content text-[13px] outline-none focus:border-accent"
            />
          </div>
        )}
        {filtered.length === 0 ? (
          <p className="text-center text-[13px] text-content-faint py-8">{t('collections.noOtherLists')}</p>
        ) : (
          <div className="flex flex-col gap-1 max-h-[50vh] overflow-y-auto -mx-1 px-1">
            {filtered.map(list => {
              const isBusy = busy === list.id
              return (
                <button
                  key={list.id}
                  type="button"
                  onClick={() => pick(list.id)}
                  disabled={busy != null}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-edge bg-surface-card text-left hover:bg-surface-hover transition-colors disabled:opacity-60"
                >
                  <span className="w-9 h-9 min-w-[36px] rounded-lg flex items-center justify-center shrink-0 text-white" style={{ background: list.color || '#6366f1' }}>
                    <Bookmark size={15} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-semibold text-content truncate">{list.name}</span>
                    <span className="block text-[11.5px] text-content-faint">{t('collections.placeCount', { count: list.place_count ?? 0 })}</span>
                  </span>
                  {isBusy ? <Loader2 size={15} className="animate-spin text-content-faint shrink-0" /> : <Trailing size={15} className="text-content-faint shrink-0" />}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </Modal>
  )
}
