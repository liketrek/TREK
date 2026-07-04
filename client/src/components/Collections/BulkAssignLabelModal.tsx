import React, { useState } from 'react'
import { Check, Loader2, Settings2, Tags } from 'lucide-react'
import Modal from '../shared/Modal'
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
    <Modal isOpen={isOpen} onClose={onClose} title={t('collections.labels.assignN', { count })} size="sm">
      {labels.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <Tags size={26} className="text-content-faint" />
          <p className="text-[13px] text-content-faint">{t('collections.labels.emptyHint')}</p>
          <button type="button" onClick={onManage} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-edge text-[13px] text-content hover:bg-surface-hover">
            <Settings2 size={14} /> {t('collections.labels.manage')}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1 max-h-[46vh] overflow-y-auto -mx-1 px-1">
            {labels.map(l => {
              const on = picked.includes(l.id)
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => toggle(l.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-colors ${on ? 'border-accent bg-accent/10' : 'border-edge bg-surface-card hover:bg-surface-hover'}`}
                >
                  <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: l.color || '#6366f1' }} />
                  <span className="flex-1 min-w-0 text-[13px] font-medium text-content truncate">{l.name}</span>
                  {on && <Check size={15} className="text-accent shrink-0" />}
                </button>
              )
            })}
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-edge">
            <button type="button" onClick={onManage} className="mr-auto flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] text-content-secondary hover:bg-surface-hover">
              <Settings2 size={14} /> {t('collections.labels.manage')}
            </button>
            <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg border border-edge text-content-secondary text-[13px] hover:bg-surface-hover">
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={assign}
              disabled={picked.length === 0 || busy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} {t('collections.labels.assign')}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
