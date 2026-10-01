import React from 'react'
import { useState, useRef, useEffect, useId } from 'react'
import { Check, FileDown, Loader2, Upload } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'
import { placesApi } from '../../api/client'
import { useTripStore } from '../../store/tripStore'
import { useAuthStore } from '../../store/authStore'
import ToggleSwitch from '../Settings/ToggleSwitch'
import {
  DialogButton, DialogFooter, DialogHeader, DialogSection, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs,
} from '../shared/DialogShell'
import { EditorField } from '../shared/dialogParts'

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

/** One tickable kind of content in the file (waypoints, paths…). */
function TypeCheck({ checked, label, onToggle }: { checked: boolean; label: string; onToggle: () => void }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} onClick={onToggle}
      className="flex w-full items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left hover:bg-surface-hover">
      <span className={`grid h-4 w-4 flex-none place-items-center rounded-[5px] ${checked ? 'bg-accent' : 'border-[1.5px] border-edge'}`}>
        {checked && <Check size={11} strokeWidth={3} className="text-accent-text" />}
      </span>
      <span className="select-none text-content" style={fs(12.5, 'body')}>{label}</span>
    </button>
  )
}

const TYPE_BOX = 'flex flex-col gap-0.5 rounded-[14px] border border-edge-faint bg-surface-secondary p-1.5'

export default function FileImportModal({ isOpen, onClose, tripId, pushUndo, initialFile }: FileImportModalProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const loadTrip = useTripStore((s) => s.loadTrip)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const titleId = useId()

  const [files, setFiles] = useState<File[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState<PlacesImportSummary | null>(null)
  const [gpxOpts, setGpxOpts] = useState({ waypoints: true, routes: true, tracks: true })
  const [kmlOpts, setKmlOpts] = useState({ points: true, paths: true })
  // The Google pass a list import offers, for the points of a file too (#2536).
  const canEnrichImport = useAuthStore(s => s.hasMapsKey)
  const [enrich, setEnrich] = useState(false)
  const enrichHintId = useId()

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
          const result = await placesApi.importGpx(tripId, f, { ...gpxOpts, enrich: enrich && canEnrichImport })
          totalCreated += result.count ?? 0
          totalSkipped += result.skipped ?? 0
          if (result.places?.length > 0) createdIds.push(...result.places.map((p: { id: number }) => p.id))
        } else {
          importedKml = true
          const result = await placesApi.importMapFile(tripId, f, { ...kmlOpts, enrich: enrich && canEnrichImport })
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

  let zoneText: React.ReactNode
  if (isDragOver) zoneText = <span className="pointer-events-none font-semibold text-accent">{t('places.importFileDropActive')}</span>
  else if (files.length > 0) zoneText = <span className="pointer-events-none break-all text-center font-semibold text-content">{files.map(f => f.name).join(', ')}</span>
  else zoneText = <span className="pointer-events-none text-center text-content-faint">{t('places.importFileDropHere')}</span>

  return (
    <DialogShell
      onClose={handleClose}
      labelledBy={titleId}
      width="narrow"
      header={(
        <DialogHeader
          tile={<DialogTile><FileDown size={20} strokeWidth={1.9} className="text-content" /></DialogTile>}
          tint={NEUTRAL_TINT}
          labelId={titleId}
          onClose={handleClose}
          title={t('places.importFile')}
          sub={t('places.importFileHint')}
          subWraps
        />
      )}
      footer={(
        <DialogFooter>
          <FooterSpacer />
          <DialogButton onClick={handleClose}>{t('common.cancel')}</DialogButton>
          <DialogButton
            variant="primary"
            onClick={handleImport}
            disabled={!canImport}
            icon={loading ? <Loader2 size={14} className="animate-spin" /> : undefined}
          >
            {loading ? t('common.loading') : t('common.import')}
          </DialogButton>
        </DialogFooter>
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".gpx,.kml,.kmz"
        multiple
        className="hidden"
        onChange={handleInputChange}
      />

      <EditorField label={t('files.title')}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex min-h-[96px] w-full flex-col items-center justify-center gap-1.5 rounded-[14px] border-2 border-dashed p-4 font-medium transition-colors ${isDragOver ? 'border-accent bg-surface-tertiary' : 'border-edge bg-surface-secondary hover:border-content-faint'}`}
          style={fs(13, 'body')}
        >
          <Upload size={18} strokeWidth={1.8} className={`pointer-events-none ${isDragOver ? 'text-accent' : 'text-content-faint'}`} />
          {zoneText}
        </button>
      </EditorField>

      {isGpx && (
        <DialogSection label={t('places.gpxImportTypes')}>
          <div className={TYPE_BOX}>
            {(['waypoints', 'routes', 'tracks'] as const).map(key => (
              <TypeCheck
                key={key}
                checked={gpxOpts[key]}
                onToggle={() => setGpxOpts(prev => ({ ...prev, [key]: !prev[key] }))}
                label={t(key === 'waypoints' ? 'places.gpxImportWaypoints' : key === 'routes' ? 'places.gpxImportRoutes' : 'places.gpxImportTracks')}
              />
            ))}
          </div>
          {gpxNoneSelected && <p className="m-0 mt-1.5 text-warning" style={fs(11.5)}>{t('places.gpxImportNoneSelected')}</p>}
        </DialogSection>
      )}

      {isKml && (
        <DialogSection label={t('places.kmlImportTypes')}>
          <div className={TYPE_BOX}>
            {(['points', 'paths'] as const).map(key => (
              <TypeCheck
                key={key}
                checked={kmlOpts[key]}
                onToggle={() => setKmlOpts(prev => ({ ...prev, [key]: !prev[key] }))}
                label={t(key === 'points' ? 'places.kmlImportPoints' : 'places.kmlImportPaths')}
              />
            ))}
          </div>
          {kmlNoneSelected && <p className="m-0 mt-1.5 text-warning" style={fs(11.5)}>{t('places.kmlImportNoneSelected')}</p>}
        </DialogSection>
      )}

      {canEnrichImport && ((isGpx && gpxOpts.waypoints) || (isKml && kmlOpts.points)) && (
        <div className="flex items-start gap-3 rounded-[14px] border border-edge-faint bg-surface-secondary p-3">
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-content" style={fs(12.5, 'body')}>{t('places.enrichOnImport')}</div>
            <div id={enrichHintId} className="mt-0.5 text-content-faint" style={fs(12, 'body')}>{t('places.enrichOnImportFileHint')}</div>
          </div>
          <ToggleSwitch on={enrich} onToggle={() => setEnrich(v => !v)} label={t('places.enrichOnImport')} describedBy={enrichHintId} />
        </div>
      )}

      {summary && (
        <div className="flex flex-col gap-2 rounded-[14px] border border-edge-faint bg-surface-secondary px-3 py-2.5">
          <div className="text-content-muted" style={fs(12, 'body')}>
            {t('places.kmlKmzSummaryValues', {
              total: summary.totalPlacemarks,
              created: summary.createdCount,
              skipped: summary.skippedCount,
            })}
          </div>
          {summary.warnings?.length > 0 && (
            <div className="whitespace-pre-wrap rounded-[10px] bg-warning-soft px-2.5 py-2 text-warning" style={fs(12, 'body')}>
              {summary.warnings.join('\n')}
            </div>
          )}
        </div>
      )}

      {error && (
        <div role="alert" className="whitespace-pre-wrap rounded-[12px] bg-danger-soft px-3 py-2 text-danger" style={fs(12, 'body')}>
          {error}
        </div>
      )}
    </DialogShell>
  )
}
