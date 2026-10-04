import { useId, useRef } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { NOTE_ICONS, getNoteIcon } from './DayPlanSidebar.constants'
import NoteFormatToolbar from '../shared/NoteFormatToolbar'
import NoteColorPicker from '../shared/NoteColorPicker'
import { noteSurface } from './noteSurface'
import { markdownLinkComponents } from '../shared/markdownLink'
import { Tooltip } from '../shared/Tooltip'
import { DeleteButton, DialogButton, DialogFooter, DialogHeader, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { EditorField, TEXTAREA } from '../shared/dialogParts'
import { EYEBROW } from './bookings/bookingParts'
import { tintOf } from './planParts'

interface NoteModalUi {
  mode: 'add' | 'edit'
  noteId?: number
  icon: string
  text: string
  time: string
  color?: string | null
}

type NoteUiMap = Record<string, NoteModalUi | undefined>

interface DayPlanSidebarNoteModalProps {
  noteUi: NoteUiMap
  setNoteUi: (updater: (prev: NoteUiMap) => NoteUiMap) => void
  /**
   * The hook's handle on the title field. The field sits in the dialog's head
   * band now and takes the focus itself when the dialog opens, so the hook's
   * delayed focus call finds nothing to do.
   */
  noteInputRef: React.RefObject<HTMLInputElement>
  cancelNote: (dayId: number) => void
  saveNote: (dayId: number) => void
  /** Asks the planner to confirm and then delete the note being edited (#2249). */
  onRequestDelete: (dayId: number, noteId: number) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

type NoteDialogProps = Omit<DayPlanSidebarNoteModalProps, 'noteUi' | 'noteInputRef'> & { dayId: string; ui: NoteModalUi | undefined }

const BODY_MAX = 2000

/**
 * Add/edit dialog for a day note (#1629), one per day whose note is open.
 *
 * The title is typed into the head band, whose tile already shows the icon in
 * the note's colour. Below it two columns on anything wider than a phone: how
 * the note looks on the left (icon, colour, and a preview of the card it will
 * become), what it says on the right. The preview is the reason the colour
 * picker is worth having: a swatch row tells you nothing about what a tinted
 * card looks like next to a place.
 */
export function DayPlanSidebarNoteModal({ noteUi, setNoteUi, cancelNote, saveNote, onRequestDelete, t }: DayPlanSidebarNoteModalProps) {
  return (
    <>
      {Object.entries(noteUi).map(([dayId, ui]) => (
        <NoteDialog key={dayId} dayId={dayId} ui={ui} setNoteUi={setNoteUi}
          cancelNote={cancelNote} saveNote={saveNote} onRequestDelete={onRequestDelete} t={t} />
      ))}
    </>
  )
}

function NoteDialog({ dayId, ui, ...rest }: NoteDialogProps) {
  return ui ? <OpenNoteDialog dayId={dayId} ui={ui} {...rest} /> : null
}

function OpenNoteDialog({ dayId, ui, setNoteUi, cancelNote, saveNote, onRequestDelete, t }: NoteDialogProps & { ui: NoteModalUi }) {
  const bodyRef = useRef<HTMLTextAreaElement | null>(null)
  const labelId = useId()
  const bodyId = `${labelId}-body`
  const day = Number(dayId)
  const patch = (fields: Partial<NoteModalUi>) =>
    setNoteUi(prev => ({ ...prev, [dayId]: { ...(prev[dayId] as NoteModalUi), ...fields } }))

  const color = ui.color ?? null
  const surface = noteSurface(color)
  const NoteIcon = getNoteIcon(ui.icon)
  const canSave = Boolean(ui.text?.trim())
  const bodyLen = ui.time?.length || 0

  const header = (
    <DialogHeader
      tile={<DialogTile><NoteIcon size={20} strokeWidth={1.9} color={color ?? 'var(--text-muted)'} /></DialogTile>}
      tint={color ? tintOf(color, 12) : NEUTRAL_TINT}
      labelId={labelId}
      onClose={() => cancelNote(day)}
      eyebrow={ui.mode === 'add' ? t('dayplan.noteAdd') : t('dayplan.noteEdit')}
      titleInput={{
        value: ui.text,
        onChange: text => patch({ text }),
        label: t('dayplan.noteTitle'),
        placeholder: t('dayplan.noteTitle'),
        autoFocus: true,
        required: true,
        onKeyDown: e => { if (e.key === 'Enter') saveNote(day) },
      }}
    />
  )

  // Delete lives here rather than on the row: the row's floating pencil/trash
  // pill covered the reorder chevrons and, on a coarse pointer, never went
  // away (#2249). The planner still confirms before it deletes.
  const footer = (
    <DialogFooter>
      {ui.mode === 'edit' && ui.noteId != null && <DeleteButton onClick={() => onRequestDelete(day, ui.noteId!)} />}
      <FooterSpacer />
      <DialogButton onClick={() => cancelNote(day)}>{t('common.cancel')}</DialogButton>
      <DialogButton variant="primary" onClick={() => saveNote(day)} disabled={!canSave}>
        {ui.mode === 'add' ? t('common.add') : t('common.save')}
      </DialogButton>
    </DialogFooter>
  )

  return (
    <DialogShell onClose={() => cancelNote(day)} labelledBy={labelId} width="editor" header={header} footer={footer}>
      <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-[210px_minmax(0,1fr)]">
        {/* Left: how it looks. */}
        <div className="flex min-w-0 flex-col gap-4">
          <EditorField label={t('dayplan.noteIcon')}>
            <div role="group" aria-label={t('dayplan.noteIcon')} className="flex flex-wrap gap-[5px]">
              {NOTE_ICONS.map(({ id, Icon }) => {
                const on = ui.icon === id
                // The icons have no names of their own in the catalogue, so the id is what the tooltip says.
                return (
                  <Tooltip key={id} label={id}>
                    <button type="button" onClick={() => patch({ icon: id })} aria-pressed={on} aria-label={id}
                      className={`grid h-[38px] w-[38px] place-items-center rounded-[10px] border-2 ${on ? 'border-content bg-surface-hover' : 'border-edge-faint hover:bg-surface-hover'}`}>
                      <Icon size={16} strokeWidth={1.8} color={on ? (color ?? 'var(--text-primary)') : 'var(--text-muted)'} />
                    </button>
                  </Tooltip>
                )
              })}
            </div>
          </EditorField>

          <EditorField label={t('notes.color.label')}>
            <NoteColorPicker value={color} onChange={c => patch({ color: c })} />
          </EditorField>

          <EditorField label={t('notes.preview')}>
            {/* The same shape the card takes in the day plan. */}
            <div className="flex items-center gap-2 rounded-[10px] border px-2 py-[7px]" style={{ borderColor: surface.border, background: surface.background }}>
              <span className="grid h-7 w-7 flex-none place-items-center rounded-full" style={{ background: surface.iconBackground }}>
                <NoteIcon size={13} strokeWidth={1.8} color={surface.iconColor} />
              </span>
              <span className="min-w-0 break-words font-medium text-content" style={fs(12.5, 'body')}>
                {ui.text?.trim() || t('dayplan.noteTitle')}
              </span>
            </div>
          </EditorField>
        </div>

        {/* Right: what it says. */}
        <div className="flex min-w-0 flex-col gap-3">
          <div className="min-w-0">
            <div className="mb-[5px] flex flex-wrap items-center justify-between gap-2">
              <label htmlFor={bodyId} className={EYEBROW} style={fs(9.5)}>{t('dayplan.noteSubtitle')}</label>
              <NoteFormatToolbar textareaRef={bodyRef} onChange={v => patch({ time: v })} compact />
            </div>
            <textarea
              id={bodyId}
              ref={bodyRef}
              value={ui.time}
              maxLength={BODY_MAX}
              rows={6}
              onChange={e => patch({ time: e.target.value })}
              placeholder={t('notes.bodyPlaceholder')}
              className={`${TEXTAREA} resize-y`}
            />
            <div className="mt-1 flex justify-between gap-2" style={fs(10.5)}>
              <span className="text-content-faint">{t('notes.markdownHint')}</span>
              <span className={`tabular-nums ${bodyLen >= BODY_MAX - 100 ? 'text-warning' : 'text-content-faint'}`}>{bodyLen}/{BODY_MAX}</span>
            </div>
          </div>

          {ui.time?.trim() && (
            <div className="collab-note-md-full max-h-[200px] overflow-y-auto rounded-[10px] border px-3 py-2.5 leading-[1.55] text-content-muted"
              style={{ ...fs(12, 'body'), borderColor: surface.border, background: surface.background, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
              <Markdown remarkPlugins={[remarkGfm, remarkBreaks]} components={markdownLinkComponents}>{ui.time}</Markdown>
            </div>
          )}
        </div>
      </div>
    </DialogShell>
  )
}
