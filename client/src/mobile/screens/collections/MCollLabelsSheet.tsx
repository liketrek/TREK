import { useEffect, useState } from 'react'
import { Check, Pencil, Plus, Tag, Trash2 } from 'lucide-react'
import type { CollectionLabelUpdateRequest } from '@trek/shared'
import type { TranslationFn } from '../../../types'
import type { LabelOption } from '../../../pages/collections/collectionsModel'
import MSheet from '../../components/MSheet'
import { SWATCH_COLORS } from './collectionsMobileModel'
import { Eyebrow, INPUT_CLS, PrimaryPill, SheetFooter, SheetHeader } from './MCollSheetKit'

export type MCollLabelsMode = 'manage' | 'assign'

interface MCollLabelsSheetProps {
  open: boolean
  mode: MCollLabelsMode
  labels: LabelOption[]
  /** Selection size, for the assign title. */
  selectedCount: number
  onCreate: (name: string, color?: string) => Promise<void>
  onUpdate: (labelId: number, body: CollectionLabelUpdateRequest) => Promise<void>
  onDelete: (labelId: number) => Promise<void>
  onAssign: (labelIds: number[]) => Promise<void>
  onSwitchToManage: () => void
  onClose: () => void
  t: TranslationFn
}

/**
 * The list's custom labels. Manage mode creates / renames / recolours /
 * deletes labels; assign mode toggles labels onto the current selection.
 */
export default function MCollLabelsSheet({
  open, mode, labels, selectedCount, onCreate, onUpdate, onDelete, onAssign, onSwitchToManage, onClose, t,
}: MCollLabelsSheetProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(SWATCH_COLORS[0])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [checked, setChecked] = useState<number[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) return
    setName('')
    setColor(SWATCH_COLORS[0])
    setEditingId(null)
    setChecked([])
  }, [open])

  const startEdit = (label: LabelOption) => {
    setEditingId(label.id)
    setName(label.name)
    setColor(label.color || SWATCH_COLORS[0])
  }

  const submit = async () => {
    const trimmed = name.trim()
    if (!trimmed || busy) return
    setBusy(true)
    try {
      if (editingId != null) await onUpdate(editingId, { name: trimmed, color })
      else await onCreate(trimmed, color)
      setName('')
      setColor(SWATCH_COLORS[0])
      setEditingId(null)
    } finally {
      setBusy(false)
    }
  }

  const assign = async () => {
    if (checked.length === 0 || busy) return
    setBusy(true)
    try {
      await onAssign(checked)
    } finally {
      setBusy(false)
    }
  }

  const toggleChecked = (id: number) =>
    setChecked(checked.includes(id) ? checked.filter(x => x !== id) : [...checked, id])

  const title = mode === 'assign' ? t('collections.labels.assignN', { count: selectedCount }) : t('collections.labels.manage')

  return (
    <MSheet open={open} onClose={onClose} material="opaque" ariaLabel={title}>
      <SheetHeader title={title} onClose={onClose} closeLabel={t('common.close')} />
      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[18px] pt-4">
        {mode === 'manage' && (
          <>
            <Eyebrow className="mb-2">{t('collections.labels.add').toUpperCase()}</Eyebrow>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submit() }}
              placeholder={t('collections.labels.namePlaceholder')}
              className={INPUT_CLS}
            />
            <div className="mt-[11px] flex flex-wrap gap-[9px]">
              {SWATCH_COLORS.map(col => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setColor(col)}
                  aria-label={col}
                  aria-pressed={color === col}
                  className={`h-7 w-7 rounded-full ${color === col ? 'outline outline-2 outline-offset-2 outline-[color:var(--m-act)]' : ''}`}
                  style={{ background: col }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={submit}
              disabled={!name.trim() || busy}
              className="mt-[14px] flex w-full items-center justify-center gap-[6px] rounded-[12px] bg-m-act p-[11px] text-[0.78125rem] font-bold text-m-actfg disabled:opacity-40"
            >
              {editingId != null ? <Check size={14} strokeWidth={2.4} /> : <Plus size={14} strokeWidth={2.4} />}
              {editingId != null ? t('common.save') : t('collections.labels.add')}
            </button>
            <div className="mt-4 h-px bg-[color:var(--m-rowbr)]" />
          </>
        )}

        {labels.length === 0 ? (
          <div className="flex flex-col items-center gap-[6px] px-0 pb-1 pt-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--m-ic)] text-m-faint">
              <Tag size={19} strokeWidth={1.8} />
            </span>
            <div className="font-geist text-[0.71875rem] text-m-faint">{t('collections.labels.empty')}</div>
            {mode === 'assign' && (
              <div className="text-center font-geist text-[0.6875rem] text-m-faint">{t('collections.labels.emptyHint')}</div>
            )}
          </div>
        ) : (
          <div className={mode === 'manage' ? 'mt-2' : ''}>
            {labels.map(label => {
              const col = label.color || SWATCH_COLORS[0]
              const on = mode === 'assign' && checked.includes(label.id)
              return (
                <div
                  key={label.id}
                  className={`mb-1 flex items-center gap-[10px] rounded-[13px] px-3 py-[10px] ${editingId === label.id || on ? 'bg-[color:var(--m-ic)]' : ''}`}
                  style={on ? { boxShadow: `inset 0 0 0 1.5px ${col}` } : undefined}
                  onClick={mode === 'assign' ? () => toggleChecked(label.id) : undefined}
                  role={mode === 'assign' ? 'checkbox' : undefined}
                  aria-checked={mode === 'assign' ? on : undefined}
                >
                  <span className="h-[9px] w-[9px] flex-none rounded-full" style={{ background: col }} />
                  <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-semibold text-m-ink">{label.name}</span>
                  <span className="font-geist text-[0.6875rem] font-bold text-m-faint">{label.count}</span>
                  {mode === 'manage' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => startEdit(label)}
                        aria-label={t('common.edit')}
                        className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-m-muted active:bg-[color:var(--m-ic)]"
                      >
                        <Pencil size={13} strokeWidth={2.2} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(label.id)}
                        aria-label={t('common.delete')}
                        className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-[color:var(--m-st-danger)] active:bg-[color:var(--m-ic)]"
                      >
                        <Trash2 size={13} strokeWidth={2.2} />
                      </button>
                    </>
                  ) : (
                    on && <Check size={15} strokeWidth={2.6} style={{ color: col }} />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      {mode === 'assign' && (
        <SheetFooter>
          <button type="button" onClick={onSwitchToManage} className="text-[0.75rem] font-bold text-m-muted">
            {t('collections.labels.manage')}
          </button>
          <PrimaryPill className="ml-auto" onClick={assign} disabled={checked.length === 0 || busy}>
            <Tag size={13} strokeWidth={2.4} /> {t('collections.labels.assign')}
          </PrimaryPill>
        </SheetFooter>
      )}
    </MSheet>
  )
}
