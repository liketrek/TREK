import React from 'react'
import ReactDOM from 'react-dom'
import { useState, useRef, useEffect } from 'react'
import { Upload, Plane, Train, Hotel, UtensilsCrossed, Car, Anchor, Calendar, ArrowLeft, X } from 'lucide-react'
import type { BookingImportPreviewItem } from '@trek/shared'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'
import { reservationsApi } from '../../api/client'
import { useTripStore } from '../../store/tripStore'

interface BookingImportModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: number
  pushUndo?: (label: string, undoFn: () => Promise<void> | void) => void
}

const ACCEPTED_EXTS = ['.eml', '.pdf', '.pkpass', '.html', '.htm', '.txt']
const MAX_FILE_BYTES = 10 * 1024 * 1024
const MAX_FILES = 5

const TYPE_ICONS: Record<string, React.FC<{ size: number; color?: string }>> = {
  flight: Plane,
  train: Train,
  hotel: Hotel,
  restaurant: UtensilsCrossed,
  car: Car,
  cruise: Anchor,
  event: Calendar,
}

function typeColor(type: string): string {
  const map: Record<string, string> = {
    flight: '#3b82f6',
    train: '#10b981',
    hotel: '#8b5cf6',
    restaurant: '#f59e0b',
    car: '#6b7280',
    cruise: '#06b6d4',
    event: '#ec4899',
  }
  return map[type] ?? 'var(--text-faint)'
}

function formatDateTime(iso: unknown): string {
  if (!iso) return ''
  const str = typeof iso === 'string' ? iso : typeof iso === 'object' ? JSON.stringify(iso) : String(iso)
  const date = str.slice(0, 10)
  const time = str.length > 10 ? str.slice(11, 16) : ''
  return [date, time].filter(Boolean).join(' ')
}

