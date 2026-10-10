import { useState, type ReactNode } from 'react'
import { CalendarPlus, ChevronRight, FileDown, Share2, UserRound } from 'lucide-react'
import MSheet from '../../../components/MSheet'
import { IcsSubscribeModal } from '../../../../components/Planner/IcsSubscribeModal'
import { useTripStore } from '../../../../store/tripStore'
import { useTranslation } from '../../../../i18n'
import { useTripExport } from '../../../../components/Planner/useTripExport'
import { INNER_CLS, TileHeader } from './MTripSheetUi'
import type { MTripSheetsProps } from '../MTripShell'
import type { LucideIcon } from 'lucide-react'

/**
 * Export sheet ('export', opened from the Mehr sheet): the desktop day-plan
 * toolbar's PDF export, GPX download, ICS download and calendar subscription in
 * one place. The subscription dialog is the shared IcsSubscribeModal — it owns the
 * enable/rotate/disable token flow.
 */
export default function MExportSheet({ planner, shell }: MTripSheetsProps) {
  const { t, locale } = useTranslation()
  const open = shell.sheet?.id === 'export'
  const dayNotes = useTripStore(s => s.dayNotes)
  const [subscribeOpen, setSubscribeOpen] = useState(false)
  // Fed the way the desktop dialog feeds it: the store's assignments, and the export
  // applies the day plan's filter itself, so both shells print the same. The PDF stays
  // open here; a calendar or GPX file closes the sheet.
  const { offerMine, isRunning, exportPdf, downloadIcs, downloadGpx } = useTripExport({
    tripId: planner.tripId,
    data: {
      trip: planner.trip,
      days: planner.days,
      places: planner.places,
      assignments: planner.storedAssignments,
      categories: planner.categories,
      reservations: planner.reservations,
      dayNotes,
    },
    t,
    locale,
    toast: planner.toast,
    exclusive: false,
    onExported: shell.closeSheet,
    requireTrip: true,
    closeAfterPdf: false,
    logPdfErrors: false,
  })
  // The subscription link reads the trip without an account, so it needs the
  // same permission as the public share link. The ICS download beside it does
  // not: that is a file this member may already read.
  const canManageShare = planner.can('share_manage', planner.trip)

  // Everything in one file here: the desktop menu's three scopes are a hover
  // affordance the phone does not have, and "the whole trip" is what you want
  // on a device anyway.
  return (
    <MSheet open={open} onClose={shell.closeSheet} variant="card" material="glass" ariaLabel={t('mobileTrip.export')}>
      <div className="flex-none px-[18px] pt-4">
        <TileHeader
          icon={<FileDown size={19} strokeWidth={1.8} />}
          title={t('mobileTrip.export')}
          onClose={shell.closeSheet}
          closeLabel={t('common.close')}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[18px] pt-3">
        <div className="flex flex-col gap-2">
          <ExportRow
            icon={FileDown}
            title={isRunning('pdf') ? t('common.loading') : t('dayplan.pdf')}
            sub={t('dayplan.pdfTooltip')}
            onClick={() => void exportPdf()}
          />
          {offerMine && (
            <ExportRow
              icon={UserRound}
              title={isRunning('pdf:mine') ? t('common.loading') : t('dayplan.pdfMine')}
              sub={t('dayplan.pdfMineSub')}
              onClick={() => void exportPdf(true)}
            />
          )}
          <ExportRow
            icon={FileDown}
            title={isRunning('ics') ? t('common.loading') : t('mobileTrip.icsDownload')}
            sub={`${planner.trip?.title || 'trip'}.ics`}
            onClick={() => void downloadIcs()}
          />
          <ExportRow
            icon={Share2}
            title={isRunning('gpx:all') ? t('common.loading') : t('dayplan.gpxAll')}
            sub={t('dayplan.gpxTooltip')}
            onClick={() => void downloadGpx('all', '')}
          />
          {canManageShare && (
            <ExportRow
              icon={CalendarPlus}
              title={t('mobileTrip.icsSubscribe')}
              sub={t('mobileTrip.icsSubscribeSub')}
              onClick={() => setSubscribeOpen(true)}
            />
          )}
        </div>
      </div>

      {subscribeOpen && canManageShare && (
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
      className={`flex w-full items-center gap-[13px] rounded-[16px] px-3 py-[11px] text-start ${INNER_CLS}`}
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
