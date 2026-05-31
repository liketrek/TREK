import ReactDOM from 'react-dom'
import { useState, useRef } from 'react'
import { Plus, X } from 'lucide-react'
import { useCanDo } from '../../store/permissionsStore'
import { useTripStore } from '../../store/tripStore'
import { FONT } from './CollabNotes.constants'
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

  const handleSubmit = async (e) => {
    e.preventDefault()
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

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--overlay-bg, rgba(0,0,0,0.35))',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 16,
        fontFamily: FONT,
      }}
    >
      <form
        style={{
          background: 'var(--bg-card)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 400,
          maxHeight: '90vh',
          overflow: 'auto',
          border: '1px solid var(--border-faint)',
        }}
        onClick={e => e.stopPropagation()}
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
        onSubmit={handleSubmit}
      >
        {/* Modal header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px 12px',
          borderBottom: '1px solid var(--border-faint)',
        }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0,
            fontFamily: FONT,
          }}>
            {isEdit ? t('collab.notes.edit') : t('collab.notes.new')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-faint)',
              padding: 2,
              borderRadius: 6,
              display: 'flex',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal body */}
        <div style={{
          padding: '14px 16px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          {/* Title */}
          <div>
            <div style={{
              fontSize: 9,
              fontWeight: 600,
              color: 'var(--text-faint)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 4,
              fontFamily: FONT,
            }}>
              {t('collab.notes.title')}
            </div>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t('collab.notes.titlePlaceholder')}
              style={{
                width: '100%',
                border: '1px solid var(--border-primary)',
                borderRadius: 10,
                padding: '8px 12px',
                fontSize: 13,
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Content */}
          <div>
            <div style={{
              fontSize: 9,
              fontWeight: 600,
              color: 'var(--text-faint)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 4,
              fontFamily: FONT,
            }}>
              {t('collab.notes.contentPlaceholder')}
            </div>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={t('collab.notes.contentPlaceholder')}
              style={{
                width: '100%',
                border: '1px solid var(--border-primary)',
                borderRadius: 10,
                padding: '8px 12px',
                fontSize: 13,
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'vertical',
                minHeight: 180,
                lineHeight: 1.5,
              }}
            />
          </div>

          {/* Category pills */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, fontFamily: FONT }}>
              {t('collab.notes.category')}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {allCategories.map(cat => {
                const c = getCategoryColor(cat)
                const active = category === cat
                return (
                  <button key={cat} type="button" onClick={() => setCategory(cat)}
                    style={{ padding: '4px 12px', borderRadius: 99, border: active ? `1.5px solid ${c}` : '1px solid var(--border-faint)', background: active ? `${c}18` : 'transparent', color: active ? c : 'var(--text-muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
                    {cat}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Website */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, fontFamily: FONT }}>
              {t('collab.notes.website')}
            </div>
            <input value={website} onChange={e => setWebsite(e.target.value)}
              placeholder={t('collab.notes.websitePlaceholder')}
              style={{ width: '100%', border: '1px solid var(--border-primary)', borderRadius: 10, padding: '8px 12px', fontSize: 13, background: 'var(--bg-input)', color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {/* File attachments */}
          {canUploadFiles && <div>
            <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, fontFamily: FONT }}>
              {t('collab.notes.attachFiles')}
            </div>
            <input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={e => { const files = e.target.files; if (files?.length) setPendingFiles(prev => [...prev, ...Array.from(files)]); e.target.value = '' }} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Existing attachments (edit mode) */}
              {existingAttachments.map(a => {
                const isImage = a.mime_type?.startsWith('image/')
                return (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 8, background: 'var(--bg-secondary)', fontSize: 11, color: 'var(--text-muted)' }}>
                    {isImage && <AuthedImg src={a.url} style={{ width: 18, height: 18, objectFit: 'cover', borderRadius: 3 }} />}
                    {(a.original_name || '').length > 20 ? a.original_name.slice(0, 17) + '...' : a.original_name}
                    <button type="button" onClick={() => handleDeleteAttachment(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 0, display: 'flex' }}>
                      <X size={10} />
                    </button>
                  </div>
                )
              })}
              {/* New pending files */}
              {pendingFiles.map((f, i) => (
                <div key={`new-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 8, background: 'var(--bg-secondary)', fontSize: 11, color: 'var(--text-muted)' }}>
                  {f.name.length > 20 ? f.name.slice(0, 17) + '...' : f.name}
                  <button type="button" onClick={() => setPendingFiles(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 0, display: 'flex' }}>
                    <X size={10} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => fileRef.current?.click()}
                style={{ padding: '4px 10px', borderRadius: 8, border: '1px dashed var(--border-faint)', background: 'transparent', cursor: 'pointer', color: 'var(--text-faint)', fontSize: 11, fontFamily: FONT, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Plus size={11} /> {t('files.attach') || 'Add'}
              </button>
            </div>
          </div>}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              width: '100%',
              borderRadius: 99,
              padding: '7px 14px',
              background: canSubmit ? 'var(--accent)' : 'var(--border-primary)',
              color: canSubmit ? 'var(--accent-text)' : 'var(--text-faint)',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: FONT,
              border: 'none',
              cursor: canSubmit ? 'pointer' : 'default',
              marginTop: 4,
            }}
          >
            {submitting ? '...' : isEdit ? t('collab.notes.save') : t('collab.notes.create')}
          </button>
        </div>
      </form>
    </div>,
    document.body
  )
}
