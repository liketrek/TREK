import React, { useId, useState } from 'react'
import { Check, Loader2, Settings2, Tags } from 'lucide-react'
import { DialogButton, DialogFooter, DialogHeader, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs } from '../shared/DialogShell'
import type { CollectionLabel } from '@trek/shared'
import type { TranslationFn } from '../../types'

interface BulkAssignLabelModalProps {
  isOpen: boolean
  labels: CollectionLabel[]
  /** Number of selected places the labels will be added to. */
  count: number
  onAssign: (labelIds: number[]) => Promise<void> | void
  /** Open the label manager to create labels first. */
  onManage: () => void
  onClose: () => void
  t: TranslationFn
}

/**
 * Pick one or more of the list's labels to add to every selected place. Additive
 * — it never removes labels a place already has. When the list has no labels yet,
 * it points the user at the label manager instead.
 */
export default function BulkAssignLabelModal({ isOpen, labels, count, onAssign, onManage, onClose, t }: BulkAssignLabelModalProps): React.ReactElement {
  const [picked, setPicked] = useState<number[]>([])
  const [busy, setBusy] = useState(false)
  const labelId = useId()

  const toggle = (id: number) => setPicked(picked.includes(id) ? picked.filter(x => x !== id) : [...picked, id])

  const assign = async () => {
    if (picked.length === 0 || busy) return
    setBusy(true)
    try {
      await onAssign(picked)
      setPicked([])
    } finally {
      setBusy(false)
    }
  }

  return (
    <DialogShell
      open={isOpen}
      onClose={onClose}
      labelledBy={labelId}
      width="narrow"
      header={(
        <DialogHeader
          tile={<DialogTile><Tags size={20} strokeWidth={1.9} className="text-content-muted" /></DialogTile>}
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={onClose}
          title={t('collections.labels.assignN', { count })}
        />
      )}
      footer={labels.length === 0 ? undefined : (
        <DialogFooter>
          <DialogButton onClick={onManage} icon={<Settings2 size={14} strokeWidth={2.2} />}>{t('collections.labels.manage')}</DialogButton>
          <FooterSpacer />
          <DialogButton onClick={onClose}>{t('common.cancel')}</DialogButton>
          <DialogButton
            variant="primary"
            onClick={assign}
            disabled={picked.length === 0 || busy}
            icon={busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={2.2} />}
          >
            {t('collections.labels.assign')}
          </DialogButton>
        </DialogFooter>
      )}
    >
      {labels.length === 0 ? (
        <div className="flex flex-col items-center px-4 py-6 text-center">
          <div className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-surface-secondary text-content-faint">
            <Tags size={20} />
          </div>
          <p className="m-0 mb-4 text-content-faint" style={fs(13, 'body')}>{t('collections.labels.emptyHint')}</p>
          <DialogButton variant="primary" onClick={onManage} icon={<Settings2 size={14} strokeWidth={2.2} />}>{t('collections.labels.manage')}</DialogButton>
        </div>
      ) : (
        <div className="flex flex-col gap-0.5 rounded-[14px] border border-edge-faint bg-surface-secondary p-1.5">
          {labels.map(l => {
            const on = picked.includes(l.id)
            return (
              <button
                key={l.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(l.id)}
                className={`flex min-h-[44px] items-center gap-3 rounded-[10px] px-3 py-2 text-start ${on ? 'bg-surface-card shadow-sm' : 'hover:bg-surface-card'}`}
              >
                <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: l.color || '#6366f1' }} /* theme-lint-disable: the label's own colour, and the first swatch of the label manager for one without */ />
                <span className="min-w-0 flex-1 truncate font-semibold text-content" style={fs(13, 'body')}>{l.name}</span>
                <span className={`grid h-6 w-6 flex-none place-items-center rounded-[8px] ${on ? 'bg-accent text-accent-text' : 'border border-edge bg-surface-card text-transparent'}`}>
                  <Check size={13} />
                </span>
              </button>
            )
          })}
        </div>
      )}
    </DialogShell>
  )
}
