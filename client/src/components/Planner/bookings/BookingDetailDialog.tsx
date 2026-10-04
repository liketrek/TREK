import { useState, type ReactNode } from 'react'
import { CalendarDays, Copy, FolderOpen, Pencil, RefreshCw, Route as RouteIcon, Wallet } from 'lucide-react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import type { BudgetItem, Reservation, TripFile } from '../../../types'
import type { ViewContribution } from '../../../api/client'
import type { ActivePlugin } from '../../../store/pluginStore'
import { useTranslation } from '../../../i18n'
import { useTripStore } from '../../../store/tripStore'
import { useSettingsStore } from '../../../store/settingsStore'
import { useToast } from '../../shared/Toast'
import { BlurredCode } from '../../shared/BookingCode'
import { markdownLinkComponents } from '../../shared/markdownLink'
import NameDialog from '../../shared/NameDialog'
import { Tooltip } from '../../shared/Tooltip'
import PluginFrame from '../../Plugins/PluginFrame'
import { PluginCardFooter } from '../../Plugins/PluginContributions'
import { formatMoney, formatTime } from '../../../utils/formatters'
import { fmtTransitDuration } from '../transitDisplay'
import { parseMeta, displayTitle } from './bookingsModel'
import { formatDay, type BookingFacts } from './bookingFacts'
import { AirTrailPill, BOX, Eyebrow, Field, FileRows, ReviewPill, TravelerChips, fs, toneOf } from './bookingParts'
import { TransitLegs, transitSummary } from './transitParts'
import { BookingDialogHeader, StatusPill, TypePill } from './BookingDialogShell'
import { DeleteButton, DialogButton, DialogFooter, DialogSection as Section, DialogShell, FooterSpacer, PILL } from '../../shared/DialogShell'

export interface BookingDetailDialogProps {
  r: Reservation
  facts: BookingFacts
  files: TripFile[]
  linkedCosts: BudgetItem[]
  tripId: number
  /** reservation_edit: renaming, the status switch and Delete. */
  canEdit: boolean
  /** True while a question opened from here (the delete confirmation) sits on top. */
  covered?: boolean
  onClose: () => void
  /** Opens the booking's editor. Without it there is no Edit: the editor behind it
   *  can need a right of its own (a transport's is day_edit on the plan). */
  onEdit?: () => void
  onDelete: () => void
  onToggleStatus: () => void
  onShowOnMap?: () => void
  onMap?: boolean
  onEditExpense?: (item: BudgetItem) => void
  /** A transit journey only: search the connection again from the same stops. */
  onChangeRoute?: () => void
  onNavigateToFiles: () => void
  contributions: ViewContribution[]
  detailPlugins: ActivePlugin[]
}

/**
 * The phone's detail sheet on the desktop, as a dialog over the tab: the head
 * band tinted by the status like the card it opens from, everything the booking
 * holds below it, and the actions in a bar that stays in reach. Editing opens
 * the booking's own dialog.
 */
