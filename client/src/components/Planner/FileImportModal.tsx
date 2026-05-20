import React from 'react'
import ReactDOM from 'react-dom'
import { useState, useRef, useEffect } from 'react'
import { Upload } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'
import { placesApi } from '../../api/client'
import { useTripStore } from '../../store/tripStore'

interface PlacesImportSummary {
  totalPlacemarks: number
  createdCount: number
  skippedCount: number
  warnings: string[]
  errors: string[]
}

interface FileImportModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: number
  pushUndo?: (label: string, undoFn: () => Promise<void> | void) => void
  initialFile?: File | null
}

const MAX_FILE_BYTES = 10 * 1024 * 1024

export default function FileImportModal({ isOpen, onClose, tripId, pushUndo, initialFile }: FileImportModalProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const loadTrip = useTripStore((s) => s.loadTrip)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState<PlacesImportSummary | null>(null)
  const [gpxOpts, setGpxOpts] = useState({ waypoints: true, routes: true, tracks: true })
  const [kmlOpts, setKmlOpts] = useState({ points: true, paths: true })

  const validateFile = (f: File): string | null => {
    const ext = f.name.toLowerCase().split('.').pop()
    if (ext !== 'gpx' && ext !== 'kml' && ext !== 'kmz') {
      return t('places.importFileUnsupported')
    }
    if (f.size > MAX_FILE_BYTES) {
      return t('places.importFileTooLarge', { maxMb: 10 })
    }
    return null
  }

  const reset = () => {
    setFile(null)
    setIsDragOver(false)
    setLoading(false)
    setError('')
    setSummary(null)
  }

  // When the modal opens, reset state and pre-load any file dropped from the sidebar.
  useEffect(() => {
    if (!isOpen) return
    setIsDragOver(false)
    setLoading(false)
    setSummary(null)
    if (initialFile) {
      const err = validateFile(initialFile)
      if (err) {
        setFile(null)
        setError(err)
      } else {
        setFile(initialFile)
        setError('')
      }
    } else {
      setFile(null)
      setError('')
    }
  // validateFile uses t() which is stable — intentionally omitted from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialFile])

  const handleClose = () => {
    reset()
    onClose()
  }

  const selectFile = (f: File) => {
    const validationError = validateFile(f)
    if (validationError) {
      setError(validationError)
      setFile(null)
      return
    }
    setFile(f)
    setError('')
    setSummary(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (f) selectFile(f)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.target === e.currentTarget) setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) selectFile(f)
  }

  const handleImport = async () => {
    if (!file || loading) return
    const ext = file.name.toLowerCase().split('.').pop()
    setLoading(true)
    setError('')
    setSummary(null)

    try {
      if (ext === 'gpx') {
        const result = await placesApi.importGpx(tripId, file, gpxOpts)
        await loadTrip(tripId)
        if (result.count === 0 && result.skipped > 0) {
          toast.warning(t('places.importAllSkipped'))
        } else {
          toast.success(t('places.gpxImported', { count: result.count }))
        }
        if (result.places?.length > 0) {
          const importedIds: number[] = result.places.map((p: { id: number }) => p.id)
          pushUndo?.(t('undo.importGpx'), async () => {
            try { await placesApi.bulkDelete(tripId, importedIds) } catch {}
            await loadTrip(tripId)
          })
        }
        handleClose()
      } else {
        const result = await placesApi.importMapFile(tripId, file, kmlOpts)
        await loadTrip(tripId)
        setSummary(result.summary || null)
        if (result.count === 0 && (result.summary?.skippedCount ?? 0) > 0) {
          toast.warning(t('places.importAllSkipped'))
        } else {
          toast.success(t('places.kmlKmzImported', { count: result.count }))
        }
        if (result.summary?.errors?.length > 0) {
          setError(result.summary.errors.join('\n'))
        }
        if (result.places?.length > 0) {
          const importedIds: number[] = result.places.map((p: { id: number }) => p.id)
          pushUndo?.(t('undo.importKeyholeMarkup'), async () => {
            try { await placesApi.bulkDelete(tripId, importedIds) } catch {}
            await loadTrip(tripId)
          })
        }
      }
    } catch (err: any) {
      const responseSummary = err?.response?.data?.summary as PlacesImportSummary | undefined
      if (responseSummary) setSummary(responseSummary)
      const message = err?.response?.data?.error || t('places.importFileError')
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const fileExt = file?.name.toLowerCase().split('.').pop() ?? ''
  const isGpx = fileExt === 'gpx'
  const isKml = fileExt === 'kml' || fileExt === 'kmz'
  const gpxNoneSelected = isGpx && !gpxOpts.waypoints && !gpxOpts.routes && !gpxOpts.tracks
  const kmlNoneSelected = isKml && !kmlOpts.points && !kmlOpts.paths
  const canImport = !!file && !loading && !gpxNoneSelected && !kmlNoneSelected

  if (!isOpen) return null

  return ReactDOM.createPortal(
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'var(--modal-backdrop)',
        backdropFilter: 'blur(12px) saturate(150%)',
        WebkitBackdropFilter: 'blur(12px) saturate(150%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--modal-bg)',
          backdropFilter: 'var(--glass-blur-lg)',
          WebkitBackdropFilter: 'var(--glass-blur-lg)',
          border: '1px solid var(--modal-border)',
          borderRadius: 16, width: '100%', maxWidth: 520, padding: 24,
          boxShadow: 'var(--modal-shadow)',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
          {t('places.importFile')}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 14, lineHeight: 1.45 }}>
          {t('places.importFileHint')}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".gpx,.kml,.kmz"
          style={{ display: 'none' }}
          onChange={handleInputChange}
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            width: '100%',
            minHeight: 88,
            borderRadius: 12,
            border: `2px dashed ${isDragOver ? 'var(--accent)' : 'var(--border-primary)'}`,
            background: isDragOver ? 'var(--bg-tertiary)' : 'transparent',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            marginBottom: 12,
            fontFamily: 'inherit',
            transition: 'border-color 0.15s, background 0.15s',
            boxSizing: 'border-box',
            padding: 16,
          }}
        >
          <Upload size={18} strokeWidth={1.8} color={isDragOver ? 'var(--accent)' : 'var(--text-faint)'} style={{ pointerEvents: 'none' }} />
          {isDragOver ? (
            <span style={{ color: 'var(--accent)', pointerEvents: 'none' }}>{t('places.importFileDropActive')}</span>
          ) : file ? (
            <span style={{ color: 'var(--text-primary)', textAlign: 'center', wordBreak: 'break-all', pointerEvents: 'none' }}>{file.name}</span>
          ) : (
            <span style={{ color: 'var(--text-faint)', textAlign: 'center', pointerEvents: 'none' }}>{t('places.importFileDropHere')}</span>
          )}
        </div>

        {isGpx && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('places.gpxImportTypes')}
            </div>
            {(['waypoints', 'routes', 'tracks'] as const).map(key => (
              <label key={key} onClick={() => setGpxOpts(prev => ({ ...prev, [key]: !prev[key] }))} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}>
                <div style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  border: gpxOpts[key] ? 'none' : '1.5px solid var(--border-primary)',
                  background: gpxOpts[key] ? 'var(--accent)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {gpxOpts[key] && <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-primary)', userSelect: 'none' }}>
                  {t(key === 'waypoints' ? 'places.gpxImportWaypoints' : key === 'routes' ? 'places.gpxImportRoutes' : 'places.gpxImportTracks')}
                </span>
              </label>
            ))}
            {gpxNoneSelected && (
              <div style={{ fontSize: 11, color: '#b45309', marginTop: 4 }}>{t('places.gpxImportNoneSelected')}</div>
            )}
          </div>
        )}

        {isKml && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('places.kmlImportTypes')}
            </div>
            {(['points', 'paths'] as const).map(key => (
              <label key={key} onClick={() => setKmlOpts(prev => ({ ...prev, [key]: !prev[key] }))} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}>
                <div style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  border: kmlOpts[key] ? 'none' : '1.5px solid var(--border-primary)',
                  background: kmlOpts[key] ? 'var(--accent)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {kmlOpts[key] && <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-primary)', userSelect: 'none' }}>
                  {t(key === 'points' ? 'places.kmlImportPoints' : 'places.kmlImportPaths')}
                </span>
              </label>
            ))}
            {kmlNoneSelected && (
              <div style={{ fontSize: 11, color: '#b45309', marginTop: 4 }}>{t('places.kmlImportNoneSelected')}</div>
            )}
          </div>
        )}

        {summary && (
          <div style={{
            border: '1px solid var(--border-primary)', borderRadius: 10,
            background: 'var(--bg-tertiary)', padding: 10, marginBottom: 10,
          }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {t('places.kmlKmzSummaryValues', {
                total: summary.totalPlacemarks,
                created: summary.createdCount,
                skipped: summary.skippedCount,
              })}
            </div>
            {summary.warnings?.length > 0 && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#b45309', whiteSpace: 'pre-wrap' }}>
                {summary.warnings.join('\n')}
              </div>
            )}
          </div>
        )}

        {error && (
          <div style={{
            border: '1px solid rgba(239,68,68,0.35)', borderRadius: 10,
            background: 'rgba(239,68,68,0.08)', padding: '8px 10px',
            fontSize: 12, color: '#b91c1c', whiteSpace: 'pre-wrap', marginBottom: 10,
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={handleClose}
            style={{
              padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border-primary)',
              background: 'none', color: 'var(--text-primary)', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleImport}
            disabled={!canImport}
            style={{
              padding: '8px 16px', borderRadius: 10, border: 'none',
              background: canImport ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: canImport ? 'var(--accent-text)' : 'var(--text-faint)',
              fontSize: 13, fontWeight: 500, cursor: canImport ? 'pointer' : 'default',
              fontFamily: 'inherit',
            }}
          >
            {loading ? t('common.loading') : t('common.import')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
