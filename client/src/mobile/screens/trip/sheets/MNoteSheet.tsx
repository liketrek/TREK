import { useEffect, useState } from 'react'
import MSheet from '../../../components/MSheet'
import { NOTE_ICONS } from '../../../../components/Planner/DayPlanSidebar.constants'
import { useTripStore } from '../../../../store/tripStore'
import { Eyebrow, FIELD_AREA_CLS, FIELD_CLS, FormSheetFooter, FormSheetHeader } from './PlSheetChrome'
import type { DayNote } from '../../../../types'
import type { TripPlanner } from '../MTripShell'

/** shell.openSheet('note', payload) — omit `note` to create on the day. */
export interface MNoteSheetPayload {
  dayId?: number
  note?: DayNote
}

export interface MNoteSheetProps {
  planner: TripPlanner
  open: boolean
  payload?: MNoteSheetPayload
  onClose: () => void
}

const DETAIL_MAX = 250

/**
 * Day-note sheet: the demo's icon grid over title + detail. Persists through
 * the trip store's day-note actions — `text` is the title, the `time` column
 * doubles as the free-text detail (max 250, a leading HH:MM sorts the note
 * chronologically in the timeline), `icon` is one of the shared NOTE_ICONS.
 */
export default function MNoteSheet({ planner, open, payload, onClose }: MNoteSheetProps) {
  const { t, toast, tripId, selectedDayId, tripActions } = planner

  const [icon, setIcon] = useState('FileText')
  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  // Open-time snapshot — the payload disappears with shell.sheet on close, but
  // the sheet still shows through its exit animation.
  const [sheetPayload, setSheetPayload] = useState<MNoteSheetPayload | undefined>(undefined)

  useEffect(() => {
    if (!open) return
    setSheetPayload(payload)
    setIcon(payload?.note?.icon || 'FileText')
    setTitle(payload?.note?.text || '')
    setDetail(payload?.note?.time || '')
  }, [open, payload])

  const note = sheetPayload?.note ?? null
  const dayId = sheetPayload?.dayId ?? selectedDayId

  const handleSubmit = async () => {
    if (!title.trim() || !dayId || isSaving) return
    setIsSaving(true)
    try {
      if (note) {
        await tripActions.updateDayNote(tripId, dayId, note.id, { text: title.trim(), time: detail || null, icon })
      } else {
        // Append at the end of the day timeline: after the last assignment or note.
        const state = useTripStore.getState()
        const maxKey = Math.max(
          -1,
          ...(state.assignments[String(dayId)] ?? []).map(a => a.order_index ?? 0),
          ...(state.dayNotes[String(dayId)] ?? []).map(n => n.sort_order ?? 0),
        )
        await tripActions.addDayNote(tripId, dayId, {
          text: title.trim(),
          time: detail || null,
          icon,
          sort_order: maxKey + 1,
        })
      }
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!note || !dayId) return
    try {
      await tripActions.deleteDayNote(tripId, dayId, note.id)
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
    }
  }

  return (
    <MSheet open={open} onClose={onClose} ariaLabel={note ? t('dayplan.noteEdit') : t('dayplan.noteAdd')}>
      <FormSheetHeader
        title={note ? t('dayplan.noteEdit') : t('dayplan.noteAdd')}
        onClose={onClose}
        closeLabel={t('common.close')}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[6px] pt-1">
        <div className="grid grid-cols-6 gap-[7px]">
          {NOTE_ICONS.map(({ id, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setIcon(id)}
              aria-label={id}
              aria-pressed={icon === id}
              className={`flex h-[42px] items-center justify-center rounded-[12px] border border-[color:var(--m-rowbr)] ${
                icon === id ? 'bg-m-act text-m-actfg' : 'bg-[color:var(--m-ic)] text-m-muted'
              }`}
            >
              <Icon size={17} strokeWidth={1.8} />
            </button>
          ))}
        </div>

        <Eyebrow className="mb-[5px] mt-[14px] uppercase">{t('dayplan.noteTitle')} *</Eyebrow>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={500}
          placeholder={`${t('dayplan.noteTitle')} *`}
          className={FIELD_CLS}
        />

        <Eyebrow className="mb-[5px] mt-3 uppercase">{t('dayplan.noteSubtitle')}</Eyebrow>
        <textarea
          value={detail}
          onChange={e => setDetail(e.target.value)}
          rows={3}
          maxLength={DETAIL_MAX}
          placeholder={t('dayplan.noteSubtitle')}
          className={FIELD_AREA_CLS}
        />
        <div
          className={`mt-1 flex justify-end font-geist text-[0.59375rem] ${
            detail.length >= DETAIL_MAX - 10 ? 'text-[color:var(--m-st-pending)]' : 'text-m-faint'
          }`}
        >
          {detail.length}/{DETAIL_MAX}
        </div>
      </div>

      <FormSheetFooter
        onDelete={note ? handleDelete : undefined}
        deleteLabel={t('common.delete')}
        onCancel={onClose}
        cancelLabel={t('common.cancel')}
        onSubmit={handleSubmit}
        submitLabel={note ? t('common.save') : t('common.add')}
        submitDisabled={!title.trim() || isSaving}
      />
    </MSheet>
  )
}
