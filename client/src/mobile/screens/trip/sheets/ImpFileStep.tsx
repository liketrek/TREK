import { useRef } from 'react'
import { Check, FileDown } from 'lucide-react'
import MToggle from '../../../components/MToggle'
import { Eyebrow, FormSheetFooter } from './PlSheetChrome'
import type { TripPlanner } from '../MTripShell'
import { usePlacesFileImport } from '../../../../components/Planner/usePlacesFileImport'

interface ImpFileStepProps {
  planner: TripPlanner
  /** Back to the import menu. */
  onBack: () => void
  /** Close the whole sheet after a clean import. */
  onDone: () => void
}

/**
 * GPX/KML/KMZ file import step — same endpoints and undo behaviour as the
 * desktop FileImportModal (placesApi.importGpx / importMapFile), reduced to a
 * tap-to-pick flow.
 */
export default function ImpFileStep({ planner, onBack, onDone }: ImpFileStepProps) {
  const { t, toast, tripId, tripActions, pushUndo } = planner
  const inputRef = useRef<HTMLInputElement>(null)
  const {
    files, loading, error, summary, gpxOpts, toggleGpxOpt, kmlOpts, toggleKmlOpt, canEnrich, enrich, setEnrich,
    handleInputChange, handleImport, isGpx, isKml, gpxNoneSelected, kmlNoneSelected, canImport,
  } = usePlacesFileImport({ tripId, t, toast, loadTrip: tripActions.loadTrip, pushUndo, onDone, variant: 'sheet' })

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
          onChange={handleInputChange}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-3 flex min-h-[88px] w-full flex-col items-center justify-center gap-[6px] rounded-[14px] border-[1.5px] border-dashed border-[color:var(--m-trackoff)] p-4"
        >
          <FileDown size={17} strokeWidth={1.9} className="text-m-faint" />
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
            onToggle={toggleGpxOpt}
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
            onToggle={toggleKmlOpt}
            noneSelected={kmlNoneSelected}
            noneSelectedLabel={t('places.kmlImportNoneSelected')}
          />
        )}

        {canEnrich && ((isGpx && gpxOpts.waypoints) || (isKml && kmlOpts.points)) && (
          <div className="mt-3 flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[0.78125rem] font-semibold text-m-ink">{t('places.enrichOnImport')}</div>
              <div className="mt-[2px] font-geist text-[0.65625rem] leading-[1.4] text-m-faint">{t('places.enrichOnImportFileHint')}</div>
            </div>
            <MToggle checked={enrich} onChange={setEnrich} ariaLabel={t('places.enrichOnImport')} className="mt-[2px]" />
          </div>
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

interface ImpTypeTogglesProps<K extends string> {
  title: string
  options: { key: K; label: string; on: boolean }[]
  onToggle: (key: K) => void
  noneSelected: boolean
  noneSelectedLabel: string
}

/** GPX/KML entity checkboxes ("what do you want to import?"). */
function ImpTypeToggles<K extends string>({ title, options, onToggle, noneSelected, noneSelectedLabel }: ImpTypeTogglesProps<K>) {
  return (
    <div className="mt-3">
      <Eyebrow className="mb-[5px] uppercase">{title}</Eyebrow>
      {options.map(opt => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onToggle(opt.key)}
          aria-pressed={opt.on}
          className="flex w-full items-center gap-2 py-[5px] text-start"
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
