import { useRef, useState } from 'react'
import { Check, Upload } from 'lucide-react'
import { placesApi } from '../../../../api/client'
import { Eyebrow, FormSheetFooter } from './PlSheetChrome'
import type { TripPlanner } from '../MTripShell'

interface ImportSummary {
  totalPlacemarks: number
  createdCount: number
  skippedCount: number
  warnings: string[]
  errors: string[]
}

interface ImpFileStepProps {
  planner: TripPlanner
  /** Back to the import menu. */
  onBack: () => void
  /** Close the whole sheet after a clean import. */
  onDone: () => void
}

const MAX_FILE_BYTES = 10 * 1024 * 1024

/**
 * GPX/KML/KMZ file import step — same endpoints and undo behaviour as the
 * desktop FileImportModal (placesApi.importGpx / importMapFile), reduced to a
 * tap-to-pick flow.
 */
export default function ImpFileStep({ planner, onBack, onDone }: ImpFileStepProps) {
  const { t, toast, tripId, tripActions, pushUndo } = planner
  const inputRef = useRef<HTMLInputElement>(null)

  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [gpxOpts, setGpxOpts] = useState({ waypoints: true, routes: true, tracks: true })
  const [kmlOpts, setKmlOpts] = useState({ points: true, paths: true })

  const validateFile = (f: File): string | null => {
    const ext = f.name.toLowerCase().split('.').pop()
    if (ext !== 'gpx' && ext !== 'kml' && ext !== 'kmz') return t('places.importFileUnsupported')
    if (f.size > MAX_FILE_BYTES) return t('places.importFileTooLarge', { maxMb: 10 })
    return null
  }

  const selectFiles = (incoming: File[]) => {
    if (incoming.length === 0) return
    const valid: File[] = []
    let firstError: string | null = null
    for (const f of incoming) {
      const validationError = validateFile(f)
      if (validationError) firstError = firstError ?? validationError
      else valid.push(f)
    }
    setFiles(valid)
    setError(firstError ?? '')
    setSummary(null)
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
    let mergedSummary: ImportSummary | null = null
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
          const s = result.summary as ImportSummary | undefined
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
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error || t('places.importFileError')
        errors.push(files.length > 1 ? `${f.name}: ${message}` : message)
      }
    }

    await tripActions.loadTrip(tripId)

    if (createdIds.length > 0) {
      pushUndo(importedGpx && !importedKml ? t('undo.importGpx') : t('undo.importKeyholeMarkup'), async () => {
        try {
          await placesApi.bulkDelete(tripId, createdIds)
        } catch {
          // best effort — the trip reload below reflects whatever happened
        }
        await tripActions.loadTrip(tripId)
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
    // Close once everything succeeded and there's no KML summary left to show.
    if (errors.length === 0 && !mergedSummary) onDone()
  }

  const exts = files.map(f => f.name.toLowerCase().split('.').pop() ?? '')
  const isGpx = exts.includes('gpx')
  const isKml = exts.some(e => e === 'kml' || e === 'kmz')
  const gpxNoneSelected = isGpx && !gpxOpts.waypoints && !gpxOpts.routes && !gpxOpts.tracks
  const kmlNoneSelected = isKml && !kmlOpts.points && !kmlOpts.paths
  const canImport = files.length > 0 && !loading && !gpxNoneSelected && !kmlNoneSelected

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-3 pt-1">
        <div className="font-geist text-[0.71875rem] leading-[1.45] text-m-muted">{t('places.importFileHint')}</div>

        <input
          ref={inputRef}
          type="file"
          accept=".gpx,.kml,.kmz"
          multiple
          className="hidden"
          onChange={e => {
            const list = e.target.files ? Array.from(e.target.files) : []
            e.target.value = ''
            if (list.length) selectFiles(list)
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-3 flex min-h-[88px] w-full flex-col items-center justify-center gap-[6px] rounded-[14px] border-[1.5px] border-dashed border-[color:var(--m-trackoff)] p-4"
        >
          <Upload size={17} strokeWidth={1.9} className="text-m-faint" />
          {files.length > 0 ? (
            <span className="break-all text-center text-[0.78125rem] font-semibold text-m-ink">
              {files.map(f => f.name).join(', ')}
            </span>
          ) : (
            <span className="text-center text-[0.75rem] font-semibold text-m-muted">
              {t('places.importFileDropHere')}
            </span>
          )}
        </button>

        {isGpx && (
          <ImpTypeToggles
            title={t('places.gpxImportTypes')}
            options={[
              { key: 'waypoints', label: t('places.gpxImportWaypoints'), on: gpxOpts.waypoints },
              { key: 'routes', label: t('places.gpxImportRoutes'), on: gpxOpts.routes },
              { key: 'tracks', label: t('places.gpxImportTracks'), on: gpxOpts.tracks },
            ]}
            onToggle={key => setGpxOpts(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
            noneSelected={gpxNoneSelected}
            noneSelectedLabel={t('places.gpxImportNoneSelected')}
          />
        )}
        {isKml && (
          <ImpTypeToggles
            title={t('places.kmlImportTypes')}
            options={[
              { key: 'points', label: t('places.kmlImportPoints'), on: kmlOpts.points },
              { key: 'paths', label: t('places.kmlImportPaths'), on: kmlOpts.paths },
            ]}
            onToggle={key => setKmlOpts(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
            noneSelected={kmlNoneSelected}
            noneSelectedLabel={t('places.kmlImportNoneSelected')}
          />
        )}

        {summary && (
          <div className="mt-3 rounded-[13px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 py-[10px]">
            <div className="font-geist text-[0.71875rem] text-m-muted">
              {t('places.kmlKmzSummaryValues', {
                total: summary.totalPlacemarks,
                created: summary.createdCount,
                skipped: summary.skippedCount,
              })}
            </div>
            {summary.warnings?.length > 0 && (
              <div className="mt-2 whitespace-pre-wrap font-geist text-[0.71875rem] text-[color:var(--m-st-pending)]">
                {summary.warnings.join('\n')}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-3 whitespace-pre-wrap rounded-[13px] border border-[rgba(214,39,59,.3)] bg-[rgba(214,39,59,.08)] px-3 py-2 font-geist text-[0.71875rem] text-[color:var(--m-st-danger)]">
            {error}
          </div>
        )}
      </div>

      <FormSheetFooter
        onCancel={onBack}
        cancelLabel={t('common.cancel')}
        onSubmit={handleImport}
        submitLabel={loading ? t('common.loading') : t('common.import')}
        submitDisabled={!canImport}
      />
    </>
  )
}

interface ImpTypeTogglesProps {
  title: string
  options: { key: string; label: string; on: boolean }[]
  onToggle: (key: string) => void
  noneSelected: boolean
  noneSelectedLabel: string
}

/** GPX/KML entity checkboxes ("what do you want to import?"). */
function ImpTypeToggles({ title, options, onToggle, noneSelected, noneSelectedLabel }: ImpTypeTogglesProps) {
  return (
    <div className="mt-3">
      <Eyebrow className="mb-[5px] uppercase">{title}</Eyebrow>
      {options.map(opt => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onToggle(opt.key)}
          aria-pressed={opt.on}
          className="flex w-full items-center gap-2 py-[5px] text-left"
        >
          <span
            className={`flex h-4 w-4 flex-none items-center justify-center rounded-[4px] ${
              opt.on ? 'bg-m-act text-m-actfg' : 'border-[1.5px] border-[color:var(--m-trackoff)]'
            }`}
          >
            {opt.on && <Check size={11} strokeWidth={2.6} />}
          </span>
          <span className="text-[0.75rem] font-medium text-m-ink">{opt.label}</span>
        </button>
      ))}
      {noneSelected && (
        <div className="mt-1 font-geist text-[0.6875rem] text-[color:var(--m-st-pending)]">{noneSelectedLabel}</div>
      )}
    </div>
  )
}
