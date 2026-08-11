import { useEffect, useRef, useState } from 'react'
import MSheet from '../../../components/MSheet'
import { ChevronDown } from 'lucide-react'
import { NOTE_COLORS } from '@trek/shared'
import { NOTE_ICONS, getNoteIcon } from '../../../../components/Planner/DayPlanSidebar.constants'
import { noteSurface } from '../../../../components/Planner/noteSurface'
import NoteFormatToolbar from '../../../../components/shared/NoteFormatToolbar'
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

const DETAIL_MAX = 2000

/**
 * Day-note sheet: the demo's icon grid over title + detail. Persists through
 * the trip store's day-note actions — `text` is the title, the `time` column
 * doubles as the free-text detail (max 250, a leading HH:MM sorts the note
 * chronologically in the timeline), `icon` is one of the shared NOTE_ICONS.
 */
export default function MNoteSheet({ planner, open, payload, onClose }: MNoteSheetProps) {
  const { t, toast, tripId, selectedDayId, tripActions } = planner

  const [icon, setIcon] = useState('FileText')
  const [color, setColor] = useState<string | null>(null)
  // Thirty-two icons in a six-wide grid is most of a phone screen, so the grid
  // is folded behind the chosen one, which doubles as the colour preview.
  const [iconOpen, setIconOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')
  const detailRef = useRef<HTMLTextAreaElement | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  // Open-time snapshot — the payload disappears with shell.sheet on close, but
  // the sheet still shows through its exit animation.
  const [sheetPayload, setSheetPayload] = useState<MNoteSheetPayload | undefined>(undefined)

  // Keyed on what the payload points AT, not on its object identity — a caller
  // that rebuilds the payload inline (or a store refresh of the note) must not
  // reseed the fields under the user's fingers.
  const payloadNoteId = payload?.note?.id
  const payloadDayId = payload?.dayId
  useEffect(() => {
    if (!open) return
    setSheetPayload(payload)
    setIcon(payload?.note?.icon || 'FileText')
    setColor(payload?.note?.color ?? null)
    setIconOpen(false)
    setTitle(payload?.note?.text || '')
    setDetail(payload?.note?.time || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, payloadNoteId, payloadDayId])

  const note = sheetPayload?.note ?? null
  const dayId = sheetPayload?.dayId ?? selectedDayId
  const skin = noteSurface(color)
  const ChosenIcon = getNoteIcon(icon)

  const handleSubmit = async () => {
    if (!title.trim() || !dayId || isSaving) return
    setIsSaving(true)
    try {
      if (note) {
        await tripActions.updateDayNote(tripId, dayId, note.id, { text: title.trim(), time: detail || null, icon, color })
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
          color,
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
        <Eyebrow className="mb-[7px] uppercase">{t('notes.appearance')}</Eyebrow>
        <div className="flex items-center gap-[10px]">
          {/* The chosen icon in the chosen colour: the picker and the preview
              are the same control, which is the only way both fit above the
              fold on a phone. */}
          <button
            type="button"
            onClick={() => setIconOpen(v => !v)}
            aria-expanded={iconOpen}
            aria-label={t('dayplan.noteIcon')}
            className="relative flex h-[46px] w-[46px] flex-none items-center justify-center rounded-[14px] border"
            style={{ borderColor: skin.border, background: skin.iconBackground }}
          >
            <ChosenIcon size={19} strokeWidth={1.9} style={{ color: skin.iconColor }} />
            <ChevronDown
              size={11}
              strokeWidth={2.4}
              className={`absolute bottom-[3px] right-[3px] text-m-faint transition-transform duration-200 ${iconOpen ? 'rotate-180' : ''}`}
            />
          </button>

          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-[7px]">
            <button
              type="button"
              onClick={() => setColor(null)}
              aria-pressed={color === null}
              aria-label={t('notes.color.none')}
              className={`h-[26px] w-[26px] rounded-full border-2 border-dashed border-[color:var(--m-rowbr)] ${
                color === null ? 'ring-2 ring-[color:var(--m-act)] ring-offset-2 ring-offset-[color:var(--m-card)]' : ''
              }`}
            />
            {NOTE_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-pressed={color === c}
                aria-label={c}
                className={`h-[26px] w-[26px] rounded-full ${
                  color === c ? 'ring-2 ring-[color:var(--m-act)] ring-offset-2 ring-offset-[color:var(--m-card)]' : ''
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        {iconOpen && (
          <div className="mt-[9px] grid grid-cols-6 gap-[7px]">
            {NOTE_ICONS.map(({ id, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => { setIcon(id); setIconOpen(false) }}
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
        )}

        <Eyebrow className="mb-[5px] mt-[14px] uppercase">{t('dayplan.noteTitle')} *</Eyebrow>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={500}
          placeholder={`${t('dayplan.noteTitle')} *`}
          className={FIELD_CLS}
        />

        <div className="mb-[6px] mt-3 flex items-center justify-between gap-2">
          <Eyebrow className="uppercase">{t('dayplan.noteSubtitle')}</Eyebrow>
          <NoteFormatToolbar textareaRef={detailRef} onChange={setDetail} compact variant="mobile" />
        </div>
        <textarea
          ref={detailRef}
          value={detail}
          onChange={e => setDetail(e.target.value)}
          rows={4}
          maxLength={DETAIL_MAX}
          placeholder={t('notes.bodyPlaceholder')}
          className={FIELD_AREA_CLS}
        />
        <div className="mt-1 flex items-center justify-between gap-2 font-geist text-[0.59375rem]">
          <span className="text-m-faint">{t('notes.markdownHint')}</span>
          <span className={detail.length >= DETAIL_MAX - 100 ? 'text-[color:var(--m-st-pending)]' : 'text-m-faint'}>
            {detail.length}/{DETAIL_MAX}
          </span>
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