export default function BookingImportModal({ isOpen, onClose, tripId, pushUndo }: BookingImportModalProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const loadTrip = useTripStore((s) => s.loadTrip)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mouseDownTarget = useRef<EventTarget | null>(null)

  type Phase = 'upload' | 'preview' | 'confirming'
  const [phase, setPhase] = useState<Phase>('upload')
  const [files, setFiles] = useState<File[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [previewItems, setPreviewItems] = useState<BookingImportPreviewItem[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [excluded, setExcluded] = useState<Set<number>>(() => new Set())

  const reset = () => {
    setPhase('upload')
    setFiles([])
    setIsDragOver(false)
    setLoading(false)
    setError('')
    setPreviewItems([])
    setWarnings([])
    setExcluded(new Set())
  }

  useEffect(() => {
    if (isOpen) reset()
    // reset is stable — intentional
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleParse = async () => {
    if (files.length === 0 || loading) return
    setLoading(true)
    setError('')
    try {
      const result = await reservationsApi.importBookingPreview(tripId, files)
      setPreviewItems(result.items ?? [])
      setWarnings(result.warnings ?? [])
      setExcluded(new Set())
      setPhase('preview')
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? t('reservations.import.error')
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    const toImport = previewItems.filter((_, i) => !excluded.has(i))
    if (toImport.length === 0) return
    setPhase('confirming')
    setError('')
    try {
      const result = await reservationsApi.importBookingConfirm(tripId, toImport)
      const created = result.created ?? []
      await loadTrip(tripId)

      if (created.length > 0) {
        pushUndo?.(t('undo.importBooking'), async () => {
          try {
            const { reservationsApi: rApi } = await import('../../api/client')
            await Promise.all(created.map((r) => rApi.delete(tripId, r.id).catch(() => {})))
          } catch {}
          await loadTrip(tripId)
        })
        toast.success(t('reservations.import.success', { count: created.length }))
      } else {
        toast.warning(t('reservations.import.previewEmpty'))
      }

      handleClose()
    } catch (err: any) {
      setError(err?.response?.data?.error ?? t('reservations.import.error'))
      setPhase('preview')
    }
  }

  const toggleExclude = (idx: number) => {
    setExcluded(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx); else next.add(idx)
      return next
    })
  }

  const activeCount = previewItems.filter((_, i) => !excluded.has(i)).length

  if (!isOpen) return null

  return ReactDOM.createPortal(
    <div
      className="bg-[rgba(0,0,0,0.4)]"
      style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onMouseDown={e => { mouseDownTarget.current = e.target }}
      onClick={e => {
        if (e.target === e.currentTarget && mouseDownTarget.current === e.currentTarget) handleClose()
        mouseDownTarget.current = null
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-surface-card"
        style={{ borderRadius: 16, width: '100%', maxWidth: 540, padding: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', fontFamily: "var(--font-system)", maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          {phase === 'preview' && (
            <button onClick={() => setPhase('upload')} className="bg-transparent text-content-faint" style={{ border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}>
              <ArrowLeft size={16} />
            </button>
          )}
          <div style={{ flex: 1, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            {t('reservations.import.title')}
          </div>
          <button onClick={handleClose} className="bg-transparent text-content-faint" style={{ border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {/* Upload phase */}
          {phase === 'upload' && (
            <>
              <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 14, lineHeight: 1.45 }}>
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
                  gap: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  marginBottom: 12, padding: 16, boxSizing: 'border-box',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                <Upload size={18} strokeWidth={1.8} color={isDragOver ? 'var(--accent)' : 'var(--text-faint)'} style={{ pointerEvents: 'none' }} />
                {isDragOver ? (
                  <span className="text-accent" style={{ pointerEvents: 'none' }}>{t('reservations.import.dropActive')}</span>
                ) : files.length > 0 ? (
                  <span style={{ color: 'var(--text-primary)', textAlign: 'center', wordBreak: 'break-all', pointerEvents: 'none' }}>{files.map(f => f.name).join(', ')}</span>
                ) : (
                  <span style={{ color: 'var(--text-faint)', textAlign: 'center', pointerEvents: 'none' }}>{t('reservations.import.dropHere')}</span>
                )}
              </div>
            </>
          )}

          {/* Preview phase */}
          {(phase === 'preview' || phase === 'confirming') && (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>
                {t('reservations.import.previewHeading', { count: previewItems.length })}
              </div>

              {previewItems.length === 0 && (
                <div className="text-content-faint" style={{ fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
                  {t('reservations.import.previewEmpty')}
                </div>
              )}

              {previewItems.map((item, idx) => {
                const Icon = TYPE_ICONS[item.type] ?? Calendar
                const isExcluded = excluded.has(idx)
                const fromEp = item.endpoints?.find(e => e.role === 'from')
                const toEp = item.endpoints?.find(e => e.role === 'to')

                return (
                  <div
                    key={`${item.source.fileName}-${idx}`}
                    className={isExcluded ? 'bg-surface-tertiary' : 'bg-surface-secondary'}
                    style={{
                      borderRadius: 10, padding: '10px 12px', marginBottom: 8,
                      border: `1px solid ${isExcluded ? 'var(--border-faint)' : 'var(--border-primary)'}`,
                      opacity: isExcluded ? 0.5 : 1, transition: 'opacity 0.15s',
                      display: 'flex', gap: 10, alignItems: 'flex-start',
                    }}
                  >
                    <div style={{ flexShrink: 0, marginTop: 2 }}>
                      <Icon size={15} color={typeColor(item.type)} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.title}
                      </div>
                      {fromEp && toEp && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                          {fromEp.code ?? fromEp.name} → {toEp.code ?? toEp.name}
                        </div>
                      )}
                      {item.reservation_time && (
                        <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                          {formatDateTime(item.reservation_time)}
                          {item.reservation_end_time && ` – ${formatDateTime(item.reservation_end_time)}`}
                        </div>
                      )}
                      {item._accommodation?.check_in && (
                        <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                          {formatDateTime(item._accommodation.check_in)} – {formatDateTime(item._accommodation.check_out)}
                        </div>
                      )}
                      {item.confirmation_number && (
                        <div style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'monospace' }}>
                          {item.confirmation_number}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => toggleExclude(idx)}
                      className="bg-transparent text-content-faint"
                      style={{ border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, flexShrink: 0, fontSize: 11, fontFamily: 'inherit', fontWeight: 500 }}
                      title={t('reservations.import.removeItem')}
                    >
                      {isExcluded ? '＋' : <X size={12} />}
                    </button>
                  </div>
                )
              })}
            </>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="bg-[rgba(245,158,11,0.08)] text-[#92400e]" style={{ border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '8px 10px', fontSize: 12, marginTop: 8, whiteSpace: 'pre-wrap' }}>
              {warnings.join('\n')}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-[rgba(239,68,68,0.08)] text-[#b91c1c]" style={{ border: '1px solid rgba(239,68,68,0.35)', borderRadius: 10, padding: '8px 10px', fontSize: 12, whiteSpace: 'pre-wrap', marginTop: 8 }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-faint)' }}>
          <button
            onClick={handleClose}
            style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border-primary)', background: 'none', color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {t('common.cancel')}
          </button>

          {phase === 'upload' && (
            <button
              onClick={handleParse}
              disabled={files.length === 0 || loading}
              className={files.length > 0 && !loading ? 'bg-accent text-accent-text' : 'bg-surface-tertiary text-content-faint'}
              style={{ padding: '8px 16px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 500, cursor: files.length > 0 && !loading ? 'pointer' : 'default', fontFamily: 'inherit' }}
            >
              {loading ? t('reservations.import.parsing') : t('common.import')}
            </button>
          )}

          {(phase === 'preview' || phase === 'confirming') && (
            <button
              onClick={handleConfirm}
              disabled={activeCount === 0 || phase === 'confirming'}
              className={activeCount > 0 && phase !== 'confirming' ? 'bg-accent text-accent-text' : 'bg-surface-tertiary text-content-faint'}
              style={{ padding: '8px 16px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 500, cursor: activeCount > 0 && phase !== 'confirming' ? 'pointer' : 'default', fontFamily: 'inherit' }}
            >
              {phase === 'confirming' ? t('common.loading') : t('reservations.import.confirm', { count: activeCount })}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
