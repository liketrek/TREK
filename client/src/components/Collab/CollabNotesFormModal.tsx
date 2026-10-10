import { useId, useState, useRef } from 'react'
import { Plus, StickyNote, X } from 'lucide-react'
import { DialogButton, DialogFooter, DialogHeader, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { EditorField, INPUT, TEXTAREA } from '../shared/dialogParts'
import { Tooltip } from '../shared/Tooltip'
import { useCanDo } from '../../store/permissionsStore'
import { useTripStore } from '../../store/tripStore'
import { AuthedImg } from './CollabNotesAuthedImg'
import type { CollabNote } from './CollabNotes.types'

// ── New Note Modal (portal to body) ─────────────────────────────────────────
interface NoteFormModalProps {
  onClose: () => void
  onSubmit: (data: { title: string; content: string; category: string | null; website: string | null; color?: string | null; _pendingFiles?: File[]; files?: File[] }) => Promise<void>
  onDeleteFile?: (noteId: number, fileId: number) => Promise<void>
  existingCategories: string[]
  categoryColors: Record<string, string>
  getCategoryColor: (category: string) => string
  note: CollabNote | null
  tripId: number
  t: (key: string) => string
}

export function NoteFormModal({ onClose, onSubmit, onDeleteFile, existingCategories, categoryColors, getCategoryColor, note, tripId, t }: NoteFormModalProps) {
  const can = useCanDo()
  const tripObj = useTripStore((s) => s.trip)
  const canUploadFiles = can('file_upload', tripObj)
  const isEdit = !!note
  const allCategories = [...new Set([...existingCategories, ...Object.keys(categoryColors || {})])].filter(Boolean)

  const [title, setTitle] = useState(note?.title || '')
  const [content, setContent] = useState(note?.content || '')
  const [category, setCategory] = useState(note?.category || allCategories[0] || '')
  const [website, setWebsite] = useState(note?.website || '')
  const [pendingFiles, setPendingFiles] = useState([])
  const [existingAttachments, setExistingAttachments] = useState(note?.attachments || [])
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef(null)

  const finalCategory = category
  const labelId = useId()

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        category: finalCategory || null,
        color: getCategoryColor(finalCategory),
        website: website.trim() || null,
        _pendingFiles: pendingFiles,
      })
      onClose()
    } catch {
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAttachment = async (fileId) => {
    if (onDeleteFile && note) {
      await onDeleteFile(note.id, fileId)
      setExistingAttachments(prev => prev.filter(a => a.id !== fileId))
    }
  }

  const canSubmit = title.trim() && !submitting

  const tint = category ? `color-mix(in srgb, ${getCategoryColor(category)} 12%, transparent)` : NEUTRAL_TINT
  const chip = 'flex items-center gap-1 rounded-full border border-edge-faint bg-surface-secondary px-2 py-[3px] text-content-muted'

  return (
    <DialogShell
      onClose={onClose}
      labelledBy={labelId}
      // Only the close button takes a note away: a stray click or key must not lose what was written.
      blocked
      onPaste={e => {
        if (!canUploadFiles) return
        const items = e.clipboardData?.items
        if (!items) return
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/') || item.type === 'application/pdf') {
            e.preventDefault()
            const file = item.getAsFile()
            if (file) setPendingFiles(prev => [...prev, file])
            return
          }
        }
      }}
      header={(
        <DialogHeader
          tile={<DialogTile><StickyNote size={20} strokeWidth={1.9} style={{ color: category ? getCategoryColor(category) : 'var(--text-muted)' }} /></DialogTile>}
          tint={tint}
          labelId={labelId}
          onClose={onClose}
          eyebrow={isEdit ? t('collab.notes.edit') : t('collab.notes.new')}
          titleInput={{
            value: title,
            onChange: setTitle,
            label: t('collab.notes.titlePlaceholder'),
            placeholder: t('collab.notes.titlePlaceholder'),
            autoFocus: true,
            onKeyDown: e => { if (e.key === 'Enter') void handleSubmit() },
          }}
        />
      )}
      footer={(
        <DialogFooter>
          <FooterSpacer />
          <DialogButton onClick={onClose}>{t('common.cancel')}</DialogButton>
          <DialogButton variant="primary" onClick={() => void handleSubmit()} disabled={!canSubmit}>
            {submitting ? '...' : isEdit ? t('collab.notes.save') : t('collab.notes.create')}
          </DialogButton>
        </DialogFooter>
      )}
    >
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <EditorField label={t('collab.notes.content')} htmlFor={`${labelId}-content`}>
          <textarea id={`${labelId}-content`} value={content} onChange={e => setContent(e.target.value)} placeholder={t('collab.notes.contentPlaceholder')}
            rows={7} className={`${TEXTAREA} resize-y`} />
        </EditorField>

        {allCategories.length > 0 && (
          <EditorField label={t('collab.notes.category')}>
            <div className="flex flex-wrap gap-1.5">
              {allCategories.map(cat => {
                const c = getCategoryColor(cat)
                const active = category === cat
                return (
                  <button key={cat} type="button" onClick={() => setCategory(cat)} aria-pressed={active}
                    className="rounded-full px-3 py-1 font-semibold"
                    style={{ ...fs(12, 'body'), border: active ? `1.5px solid ${c}` : '1px solid var(--border-faint)', background: active ? `color-mix(in srgb, ${c} 12%, transparent)` : 'var(--bg-card)', color: active ? c : 'var(--text-muted)' }}>
                    {cat}
                  </button>
                )
              })}
            </div>
          </EditorField>
        )}

        <EditorField label={t('collab.notes.website')} htmlFor={`${labelId}-website`}>
          <input id={`${labelId}-website`} value={website} onChange={e => setWebsite(e.target.value)} placeholder={t('collab.notes.websitePlaceholder')} className={INPUT} />
        </EditorField>

        {canUploadFiles && (
          <EditorField label={t('collab.notes.attachFiles')}>
            <input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={e => { const files = e.target.files; if (files?.length) setPendingFiles(prev => [...prev, ...Array.from(files)]); e.target.value = '' }} />
            <div className="flex flex-wrap items-center gap-1.5" style={fs(11.5)}>
              {/* Existing attachments (edit mode) */}
              {existingAttachments.map(a => {
                const isImage = a.mime_type?.startsWith('image/')
                return (
                  <div key={a.id} className={chip}>
                    {isImage && <AuthedImg src={a.url} style={{ width: 18, height: 18, objectFit: 'cover', borderRadius: 999 }} />}
                    {(a.original_name || '').length > 20 ? a.original_name.slice(0, 17) + '...' : a.original_name}
                    <Tooltip label={t('common.delete')}>
                      <button type="button" onClick={() => handleDeleteAttachment(a.id)} aria-label={t('common.delete')} className="flex text-danger">
                        <X size={11} />
                      </button>
                    </Tooltip>
                  </div>
                )
              })}
              {/* New pending files */}
              {pendingFiles.map((f, i) => (
                <div key={`new-${i}`} className={chip}>
                  {f.name.length > 20 ? f.name.slice(0, 17) + '...' : f.name}
                  <button type="button" onClick={() => setPendingFiles(prev => prev.filter((_, j) => j !== i))} aria-label={t('common.delete')} className="flex text-content-faint hover:text-content">
                    <X size={11} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-edge px-3 py-[3px] font-semibold text-content-muted hover:text-content">
                <Plus size={11} /> {t('files.attach') || 'Add'}
              </button>
            </div>
          </EditorField>
        )}
      </form>
    </DialogShell>
  )
}
