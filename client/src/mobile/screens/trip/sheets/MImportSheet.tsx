import { useEffect, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Download, MapPin, Upload } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import MSheet from '../../../components/MSheet'
import MIconBtn from '../../../components/MIconBtn'
import { FormSheetHeader } from './PlSheetChrome'
import ImpFileStep from './ImpFileStep'
import ImpListStep from './ImpListStep'
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
 */
export default function MImportSheet({ planner, open, onClose }: MImportSheetProps) {
  const { t } = planner
  const [step, setStep] = useState<ImportStep>('menu')

  useEffect(() => {
    if (open) setStep('menu')
  }, [open])

  const title =
    step === 'file' ? t('places.importFile') : step === 'list' ? t('places.importList') : t('mobileTrip.importPlaces')

  return (
    <MSheet open={open} onClose={onClose} ariaLabel={t('mobileTrip.importPlaces')}>
      <FormSheetHeader
        icon={Download}
        leading={
          step !== 'menu' ? (
            <MIconBtn ariaLabel={t('common.back')} onClick={() => setStep('menu')} variant="neutral" size={34}>
              <ChevronLeft size={17} strokeWidth={2.2} />
            </MIconBtn>
          ) : undefined
        }
        title={title}
        onClose={onClose}
        closeLabel={t('common.close')}
      />

      {step === 'menu' && (
        <div className="px-[14px] pb-[14px] pt-1">
          <ImpMenuRow
            icon={Upload}
            title={t('places.importFile')}
            sub="GPX · KML · KMZ"
            onClick={() => setStep('file')}
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
      {step === 'file' && <ImpFileStep planner={planner} onBack={() => setStep('menu')} onDone={onClose} />}
      {step === 'list' && <ImpListStep planner={planner} onBack={() => setStep('menu')} onDone={onClose} />}
    </MSheet>
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
      className={`flex w-full items-center gap-3 rounded-2xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 py-[13px] text-left ${className}`}
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
