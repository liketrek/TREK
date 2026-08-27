import { useState, type ReactNode } from 'react'
import { CalendarPlus, ChevronRight, FileDown, Share2 } from 'lucide-react'
import MSheet from '../../../components/MSheet'
import { IcsSubscribeModal } from '../../../../components/Planner/IcsSubscribeModal'
import { useTripStore } from '../../../../store/tripStore'
import { useSettingsStore } from '../../../../store/settingsStore'
import { useTranslation } from '../../../../i18n'
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
  // The PDF is built outside React, so it cannot read this itself (#2066).
  const timeFormat = useSettingsStore(s => s.settings.time_format) || '24h'
  const open = shell.sheet?.id === 'export'
  const dayNotes = useTripStore(s => s.dayNotes)
  const [subscribeOpen, setSubscribeOpen] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(false)
  const [icsBusy, setIcsBusy] = useState(false)
  const [gpxBusy, setGpxBusy] = useState(false)
  // The subscription link reads the trip without an account, so it needs the
  // same permission as the public share link. The ICS download beside it does
  // not: that is a file this member may already read.
  const canManageShare = planner.can('share_manage', planner.trip)

  const exportPdf = async () => {
    if (!planner.trip || pdfBusy) return
    const flatNotes = Object.entries(dayNotes).flatMap(([dayId, notes]) =>
      notes.map(n => ({ ...n, day_id: Number(dayId) })),
    )
    setPdfBusy(true)
    try {
      // See DayPlanSidebarToolbar: loaded on demand, not with the trip.
      const { downloadTripPDF } = await import('../../../../components/PDF/TripPDF')
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
        timeFormat,
      })
    } catch (e) {
      planner.toast.error(`${t('dayplan.pdfError')}: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setPdfBusy(false)
    }
  }

  const downloadIcs = async () => {
    if (icsBusy) return
    setIcsBusy(true)
    try {
      const res = await fetch(`/api/trips/${planner.tripId}/export.ics`, { credentials: 'include' })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${planner.trip?.title || 'trip'}.ics`
      document.body.appendChild(a)
      a.click()
      // Firefox/Safari cancel the download when the object URL is revoked
      // before they picked the blob up.
      setTimeout(() => { URL.revokeObjectURL(url); a.remove() }, 100)
      shell.closeSheet()
    } catch {
      planner.toast.error(t('planner.icsExportFailed'))
    } finally {
      setIcsBusy(false)
    }
  }

  // Everything in one file here: the desktop menu's three scopes are a hover
  // affordance the phone does not have, and "the whole trip" is what you want
  // on a device anyway.
  const downloadGpx = async () => {
    if (gpxBusy) return
    setGpxBusy(true)
    try {
      const res = await fetch(`/api/trips/${planner.tripId}/places/export.gpx`, { credentials: 'include' })
      if (res.status === 404) { planner.toast.info(t('dayplan.gpxEmpty')); return }
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${planner.trip?.title || 'trip'}.gpx`
      document.body.appendChild(a)
      a.click()
      setTimeout(() => { URL.revokeObjectURL(url); a.remove() }, 100)
      shell.closeSheet()
    } catch {
      planner.toast.error(t('dayplan.gpxFailed'))
    } finally {
      setGpxBusy(false)
    }
  }

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
            title={pdfBusy ? t('common.loading') : t('dayplan.pdf')}
            sub={t('dayplan.pdfTooltip')}
            onClick={() => void exportPdf()}
          />
          <ExportRow
            icon={FileDown}
            title={icsBusy ? t('common.loading') : t('mobileTrip.icsDownload')}
            sub={`${planner.trip?.title || 'trip'}.ics`}
            onClick={() => void downloadIcs()}
          />
          <ExportRow
            icon={Share2}
            title={gpxBusy ? t('common.loading') : t('dayplan.gpxAll')}
            sub={t('dayplan.gpxTooltip')}
            onClick={() => void downloadGpx()}
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
