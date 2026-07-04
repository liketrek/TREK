import React, { useState } from 'react'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import Modal from '../shared/Modal'
import type { CollectionLabel, CollectionLabelUpdateRequest } from '@trek/shared'
import type { TranslationFn } from '../../types'

const SWATCHES = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#64748b']

interface LabelManagerProps {
  isOpen: boolean
  labels: CollectionLabel[]
  onCreate: (name: string, color?: string) => Promise<void> | void
  onUpdate: (labelId: number, body: CollectionLabelUpdateRequest) => Promise<void> | void
  onDelete: (labelId: number) => Promise<void> | void
  onClose: () => void
  t: TranslationFn
}

/** Swatch row shared by the create form and each row's recolor control. */
function Swatches({ value, onPick }: { value: string; onPick: (c: string) => void }): React.ReactElement {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {SWATCHES.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => onPick(c)}
          className={`w-5 h-5 rounded-full border transition-transform ${value.toLowerCase() === c ? 'border-content scale-110' : 'border-transparent'}`}
          style={{ background: c }}
          aria-label={c}
        />
      ))}
    </div>
  )
}

/** One existing label: inline rename (save on blur/Enter), recolor, delete. */
function LabelRow({ label, onUpdate, onDelete, t }: {
  label: CollectionLabel
  onUpdate: LabelManagerProps['onUpdate']
  onDelete: LabelManagerProps['onDelete']
  t: TranslationFn
}): React.ReactElement {
  const [name, setName] = useState(label.name)
  const [color, setColor] = useState(label.color || '#6366f1')
  const [busy, setBusy] = useState(false)

  const commitName = async () => {
    const trimmed = name.trim()
    if (!trimmed || trimmed === label.name) { setName(label.name); return }
    setBusy(true)
    try { await onUpdate(label.id, { name: trimmed }) } finally { setBusy(false) }
  }
  const pickColor = async (c: string) => {
    setColor(c)
    setBusy(true)
    try { await onUpdate(label.id, { color: c }) } finally { setBusy(false) }
  }

  return (
    <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl border border-edge bg-surface-card">
      <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: color }} />
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        onBlur={commitName}
        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
        maxLength={60}
        className="flex-1 min-w-0 bg-transparent text-[13px] text-content outline-none"
        aria-label={t('collections.labels.name')}
      />
      <Swatches value={color} onPick={pickColor} />
      {busy && <Loader2 size={14} className="animate-spin text-content-faint shrink-0" />}
      <button type="button" onClick={() => onDelete(label.id)} className="p-1 text-content-faint hover:text-danger shrink-0" aria-label={t('common.delete')}>
        <Trash2 size={14} />
      </button>
    </div>
  )
}

/**
 * Manage a list's custom labels — create, rename, recolor and delete. Available
 * to any member who can edit the list; the labels are shared by the whole list.
 */
export default function LabelManager({ isOpen, labels, onCreate, onUpdate, onDelete, onClose, t }: LabelManagerProps): React.ReactElement {
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(SWATCHES[0])
  const [adding, setAdding] = useState(false)

  const add = async () => {
    const trimmed = newName.trim()
    if (!trimmed || adding) return
    setAdding(true)
    try {
      await onCreate(trimmed, newColor)
      setNewName('')
      setNewColor(SWATCHES[0])
    } finally {
      setAdding(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('collections.labels.manage')} size="sm">
      <div className="flex flex-col gap-3">
        {labels.length === 0 ? (
          <p className="text-center text-[13px] text-content-faint py-4">{t('collections.labels.empty')}</p>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-[46vh] overflow-y-auto -mx-1 px-1">
            {labels.map(l => <LabelRow key={l.id} label={l} onUpdate={onUpdate} onDelete={onDelete} t={t} />)}
          </div>
        )}

        <div className="flex flex-col gap-2 pt-3 border-t border-edge">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: newColor }} />
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') add() }}
              maxLength={60}
              placeholder={t('collections.labels.namePlaceholder')}
              className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-edge bg-surface-input text-content text-[13px] outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={add}
              disabled={!newName.trim() || adding}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-50 shrink-0"
            >
              {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} {t('collections.labels.add')}
            </button>
          </div>
          <Swatches value={newColor} onPick={setNewColor} />
        </div>
      </div>
    </Modal>
  )
}
