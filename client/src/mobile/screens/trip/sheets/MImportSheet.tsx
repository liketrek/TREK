import { useEffect, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Download, FileDown, MapPin } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import MSheet from '../../../components/MSheet'
import MIconBtn from '../../../components/MIconBtn'
import { FormSheetHeader } from './PlSheetChrome'
import ImpFileStep from './ImpFileStep'
import ImpListStep from './ImpListStep'
import { useAddonStore } from '../../../../store/addonStore'
import { usePlacesColumnFileImport } from '../../../../components/Planner/usePlacesColumnFileImport'
import TourGpxPreviewDialog from '../../../../components/Tours/TourGpxPreviewDialog'
import type { TripPlanner } from '../MTripShell'

export interface MImportSheetProps {
  planner: TripPlanner
  open: boolean
  onClose: () => void
}

type ImportStep = 'menu' | 'file' | 'list'

/**
 * "Import places" sheet — the demo's two-option card, expanded into working
 * steps on the real endpoints: GPX/KML/KMZ file import and Google/Naver
 * shared-list import (same flows as the desktop PlacesSidebar).
 *
 * With the Tours addon on, the file option opens the Tours file picker and a
 * route or track lands in the Tours import preview, as on the desktop column;
 * a file the preview finds no line in comes back here, on the file step, with
 * it already chosen. The routing is the desktop's, from usePlacesColumnFileImport.
 */
export default function MImportSheet({ planner, open, onClose }: MImportSheetProps) {
  const { t, tripId, trip, can } = planner
  const [step, setStep] = useState<ImportStep>('menu')
  const toursEnabled = useAddonStore(s => s.isEnabled('tours'))
  const fileImport = usePlacesColumnFileImport({
    tripId,
    toursEnabled,
    canEdit: can('place_edit', trip),
    onToursChanged: placeIds => planner.invalidateTourPlaceIds(placeIds ? { placeIds } : undefined),
    onImported: onClose,
  })
  // A file the Tours preview had no line in opens the file step with it chosen.
  const fileStep = step === 'file' || fileImport.placesImportOpen
  const backToMenu = () => {
    fileImport.closePlacesImport()
    setStep('menu')
  }
  const closeSheet = () => {
    fileImport.closePlacesImport()
    onClose()
  }

  useEffect(() => {
    if (open) setStep('menu')
  }, [open])

  let title = t('mobileTrip.importPlaces')
  if (fileStep) title = t('places.importFile')
  else if (step === 'list') title = t('places.importList')

  return (
    <>
      <MSheet open={open} onClose={closeSheet} ariaLabel={t('mobileTrip.importPlaces')}>
        <FormSheetHeader
          icon={Download}
          leading={
            step !== 'menu' || fileStep ? (
              <MIconBtn ariaLabel={t('common.back')} onClick={backToMenu} variant="neutral" size={34}>
                <ChevronLeft size={17} strokeWidth={2.2} />
              </MIconBtn>
            ) : undefined
          }
          title={title}
          onClose={closeSheet}
          closeLabel={t('common.close')}
        />

        {step === 'menu' && !fileStep && (
          <div className="px-[14px] pb-[14px] pt-1">
            <ImpMenuRow
              icon={FileDown}
              title={t('places.importFile')}
              sub="GPX · KML · KMZ"
              onClick={toursEnabled ? fileImport.pickFile : () => setStep('file')}
            />
            <ImpMenuRow
              icon={MapPin}
              title={t('places.importList')}
              sub={t('mobileTrip.importListSub')}
              onClick={() => setStep('list')}
              className="mt-2"
            />
          </div>
        )}
        {fileStep && (
          <ImpFileStep
            planner={planner}
            onBack={backToMenu}
            onDone={closeSheet}
            initialFiles={fileImport.placesImportOpen ? fileImport.placesImportFiles : undefined}
          />
        )}
        {step === 'list' && !fileStep && <ImpListStep planner={planner} onBack={() => setStep('menu')} onDone={onClose} />}
      </MSheet>
      <TourGpxPreviewDialog gpxImport={fileImport.tourImport} />
    </>
  )
}

interface ImpMenuRowProps {
  icon: LucideIcon
  title: ReactNode
  sub: ReactNode
  onClick: () => void
  className?: string
}

/** Option row of the import menu: 38px glass tile, title + sub, chevron. */
function ImpMenuRow({ icon: Icon, title, sub, onClick, className = '' }: ImpMenuRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 py-[13px] text-start ${className}`}
    >
      <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[12px] bg-[color:var(--m-glass)]">
        <Icon size={17} strokeWidth={1.9} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.84375rem] font-bold text-m-ink">{title}</span>
        <span className="block truncate font-geist text-[0.65625rem] text-m-muted">{sub}</span>
      </span>
      <ChevronRight size={15} strokeWidth={2} className="flex-none text-m-faint" />
    </button>
  )
}
