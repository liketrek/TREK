import ReactDOM from 'react-dom'
import { useState, useRef, useEffect } from 'react'
import { Upload, X } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { reservationsApi, healthApi } from '../../api/client'
import { useBackgroundTasksStore } from '../../store/backgroundTasksStore'
import { saveImportFiles } from '../../db/offlineDb'

interface BookingImportModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: number
}

const ACCEPTED_EXTS = ['.eml', '.pdf', '.pkpass', '.html', '.htm', '.txt']
const MAX_FILE_BYTES = 10 * 1024 * 1024
const MAX_FILES = 5

/**
 * Upload booking files and kick off a BACKGROUND parse. The modal closes at once;
 * the parse runs server-side and is tracked by the global BackgroundTasksWidget
 * (progress over the WebSocket). When it finishes, the trip page opens the per-item
 * review flow — so the user can navigate and keep editing while it works.
 */
export default function BookingImportModal({ isOpen, onClose, tripId }: BookingImportModalProps) {
  const { t } = useTranslation()
  const addTask = useBackgroundTasksStore((s) => s.addTask)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mouseDownTarget = useRef<EventTarget | null>(null)

  const [files, setFiles] = useState<File[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [aiParsing, setAiParsing] = useState(false)

  const reset = () => {
    setFiles([])
    setIsDragOver(false)
    setLoading(false)
    setError('')
  }

  useEffect(() => {
    if (isOpen) reset()
    // reset is stable — intentional
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    healthApi.features().then((f) => setAiParsing(!!f.aiParsing)).catch(() => setAiParsing(false))
  }, [isOpen])

  const handleClose = () => { reset(); onClose() }

  const validateFile = (f: File): string | null => {
    const ext = ('.' + f.name.toLowerCase().split('.').pop()) as string
    if (!ACCEPTED_EXTS.includes(ext)) return t('reservations.import.unsupportedFormat')
    if (f.size > MAX_FILE_BYTES) return t('reservations.import.fileTooLarge', { name: f.name })
    return null
  }

  const selectFiles = (incoming: File[]) => {
    const valid: File[] = []
    let firstErr: string | null = null
    for (const f of incoming.slice(0, MAX_FILES)) {
      const err = validateFile(f)
      if (err) { firstErr = firstErr ?? err; continue }
      valid.push(f)
    }
    if (valid.length === 0) { setError(firstErr ?? ''); return }
    setFiles(valid)
    setError(firstErr ?? '')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files ? Array.from(e.target.files) : []
    e.target.value = ''
    if (list.length) selectFiles(list)
  }

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true) }
  const handleDragLeave = (e: React.DragEvent) => { if (e.target === e.currentTarget) setIsDragOver(false) }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const list = Array.from(e.dataTransfer.files)
    if (list.length) selectFiles(list)
  }

  // Start the parse in the background and close — the widget takes it from here.
  const handleParse = async () => {
    if (files.length === 0 || loading) return
    setLoading(true)
    setError('')
    try {
      const mode = aiParsing ? 'fallback-on-empty' : 'no-ai'
      const { jobId } = await reservationsApi.importBookingAsync(tripId, files, mode)
      // Keep the uploaded files so the review can attach each source document to its booking —
      // in memory for the immediate path, and in IndexedDB so it survives a reload mid-parse.
      await saveImportFiles(jobId, files)
      addTask({ id: jobId, tripId: String(tripId), label: files.map((f) => f.name).join(', '), total: files.length, files })
      handleClose()
    } catch (err: any) {
      setError(err?.response?.data?.error ?? t('reservations.import.error'))
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return ReactDOM.createPortal(
    <div
      className="bg-[rgba(0,0,0,0.4)]"
      style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onMouseDown={(e) => { mouseDownTarget.current = e.target }}
      onClick={(e) => {
        if (e.target === e.currentTarget && mouseDownTarget.current === e.currentTarget) handleClose()
        mouseDownTarget.current = null
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-card"
        style={{ borderRadius: 16, width: '100%', maxWidth: 540, padding: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', fontFamily: 'var(--font-system)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1, fontSize: 'calc(15px * var(--fs-scale-subtitle, 1))', fontWeight: 700, color: 'var(--text-primary)' }}>
            {t('reservations.import.title')}
          </div>
          <button onClick={handleClose} className="bg-transparent text-content-faint" style={{ border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <div style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', color: 'var(--text-faint)', marginBottom: 14, lineHeight: 1.45 }}>
            {t('reservations.import.acceptedFormats')}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTS.join(',')}
            multiple
            style={{ display: 'none' }}
            onChange={handleInputChange}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={isDragOver ? 'bg-surface-tertiary' : 'bg-transparent'}
            style={{
              width: '100%', minHeight: 100, borderRadius: 12,
              border: `2px dashed ${isDragOver ? 'var(--accent)' : 'var(--border-primary)'}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 6, fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500, cursor: 'pointer',
              marginBottom: 12, padding: 16, boxSizing: 'border-box',
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            <Upload size={18} strokeWidth={1.8} color={isDragOver ? 'var(--accent)' : 'var(--text-faint)'} style={{ pointerEvents: 'none' }} />
            {isDragOver ? (
              <span className="text-accent" style={{ pointerEvents: 'none' }}>{t('reservations.import.dropActive')}</span>
            ) : files.length > 0 ? (
              <span style={{ color: 'var(--text-primary)', textAlign: 'center', wordBreak: 'break-all', pointerEvents: 'none' }}>{files.map((f) => f.name).join(', ')}</span>
            ) : (
              <span style={{ color: 'var(--text-faint)', textAlign: 'center', pointerEvents: 'none' }}>{t('reservations.import.dropHere')}</span>
            )}
          </div>

          {error && (
            <div className="bg-[rgba(239,68,68,0.08)] text-[#b91c1c]" style={{ border: '1px solid rgba(239,68,68,0.35)', borderRadius: 10, padding: '8px 10px', fontSize: 'calc(12px * var(--fs-scale-body, 1))', whiteSpace: 'pre-wrap', marginTop: 8 }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-faint)' }}>
          <button
            onClick={handleClose}
            style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border-primary)', background: 'none', color: 'var(--text-primary)', fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleParse}
            disabled={files.length === 0 || loading}
            className={files.length > 0 && !loading ? 'bg-accent text-accent-text' : 'bg-surface-tertiary text-content-faint'}
            style={{ padding: '8px 16px', borderRadius: 10, border: 'none', fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500, cursor: files.length > 0 && !loading ? 'pointer' : 'default', fontFamily: 'inherit' }}
          >
            {loading ? t('reservations.import.parsing') : t('common.import')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