export default function BookingDetailDialog(p: BookingDetailDialogProps) {
  const { r, facts } = p
  const { t, locale } = useTranslation()
  const toast = useToast()
  const updateReservation = useTripStore(s => s.updateReservation)
  const tripCurrency = useTripStore(s => s.trip?.currency)
  const timeFormat = useSettingsStore(s => s.settings.time_format) || '24h'
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState('')
  const meta = parseMeta(r)
  const tone = toneOf(r)
  const transit = transitSummary(meta)
  const titleId = `booking-detail-${r.id}`
  // Escape and the backdrop wait while the rename field or the delete question is being answered.
  const blocked = renaming || !!p.covered

  const subParts = [meta.airline, meta.flight_number, meta.train_number, facts.endpoints.length >= 2 ? facts.endpoints.map(e => e.code || e.name).join(' → ') : null].filter(Boolean)
  const sub = subParts.length ? subParts.join('  ') : null

  const stats: { value: string; label: string }[] = []
  if (facts.isHotel) {
    if (facts.startDate) stats.push({ value: formatDay(facts.startDate, locale, false), label: t('reservations.meta.checkIn') + (meta.check_in_time ? ` ${meta.check_in_time}` : '') })
    if (facts.endDate) stats.push({ value: formatDay(facts.endDate, locale, false), label: t('reservations.meta.checkOut') + (meta.check_out_time ? ` ${meta.check_out_time}` : '') })
    const nights = nightsBetween(facts.startDate, facts.endDate)
    if (nights) stats.push({ value: String(nights), label: t('reservations.nights', { count: nights }) })
  } else {
    const from = facts.endpoints[0]
    const to = facts.endpoints[facts.endpoints.length - 1]
    // Each tile formats its own time: a booking with only an end has no "start → end" line to cut up.
    if (facts.startTime) stats.push({ value: formatTime(facts.startTime, locale, timeFormat), label: from?.name || t('reservations.start') })
    if (facts.endTime) stats.push({ value: formatTime(facts.endTime, locale, timeFormat), label: to?.name || t('reservations.end') })
    if (transit?.duration) stats.push({ value: fmtTransitDuration(transit.duration, t), label: t('transit.durationLabel') })
    if (transit && transit.legs.length > 0) stats.push({ value: String(transit.transfers), label: t('transit.transfersLabel') })
    // Under a minute of walking is not worth a tile.
    if (transit && transit.walk > 59) stats.push({ value: t('transit.min', { count: Math.round(transit.walk / 60) }), label: t('transit.walkLabel') })
    if (meta.platform) stats.push({ value: meta.platform, label: t('reservations.meta.platform') })
    if (meta.seat) stats.push({ value: meta.seat, label: t('reservations.meta.seat') })
  }
  // Cells already shown as a stat stay out of the field grid below.
  const shownAsStat = new Set([t('reservations.meta.platform'), t('reservations.meta.seat'), t('reservations.meta.checkIn'), t('reservations.meta.checkOut')])
  const cells = facts.cells.filter(c => !shownAsStat.has(c.label))
  const hasDetails = !!(facts.place || facts.accommodation || facts.linked || facts.url)

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(r.confirmation_number || '')
      toast.success(t('common.copied'))
    } catch {
      toast.error(t('reservations.copyFailed'))
    }
  }
  const rename = async () => {
    const title = name.trim()
    setRenaming(false)
    if (!title || title === r.title) return
    try {
      await updateReservation(p.tripId, r.id, { title })
    } catch {
      toast.error(t('reservations.toast.updateError'))
    }
  }

  const header = (
    <BookingDialogHeader
      tone={tone}
      type={r.type}
      labelId={titleId}
      onClose={p.onClose}
      title={displayTitle(r)}
      onTitleClick={p.canEdit ? () => { setName(r.title); setRenaming(true) } : undefined}
      titleTooltip={t('reservations.rename')}
      sub={sub}
      pills={(
        <>
          {tone !== 'transit' && <StatusPill status={tone} onToggle={p.canEdit ? p.onToggleStatus : undefined} />}
          <TypePill type={r.type} />
          {facts.day && (
            <span className={PILL}>
              <CalendarDays size={13} strokeWidth={2.2} className="text-content-faint" />
              {facts.day.label}
              {/* A stay's dates already stand in the check-in and check-out tiles. */}
              {facts.day.date && !facts.isHotel && <span className="font-medium text-content-muted">{facts.day.date}</span>}
            </span>
          )}
          {!!r.needs_review && <ReviewPill pill />}
          <AirTrailPill r={r} pill />
          {r.confirmation_number && (
            <span className={`${PILL} ml-auto gap-1 py-0.5 pr-1`}>
              <BlurredCode className="font-geist tabular-nums">#{r.confirmation_number}</BlurredCode>
              <Tooltip label={t('reservations.copyCode')}>
                <button type="button" onClick={copyCode} aria-label={t('reservations.copyCode')}
                  className="grid h-6 w-6 place-items-center rounded-full text-content-faint hover:bg-surface-hover hover:text-content">
                  <Copy size={12} strokeWidth={2} />
                </button>
              </Tooltip>
            </span>
          )}
        </>
      )}
    />
  )

  const footer = (p.onShowOnMap || p.onChangeRoute || p.canEdit || p.onEdit) && (
    <DialogFooter>
      {p.onShowOnMap && (
        <DialogButton onClick={p.onShowOnMap} aria-pressed={!!p.onMap} active={!!p.onMap} icon={<RouteIcon size={14} strokeWidth={2} />}>
          {t('mobileTrip.onMap')}
        </DialogButton>
      )}
      {p.onChangeRoute && (
        <DialogButton onClick={p.onChangeRoute} icon={<RefreshCw size={14} strokeWidth={2} />}>{t('transit.changeRoute')}</DialogButton>
      )}
      <FooterSpacer />
      {p.canEdit && <DeleteButton onClick={p.onDelete} />}
      {p.onEdit && (
        <DialogButton variant="primary" onClick={p.onEdit} icon={<Pencil size={14} strokeWidth={2} />}>{t('common.edit')}</DialogButton>
      )}
    </DialogFooter>
  )

  return (
    <>
      <DialogShell onClose={p.onClose} labelledBy={titleId} blocked={blocked} header={header} footer={footer}>
        {stats.length > 0 && (
          <div className="flex gap-2">
            {stats.map((s, i) => (
              <div key={i} className="min-w-0 flex-1 rounded-[12px] bg-surface-tertiary px-3 py-2.5 text-center">
                <div className="truncate font-bold tabular-nums tracking-[-0.01em] text-content" style={fs(18, 'subtitle')}>{s.value}</div>
                <div className="mt-0.5 truncate font-geist text-content-faint" style={fs(10.5)}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {transit && transit.legs.length > 0 && (
          <Section label={t('transit.itinerary')}>
            <TransitLegs legs={transit.legs} />
          </Section>
        )}

        {facts.endpoints.length > 2 && (
          <Section label={t('reservations.routeLabel')}>
            <div className={`${BOX} flex flex-col gap-2 px-3.5 py-3`}>
              {facts.endpoints.map((ep, i) => (
                <div key={ep.id ?? i} className="flex items-center gap-2.5" style={fs(13, 'body')}>
                  <span className="w-12 flex-none text-right font-semibold tabular-nums text-content">{ep.local_time ? formatTime(ep.local_time, locale, timeFormat) : ''}</span>
                  <span className="h-2.5 w-2.5 flex-none rounded-full border-2" style={{ borderColor: 'var(--text-faint)' }} />
                  <span className="min-w-0 flex-1 truncate font-medium text-content">{ep.code ? <b className="mr-1.5">{ep.code}</b> : null}{ep.name}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {facts.legCodes.length > 0 && (
          <Section label={t('reservations.segmentCodes')}>
            <div className={`${BOX} flex flex-col gap-1.5 px-3.5 py-2.5`}>
              {facts.legCodes.map((l, i) => (
                <div key={i} className="flex items-center gap-2" style={fs(13, 'body')}>
                  <span className="min-w-0 flex-1 truncate font-medium text-content-secondary">{l.route || t('reservations.confirmationCode')}</span>
                  <BlurredCode className="font-geist tabular-nums text-content-muted">#{l.code}</BlurredCode>
                </div>
              ))}
            </div>
          </Section>
        )}

        {cells.length > 0 && (
          <div className="grid grid-cols-3 gap-2 max-sm:grid-cols-2">
            {cells.map((c, i) => <Field key={i} label={c.label}>{c.value}</Field>)}
          </div>
        )}

        {hasDetails && (
          <div className="flex flex-col gap-2">
            {facts.place && <DetailField label={t('reservations.locationAddress')}>{facts.place}</DetailField>}
            {facts.accommodation && <DetailField label={t('reservations.meta.linkAccommodation')}>{facts.accommodation}</DetailField>}
            {facts.linked && <DetailField label={t('reservations.linkedTo')}>{facts.linked}</DetailField>}
            {facts.url && (
              <DetailField label={t('reservations.urlLabel')}>
                {facts.url.href ? <a href={facts.url.href} target="_blank" rel="noopener noreferrer" className="text-content hover:underline">{facts.url.href}</a> : facts.url.text}
              </DetailField>
            )}
          </div>
        )}

        {(r.travelers || []).length > 0 && (
          <Section label={t('reservations.travelers.label')}>
            <TravelerChips travelers={r.travelers || []} />
          </Section>
        )}

        {r.notes && (
          <Section label={t('reservations.notes')}>
            <div className={`${BOX} collab-note-md px-3.5 py-3 text-content-secondary`} style={{ ...fs(13, 'body'), wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
              <Markdown remarkPlugins={[remarkGfm, remarkBreaks]} components={markdownLinkComponents}>{r.notes}</Markdown>
            </div>
          </Section>
        )}

        {p.linkedCosts.length > 0 && (
          <Section label={t('reservations.costsLabel')}>
            <div className="flex flex-col gap-1.5">
              {p.linkedCosts.map(item => (
                <button key={item.id} type="button" disabled={!p.onEditExpense} onClick={() => p.onEditExpense?.(item)}
                  className={`${BOX} flex items-center gap-2.5 px-3.5 py-2.5 text-left enabled:hover:bg-surface-hover`} style={fs(13, 'body')}>
                  <Wallet size={14} strokeWidth={2} className="flex-none text-content-faint" />
                  <span className="min-w-0 flex-1 truncate font-medium text-content">{item.name}</span>
                  <span className="flex-none font-semibold tabular-nums text-content">{formatMoney(item.total_price, (item.currency || tripCurrency || 'EUR'), locale)}</span>
                </button>
              ))}
            </div>
          </Section>
        )}

        {p.files.length > 0 && (
          <Section
            label={t('files.title')}
            action={(
              <button type="button" onClick={p.onNavigateToFiles} className="inline-flex items-center gap-1 font-geist font-semibold text-content-muted hover:text-content" style={fs(11)}>
                <FolderOpen size={11} strokeWidth={2} />{t('reservations.showInFiles')}
              </button>
            )}
          >
            <FileRows files={p.files} />
          </Section>
        )}

        {(p.contributions.length > 0 || p.detailPlugins.length > 0) && (
          <div className="flex flex-col gap-2">
            <PluginCardFooter items={p.contributions} tripId={p.tripId} />
            {p.detailPlugins.map(pl => (
              <div key={pl.id} className={`${BOX} overflow-hidden`}>
                <PluginFrame pluginId={pl.id} tripId={String(p.tripId)} reservationId={String(r.id)} title={pl.name} surface="detail-slot" />
              </div>
            ))}
          </div>
        )}
      </DialogShell>

      <NameDialog
        open={renaming}
        title={t('reservations.rename')}
        placeholder={t('reservations.titlePlaceholder')}
        confirmLabel={t('common.save')}
        value={name}
        onChange={setName}
        onConfirm={rename}
        onClose={() => setRenaming(false)}
      />
    </>
  )
}

/** A labelled value too long to centre in a field cell: an address, a link, the linked plan entry. */
function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <Eyebrow className="mb-[3px]">{label}</Eyebrow>
      <div className={`${BOX} truncate px-3.5 py-2.5 font-medium text-content`} style={fs(13, 'body')}>{children}</div>
    </div>
  )
}

function nightsBetween(a: string | null, b: string | null): number {
  if (!a || !b) return 0
  const n = Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 864e5)
  return n > 0 ? n : 0
}
