import { useId, useState } from 'react'
import { CalendarDays, CalendarPlus, ChevronRight, Download, FileText, Loader2, MapPin, Route as RouteIcon, UserRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { DialogHeader, DialogSection, DialogShell, DialogTile, NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { IcsSubscribeModal } from './IcsSubscribeModal'
import { SoftPill } from './planParts'
import { useToast } from '../shared/Toast'
import type { Trip, Day, Place, Category, AssignmentsMap, Reservation, DayNote } from '../../types'
import { useSettingsStore } from '../../store/settingsStore'
import { useRoadtripSettings } from '../../hooks/useRoadtripSettings'
import { useAuthStore } from '../../store/authStore'
import { hasPersonalPlan } from '../PDF/pdfScope'

/**
 * What a GPX download can carry. Worded by what someone wants on their device
 * rather than by the GPX element it maps to: "everything", "just the places" for
 * an offline map, "just the days" for following a plan. An omitted flag defaults
 * to true server-side, so the first entry needs no query at all.
 */
const GPX_SCOPES = [
  { key: 'all', query: '', labelKey: 'dayplan.gpxAll', icon: Download },
  { key: 'places', query: '?dayRoutes=false', labelKey: 'dayplan.gpxPlaces', icon: MapPin },
  { key: 'days', query: '?waypoints=false&tracks=false', labelKey: 'dayplan.gpxDays', icon: RouteIcon },
] as const

interface TripExportModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: number
  trip: Trip
  days: Day[]
  places: Place[]
  categories: Category[]
  assignments: AssignmentsMap
  reservations: Reservation[]
  dayNotes: Record<string, DayNote[]>
  t: (key: string, params?: Record<string, string | number>) => string
  locale: string
  toast: ReturnType<typeof useToast>
  /**
   * Gates "Subscribe to calendar" only. The one-off ICS download above it stays
   * open to every member: it is a file they already have the right to read,
   * while the subscription mints a link that works without an account.
   */
  canManageShare?: boolean
}

/**
 * Every way a trip leaves TREK, in one dialog: the day plan as a PDF, the
 * bookings as a calendar (a one-off .ics or a live subscription) and the map
 * data as GPX in the three scopes a device actually wants.
 *
 * It replaces three separate toolbar buttons, two of which opened hover menus of
 * their own. On a narrow sidebar that row simply ran out of width and the
 * exports dropped off the edge; one button cannot.
 */
export function TripExportModal({
  isOpen, onClose, tripId, trip, days, places, categories, assignments, reservations, dayNotes,
  t, locale, toast, canManageShare = true,
}: TripExportModalProps) {
  const [subscribeOpen, setSubscribeOpen] = useState(false)
  // Which row is working, so the dialog can say so instead of looking inert
  // while a 226 kB PDF builder is fetched and a document is rendered.
  const [busy, setBusy] = useState<string | null>(null)
  // The PDF is built outside React, so it cannot read this itself (#2066).
  const timeFormat = useSettingsStore(s => s.settings.time_format) || '24h'
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)
  // The export gets the store's assignments and applies the day plan's own filter to
  // them, so it needs the same switch the plan reads.
  const showServiceStops = useRoadtripSettings(s => s.roadtrip_service_stops_in_days !== false, tripId)
  const titleId = useId()
  const fileBase = trip?.title || 'trip'

  // Shared tail of every download: Firefox and Safari cancel the download when
  // the object URL is revoked before they picked the blob up, hence the delay.
  const saveBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    setTimeout(() => { URL.revokeObjectURL(url); a.remove() }, 100)
  }

  const myId = useAuthStore(s => s.user?.id)
  // "My plan" (#2168) only once somebody has been given a part of the trip.
  const offerMine = myId != null && hasPersonalPlan(assignments, reservations)

  const exportPdf = async (mine = false) => {
    if (busy) return
    setBusy(mine ? 'pdf:mine' : 'pdf')
    const flatNotes = Object.entries(dayNotes).flatMap(([dayId, notes]) =>
      notes.map(n => ({ ...n, day_id: Number(dayId) })),
    )
    try {
      // Loaded on click: the PDF builder is ~226 kB and hangs off the days
      // sidebar, so every trip used to pay for it whether or not anyone
      // exported. A missing chunk lands in the catch and shows the same error
      // the export already had.
      const { downloadTripPDF } = await import('../PDF/TripPDF')
      await downloadTripPDF({ trip, days, places, assignments, categories, dayNotes: flatNotes, reservations, t, locale, timeFormat, distanceUnit, showServiceStops, onlyUserId: mine ? myId : undefined })
      onClose()
    } catch (e) {
      console.error('PDF error:', e)
      toast.error(`${t('dayplan.pdfError')}: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(null)
    }
  }

  const downloadIcs = async () => {
    if (busy) return
    setBusy('ics')
    try {
      const res = await fetch(`/api/trips/${tripId}/export.ics`, { credentials: 'include' })
      if (!res.ok) throw new Error()
      saveBlob(await res.blob(), `${fileBase}.ics`)
      onClose()
    } catch {
      toast.error(t('planner.icsExportFailed'))
    } finally {
      setBusy(null)
    }
  }

  const downloadGpx = async (key: string, query: string) => {
    if (busy) return
    setBusy(`gpx:${key}`)
    try {
      const res = await fetch(`/api/trips/${tripId}/places/export.gpx${query}`, { credentials: 'include' })
      // 404 here means the selection is empty, which is worth its own message:
      // "nothing happened" and "the download broke" look identical otherwise.
      if (res.status === 404) { toast.info(t('dayplan.gpxEmpty')); return }
      if (!res.ok) throw new Error()
      saveBlob(await res.blob(), `${fileBase}.gpx`)
      onClose()
    } catch {
      toast.error(t('dayplan.gpxFailed'))
    } finally {
      setBusy(null)
    }
  }

  const header = (
    <DialogHeader
      tile={<DialogTile><Download size={20} strokeWidth={1.9} className="text-content-muted" /></DialogTile>}
      tint={NEUTRAL_TINT}
      labelId={titleId}
      onClose={onClose}
      title={t('dayplan.export')}
      sub={t('dayplan.exportIntro')}
      subWraps
    />
  )

  return (
    <>
      {/* While the subscription dialog sits on top, Escape and the backdrop are
          its own: one key press closes only the dialog in front. */}
      <DialogShell open={isOpen} onClose={onClose} labelledBy={titleId} width="narrow" blocked={subscribeOpen} header={header}>
        <DialogSection label={t('dayplan.exportDocument')}>
          <div className="flex flex-col gap-1.5">
            <ExportRow
              icon={FileText}
              title={t('dayplan.pdf')}
              sub={t('dayplan.pdfTooltip')}
              busy={busy === 'pdf'}
              disabled={busy != null}
              onClick={() => exportPdf()}
            />
            {offerMine && (
              <ExportRow
                icon={UserRound}
                title={t('dayplan.pdfMine')}
                sub={t('dayplan.pdfMineSub')}
                busy={busy === 'pdf:mine'}
                disabled={busy != null}
                onClick={() => exportPdf(true)}
              />
            )}
          </div>
        </DialogSection>

        <DialogSection label={t('dayplan.exportCalendar')}>
          <div className="flex flex-col gap-1.5">
            <ExportRow
              icon={CalendarDays}
              title={t('mobileTrip.icsDownload')}
              sub={`${fileBase}.ics`}
              busy={busy === 'ics'}
              disabled={busy != null}
              onClick={downloadIcs}
            />
            {canManageShare && (
              <ExportRow
                icon={CalendarPlus}
                title={t('mobileTrip.icsSubscribe')}
                sub={t('mobileTrip.icsSubscribeSub')}
                disabled={busy != null}
                onClick={() => setSubscribeOpen(true)}
              />
            )}
          </div>
        </DialogSection>

        {/* GPX: the counterpart to the GPX import in the places sidebar. The
            format name carries more than a translated heading would, so it
            stands beside the plain-language one as a pill of its own. */}
        <DialogSection label={<span className="inline-flex items-center gap-1.5">{t('dayplan.exportMaps')}<SoftPill caps>GPX</SoftPill></span>}>
          <div className="flex flex-col gap-1.5">
            {GPX_SCOPES.map(scope => (
              <ExportRow
                key={scope.key}
                icon={scope.icon}
                title={t(scope.labelKey)}
                busy={busy === `gpx:${scope.key}`}
                disabled={busy != null}
                onClick={() => downloadGpx(scope.key, scope.query)}
              />
            ))}
          </div>
        </DialogSection>
      </DialogShell>

      {/* Mounted after the export dialog, so its backdrop stacks above it. */}
      {subscribeOpen && canManageShare && (
        <IcsSubscribeModal
          endpoint={`/api/trips/${tripId}/feed`}
          title={t('mobileTrip.icsSubscribe')}
          description={t('mobileTrip.icsSubscribeSub')}
          onClose={() => setSubscribeOpen(false)}
        />
      )}
    </>
  )
}

/** One export as a card: its icon tile (a spinner while it works), what it makes, and the chevron. */
function ExportRow({ icon: Icon, title, sub, busy = false, disabled = false, onClick }: {
  icon: LucideIcon
  title: string
  sub?: string
  busy?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex w-full items-center gap-3 rounded-[14px] border border-edge-faint bg-surface-card px-3 py-2.5 text-left transition-colors enabled:hover:bg-surface-hover disabled:cursor-default disabled:opacity-50"
    >
      <span className="grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-surface-tertiary text-content-secondary transition-colors group-enabled:group-hover:bg-surface-card group-enabled:group-hover:text-content">
        {busy ? <Loader2 size={16} strokeWidth={2} className="animate-spin" /> : <Icon size={16} strokeWidth={1.9} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-content" style={fs(13.5, 'body')}>{title}</span>
        {sub && <span className="block truncate text-content-muted" style={fs(11.5)}>{sub}</span>}
      </span>
      <ChevronRight size={15} strokeWidth={2} className="flex-none text-content-faint transition-transform group-enabled:group-hover:translate-x-0.5" />
    </button>
  )
}
