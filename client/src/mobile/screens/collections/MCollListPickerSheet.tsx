import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { Collection } from '@trek/shared'
import type { TranslationFn } from '../../../types'
import MSheet from '../../components/MSheet'
import { SheetHeader } from './MCollSheetKit'

export type MCollListPickerMode = 'move' | 'copy'

interface MCollListPickerSheetProps {
  /** null = closed; kept mounted for the exit animation. */
  mode: MCollListPickerMode | null
  lists: Collection[]
  count: number
  onPick: (targetId: number) => Promise<void>
  onClose: () => void
  t: TranslationFn
}

/** Target-list picker for moving / duplicating the selection into another list. */
export default function MCollListPickerSheet({ mode, lists, count, onPick, onClose, t }: MCollListPickerSheetProps) {
  const [held, setHeld] = useState<MCollListPickerMode | null>(mode)
  if (mode && mode !== held) setHeld(mode)
  const [busyId, setBusyId] = useState<number | null>(null)

  const title = held === 'move'
    ? t('collections.moveToListTitle', { count })
    : t('collections.duplicateToListTitle', { count })

  const pick = async (id: number) => {
    if (busyId != null) return
    setBusyId(id)
    try {
      await onPick(id)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <MSheet open={mode != null} onClose={onClose} material="opaque" ariaLabel={title}>
      <SheetHeader title={title} onClose={onClose} closeLabel={t('common.close')} />
      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[18px] pt-[14px]">
        {lists.length === 0 ? (
          <div className="py-8 text-center font-geist text-[0.78125rem] text-m-faint">{t('collections.noOtherLists')}</div>
        ) : (
          lists.map(list => (
            <button
              key={list.id}
              type="button"
              onClick={() => pick(list.id)}
              disabled={busyId != null}
              className="mb-1 flex w-full items-center gap-[10px] rounded-[13px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] px-3 py-[11px] text-left disabled:opacity-60"
            >
              <span className="h-[9px] w-[9px] flex-none rounded-full" style={{ background: list.color || '#6366F1' }} />
              <span className="min-w-0 flex-1 truncate text-[0.84375rem] font-semibold text-m-ink">{list.name}</span>
              {busyId === list.id
                ? <Loader2 size={13} className="flex-none animate-spin text-m-faint" />
                : <span className="font-geist text-[0.6875rem] font-bold text-m-faint">{list.place_count ?? 0}</span>}
            </button>
          ))
        )}
      </div>
    </MSheet>
  )
}
