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

  const [files, setFiles] = useState<File[]>([])
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
    setFiles([])
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
        setFiles([])
        setError(err)
      } else {
        setFiles([initialFile])
        setError('')
      }
    } else {
      setFiles([])
      setError('')
    }
  // validateFile uses t() which is stable — intentionally omitted from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialFile])

  const handleClose = () => {
    reset()
    onClose()
  }

  const selectFiles = (incoming: File[]) => {
    if (incoming.length === 0) return
    const valid: File[] = []
    let firstError: string | null = null
    for (const f of incoming) {
      const validationError = validateFile(f)
      if (validationError) {
        firstError = firstError ?? validationError
        continue
      }
      valid.push(f)
    }
    if (valid.length === 0) {
      setError(firstError ?? '')
      setFiles([])
      return
    }
    setFiles(valid)
    setError(firstError ?? '')
    setSummary(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files ? Array.from(e.target.files) : []
    e.target.value = ''
    if (list.length) selectFiles(list)
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
    const list = Array.from(e.dataTransfer.files)
    if (list.length) selectFiles(list)
  }

  const handleImport = async () => {
    if (files.length === 0 || loading) return
    setLoading(true)
    setError('')
    setSummary(null)

    let totalCreated = 0
    let totalSkipped = 0
    const createdIds: number[] = []
    const errors: string[] = []
    let mergedSummary: PlacesImportSummary | null = null
    let importedGpx = false
    let importedKml = false

    for (const f of files) {
      const ext = f.name.toLowerCase().split('.').pop()
      try {
        if (ext === 'gpx') {
          importedGpx = true
          const result = await placesApi.importGpx(tripId, f, gpxOpts)
          totalCreated += result.count ?? 0
          totalSkipped += result.skipped ?? 0
          if (result.places?.length > 0) createdIds.push(...result.places.map((p: { id: number }) => p.id))
        } else {
          importedKml = true
          const result = await placesApi.importMapFile(tripId, f, kmlOpts)
          totalCreated += result.count ?? 0
          if (result.places?.length > 0) createdIds.push(...result.places.map((p: { id: number }) => p.id))
          const s = result.summary as PlacesImportSummary | undefined
          if (s) {
            mergedSummary = mergedSummary
              ? {
                  totalPlacemarks: mergedSummary.totalPlacemarks + s.totalPlacemarks,
                  createdCount: mergedSummary.createdCount + s.createdCount,
                  skippedCount: mergedSummary.skippedCount + s.skippedCount,
                  warnings: [...mergedSummary.warnings, ...(s.warnings ?? [])],
                  errors: [...mergedSummary.errors, ...(s.errors ?? [])],
                }
              : s
            totalSkipped += s.skippedCount ?? 0
          }
        }
      } catch (err: any) {
        const message = err?.response?.data?.error || t('places.importFileError')
        errors.push(files.length > 1 ? `${f.name}: ${message}` : message)
      }
    }

    await loadTrip(tripId)

    if (createdIds.length > 0) {
      pushUndo?.(importedGpx && !importedKml ? t('undo.importGpx') : t('undo.importKeyholeMarkup'), async () => {
        try { await placesApi.bulkDelete(tripId, createdIds) } catch {}
        await loadTrip(tripId)
      })
    }

    if (totalCreated > 0) {
      const key = importedKml && !importedGpx ? 'places.kmlKmzImported' : 'places.gpxImported'
      toast.success(t(key, { count: totalCreated }))
    } else if (totalSkipped > 0 && errors.length === 0) {
      toast.warning(t('places.importAllSkipped'))
    }

    if (mergedSummary) setSummary(mergedSummary)
    if (errors.length > 0) {
      setError(errors.join('\n'))
      toast.error(errors[0])
    }

    setLoading(false)

    // Close once everything succeeded and there's no KML summary left to surface.
    if (errors.length === 0 && !mergedSummary) handleClose()
  }

  const exts = files.map(f => f.name.toLowerCase().split('.').pop() ?? '')
  const isGpx = exts.includes('gpx')
  const isKml = exts.some(e => e === 'kml' || e === 'kmz')
  const gpxNoneSelected = isGpx && !gpxOpts.waypoints && !gpxOpts.routes && !gpxOpts.tracks
  const kmlNoneSelected = isKml && !kmlOpts.points && !kmlOpts.paths
  const canImport = files.length > 0 && !loading && !gpxNoneSelected && !kmlNoneSelected

  if (!isOpen) return null

  return ReactDOM.createPortal(
    <div
      onClick={handleClose}
      className="bg-[rgba(0,0,0,0.4)]"
      style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-surface-card"
        style={{ borderRadius: 16, width: '100%', maxWidth: 520, padding: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', fontFamily: "var(--font-system)" }}
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
            width: '100%',
            minHeight: 88,
            borderRadius: 12,
            border: `2px dashed ${isDragOver ? 'var(--accent)' : 'var(--border-primary)'}`,
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
            <span className="text-accent" style={{ pointerEvents: 'none' }}>{t('places.importFileDropActive')}</span>
          ) : files.length > 0 ? (
            <span style={{ color: 'var(--text-primary)', textAlign: 'center', wordBreak: 'break-all', pointerEvents: 'none' }}>{files.map(f => f.name).join(', ')}</span>
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
                <div className={gpxOpts[key] ? 'bg-accent' : 'bg-transparent'} style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  border: gpxOpts[key] ? 'none' : '1.5px solid var(--border-primary)',
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
              <div className="text-[#b45309]" style={{ fontSize: 11, marginTop: 4 }}>{t('places.gpxImportNoneSelected')}</div>
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
                <div className={kmlOpts[key] ? 'bg-accent' : 'bg-transparent'} style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  border: kmlOpts[key] ? 'none' : '1.5px solid var(--border-primary)',
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
              <div className="text-[#b45309]" style={{ fontSize: 11, marginTop: 4 }}>{t('places.kmlImportNoneSelected')}</div>
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
              <div className="text-[#b45309]" style={{ marginTop: 8, fontSize: 12, whiteSpace: 'pre-wrap' }}>
                {summary.warnings.join('\n')}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-[rgba(239,68,68,0.08)] text-[#b91c1c]" style={{
            border: '1px solid rgba(239,68,68,0.35)', borderRadius: 10,
            padding: '8px 10px',
            fontSize: 12, whiteSpace: 'pre-wrap', marginBottom: 10,
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
            className={canImport ? 'bg-accent text-accent-text' : 'bg-surface-tertiary text-content-faint'}
            style={{
              padding: '8px 16px', borderRadius: 10, border: 'none',
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
