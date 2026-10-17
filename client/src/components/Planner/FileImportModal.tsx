import React from 'react'
import { useRef, useId } from 'react'
import { Check, FileDown, Loader2, Upload } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'
import { useTripStore } from '../../store/tripStore'
import ToggleSwitch from '../Settings/ToggleSwitch'
import {
  DialogButton, DialogFooter, DialogHeader, DialogSection, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs,
} from '../shared/DialogShell'
import { EditorField } from '../shared/dialogParts'
import { usePlacesFileImport } from './usePlacesFileImport'

interface FileImportModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: number
  pushUndo?: (label: string, undoFn: () => Promise<void> | void) => void
  initialFile?: File | null
}

/** One tickable kind of content in the file (waypoints, paths…). */
function TypeCheck({ checked, label, onToggle }: { checked: boolean; label: string; onToggle: () => void }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} onClick={onToggle}
      className="flex w-full items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-start hover:bg-surface-hover">
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
  const {
    files, isDragOver, loading, error, summary, gpxOpts, toggleGpxOpt, kmlOpts, toggleKmlOpt,
    canEnrich: canEnrichImport, enrich, setEnrich, handleInputChange, handleDragOver, handleDragLeave, handleDrop,
    handleImport, close: handleClose, isGpx, isKml, gpxNoneSelected, kmlNoneSelected, canImport,
  } = usePlacesFileImport({
    tripId, t, toast, loadTrip, pushUndo, onDone: onClose, variant: 'dialog', open: isOpen, initialFile,
  })
  const enrichHintId = useId()

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
                onToggle={() => toggleGpxOpt(key)}
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
                onToggle={() => toggleKmlOpt(key)}
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
