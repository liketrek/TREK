import React, { useId, useState } from 'react'
import { Plus, Settings2, Trash2, Loader2 } from 'lucide-react'
import { DialogButton, DialogHeader, DialogSection, DialogShell, DialogTile, NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { INPUT, PANEL } from '../shared/dialogParts'
import { Tooltip } from '../shared/Tooltip'
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
    <div className="flex flex-none flex-wrap items-center gap-1.5">
      {SWATCHES.map(c => {
        const on = value.toLowerCase() === c
        return (
          <button
            key={c}
            type="button"
            onClick={() => onPick(c)}
            aria-label={c}
            aria-pressed={on}
            className="h-5 w-5 rounded-full p-0 transition-transform"
            style={{
              background: c,
              outline: on ? '2px solid var(--text-primary)' : '2px solid transparent',
              outlineOffset: 1.5,
              transform: on ? 'scale(1.08)' : 'scale(1)',
            }}
          />
        )
      })}
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
    <div className="flex items-center gap-2.5 rounded-[12px] bg-surface-secondary py-1.5 ps-3 pe-1.5">
      <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: color }} />
      {/* Transparent on the row until pointed at or typed in; the dark: variants
          outrank the global dark rule that paints every input. */}
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        onBlur={commitName}
        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
        maxLength={60}
        className="-ms-1.5 min-w-0 flex-1 rounded-[8px] border-0 bg-transparent px-1.5 py-1 font-semibold text-content outline-none hover:bg-surface-card focus:bg-surface-card focus:shadow-sm dark:bg-transparent dark:hover:bg-surface-card dark:focus:bg-surface-card"
        style={fs(13, 'body')}
        aria-label={t('collections.labels.name')}
      />
      <Swatches value={color} onPick={pickColor} />
      {busy && <Loader2 size={14} className="flex-none animate-spin text-content-faint" />}
      <Tooltip label={t('common.delete')}>
        <button type="button" onClick={() => onDelete(label.id)} aria-label={t('common.delete')}
          className="grid h-7 w-7 flex-none place-items-center rounded-full text-content-faint hover:bg-surface-card hover:text-danger">
          <Trash2 size={13} />
        </button>
      </Tooltip>
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
  const labelId = useId()

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

  // Every change is saved as it is made, so there is nothing to confirm in a footer.
  return (
    <DialogShell
      open={isOpen}
      onClose={onClose}
      labelledBy={labelId}
      width="narrow"
      header={(
        <DialogHeader
          tile={<DialogTile><Settings2 size={20} strokeWidth={1.9} className="text-content-muted" /></DialogTile>}
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={onClose}
          title={t('collections.labels.manage')}
        />
      )}
    >
      <DialogSection label={t('collections.labels.title')}>
        {labels.length === 0 ? (
          <p className="m-0 rounded-[12px] bg-surface-secondary px-4 py-5 text-center text-content-faint" style={fs(12.5, 'body')}>{t('collections.labels.empty')}</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {labels.map(l => <LabelRow key={l.id} label={l} onUpdate={onUpdate} onDelete={onDelete} t={t} />)}
          </div>
        )}

        <div className={`${PANEL} mt-3`}>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: newColor }} />
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') void add() }}
              maxLength={60}
              placeholder={t('collections.labels.namePlaceholder')}
              className={`${INPUT} flex-1`}
            />
            <DialogButton
              variant="primary"
              onClick={add}
              disabled={!newName.trim() || adding}
              icon={adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} strokeWidth={2.2} />}
            >
              {t('collections.labels.add')}
            </DialogButton>
          </div>
          <Swatches value={newColor} onPick={setNewColor} />
        </div>
      </DialogSection>
    </DialogShell>
  )
}
