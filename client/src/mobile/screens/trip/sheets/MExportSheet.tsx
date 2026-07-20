import { useState, type ReactNode } from 'react'
import { CalendarPlus, ChevronRight, FileDown } from 'lucide-react'
import MSheet from '../../../components/MSheet'
import { IcsSubscribeModal } from '../../../../components/Planner/IcsSubscribeModal'
import { downloadTripPDF } from '../../../../components/PDF/TripPDF'
import { useTripStore } from '../../../../store/tripStore'
import { useTranslation } from '../../../../i18n'
import { INNER_CLS, TileHeader } from './MTripSheetUi'
import type { MTripSheetsProps } from '../MTripShell'
import type { LucideIcon } from 'lucide-react'

/**
 * Calendar & export sheet ('export', opened from the Mehr sheet): the desktop
 * day-plan toolbar's PDF export, ICS download and calendar subscription in one
 * place. The subscription dialog is the shared IcsSubscribeModal — it owns the
 * enable/rotate/disable token flow.
 */
export default function MExportSheet({ planner, shell }: MTripSheetsProps) {
  const { t, locale } = useTranslation()
  const open = shell.sheet?.id === 'export'
  const dayNotes = useTripStore(s => s.dayNotes)
  const [subscribeOpen, setSubscribeOpen] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(false)

  const exportPdf = async () => {
    if (!planner.trip || pdfBusy) return
    const flatNotes = Object.entries(dayNotes).flatMap(([dayId, notes]) =>
      notes.map(n => ({ ...n, day_id: Number(dayId) })),
    )
    setPdfBusy(true)
    try {
      await downloadTripPDF({
        trip: planner.trip,
        days: planner.days,
        places: planner.places,
        assignments: planner.assignments,
        categories: planner.categories,
        dayNotes: flatNotes,
        reservations: planner.reservations,
        t,
        locale,
      })
    } catch (e) {
      planner.toast.error(`${t('dayplan.pdfError')}: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setPdfBusy(false)
    }
  }

  const downloadIcs = async () => {
    try {
      const res = await fetch(`/api/trips/${planner.tripId}/export.ics`, { credentials: 'include' })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${planner.trip?.title || 'trip'}.ics`
      a.click()
      URL.revokeObjectURL(url)
      shell.closeSheet()
    } catch {
      planner.toast.error(t('planner.icsExportFailed'))
    }
  }

  return (
    <MSheet open={open} onClose={shell.closeSheet} variant="card" material="glass" ariaLabel={t('mobileTrip.exportCalendar')}>
      <div className="flex-none px-[18px] pt-4">
        <TileHeader
          icon={<CalendarPlus size={19} strokeWidth={1.8} />}
          title={t('mobileTrip.exportCalendar')}
          onClose={shell.closeSheet}
          closeLabel={t('common.close')}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[18px] pt-3">
        <div className="flex flex-col gap-2">
          <ExportRow
            icon={FileDown}
            title={pdfBusy ? t('common.loading') : t('dayplan.pdf')}
            sub={t('dayplan.pdfTooltip')}
            onClick={() => void exportPdf()}
          />
          <ExportRow
            icon={FileDown}
            title={t('mobileTrip.icsDownload')}
            sub={`${planner.trip?.title || 'trip'}.ics`}
            onClick={() => void downloadIcs()}
          />
          <ExportRow
            icon={CalendarPlus}
            title={t('mobileTrip.icsSubscribe')}
            sub={t('mobileTrip.icsSubscribeSub')}
            onClick={() => setSubscribeOpen(true)}
          />
        </div>
      </div>

      {subscribeOpen && (
        <IcsSubscribeModal
          endpoint={`/api/trips/${planner.tripId}/feed`}
          title={t('mobileTrip.icsSubscribe')}
          description={t('mobileTrip.icsSubscribeSub')}
          onClose={() => setSubscribeOpen(false)}
        />
      )}
    </MSheet>
  )
}

function ExportRow({ icon: Icon, title, sub, onClick }: {
  icon: LucideIcon
  title: ReactNode
  sub: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-[13px] rounded-[16px] px-3 py-[11px] text-left ${INNER_CLS}`}
    >
      <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[10px] bg-[color:var(--m-ic)]">
        <Icon size={16} strokeWidth={1.9} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.84375rem] font-semibold">{title}</span>
        <span className="block truncate font-geist text-[0.65625rem] text-m-muted">{sub}</span>
      </span>
      <ChevronRight size={15} strokeWidth={2} className="flex-none text-m-faint" />
    </button>
  )
}
