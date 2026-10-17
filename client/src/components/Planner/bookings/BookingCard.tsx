import { Pencil, Trash2, Wallet } from 'lucide-react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import type { Reservation, TripFile } from '../../../types'
import type { ViewContribution } from '../../../api/client'
import type { ActivePlugin } from '../../../store/pluginStore'
import { useTranslation } from '../../../i18n'
import { markdownLinkComponents } from '../../shared/markdownLink'
import { BlurredCode } from '../../shared/BookingCode'
import PluginFrame from '../../Plugins/PluginFrame'
import { PluginCardFooter } from '../../Plugins/PluginContributions'
import { fmtTransitDuration } from '../transitDisplay'
import { formatMoney } from '../../../utils/formatters'
import { parseMeta, displayTitle, type CostTotal } from './bookingsModel'
import type { BookingFacts } from './bookingFacts'
import {
  AirTrailPill, BOX, Block, Field, FileRows, ReviewPill, RoundAction, RouteBox, StatusDot, TravelerChips, TypeChip, WhenFields,
  fs, toneOf, toneTint,
} from './bookingParts'
import { TransitLegs, transitSummary } from './transitParts'

export interface BookingCardProps {
  r: Reservation
  facts: BookingFacts
  files: TripFile[]
  costs: CostTotal[]
  tripId: number
  canEdit: boolean
  selected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleStatus: () => void
  contributions: ViewContribution[]
  detailPlugins: ActivePlugin[]
  /** False while the detail pane shows this booking, so its plugin frames are not mounted twice. */
  showFrames: boolean
}

/**
 * One booking or transport as the phone draws it: a head band tinted by its
 * status with the status switch, the type and the title, then framed fields.
 * The desktop keeps every value the old card had, so nothing is behind a tap.
 */
export default function BookingCard(p: BookingCardProps) {
  const { r, facts } = p
  const { t, locale } = useTranslation()
  const tone = toneOf(r)
  const transit = r.type === 'transit'

  return (
    <article
      tabIndex={0}
      onClick={p.onSelect}
      onKeyDown={e => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); p.onSelect() } }}
      aria-label={displayTitle(r)}
      className={`group flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-surface-secondary transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--text-primary)] ${p.selected ? 'border-[color:var(--text-primary)]' : 'border-edge-faint'}`}
    >
      <div className="flex items-center gap-2 border-b border-edge-faint px-3 py-2.5" style={{ background: toneTint(tone) }}>
        <StatusDot r={r} canToggle={p.canEdit} onToggle={p.onToggleStatus} />
        <TypeChip type={r.type} />
        <span className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="min-w-0 truncate font-bold text-content" style={fs(13.5, 'body')}>{displayTitle(r)}</span>
          {!!r.needs_review && <ReviewPill />}
        </span>
        <AirTrailPill r={r} />
        {p.canEdit && <RoundAction label={t('common.edit')} onClick={p.onEdit}><Pencil size={12} strokeWidth={2} /></RoundAction>}
        {p.canEdit && <RoundAction label={t('common.delete')} onClick={p.onDelete} danger><Trash2 size={12} strokeWidth={2} /></RoundAction>}
      </div>

      <div className="flex flex-1 flex-col gap-2 px-3 pb-3 pt-2.5">
        <WhenFields facts={facts} />

        {transit ? <TransitBody r={r} /> : (
          <>
            {r.confirmation_number && (
              <Field label={t('reservations.confirmationCode')} tabular>
                <BlurredCode className="font-geist">{r.confirmation_number}</BlurredCode>
              </Field>
            )}
            <RouteBox type={r.type} facts={facts} />
            {facts.legCodes.length > 0 && (
              <Block label={t('reservations.segmentCodes')}>
                <div className={`${BOX} flex flex-col gap-1 px-[10px] py-2`}>
                  {facts.legCodes.map((l, i) => (
                    <div key={i} className="flex items-center gap-2" style={fs(12, 'body')}>
                      <span className="min-w-0 flex-1 truncate font-medium text-content-secondary">{l.route || t('reservations.confirmationCode')}</span>
                      <BlurredCode className="font-geist tabular-nums text-content-muted">{l.code}</BlurredCode>
                    </div>
                  ))}
                </div>
              </Block>
            )}
            {facts.cells.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {facts.cells.map((c, i) => <Field key={i} label={c.label}>{c.value}</Field>)}
              </div>
            )}
          </>
        )}

        {facts.place && <Field label={t('reservations.locationAddress')}>{facts.place}</Field>}
        {facts.accommodation && <Field label={t('reservations.meta.linkAccommodation')}>{facts.accommodation}</Field>}
        {facts.linked && <Field label={t('reservations.linkedTo')}>{facts.linked}</Field>}
        {facts.url && (
          <Field label={t('reservations.urlLabel')}>
            {facts.url.href
              ? <a href={facts.url.href} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-content hover:underline">{facts.url.href}</a>
              : facts.url.text}
          </Field>
        )}

        {r.notes && (
          <Block label={t('reservations.notes')}>
            <div className={`${BOX} collab-note-md line-clamp-4 px-[10px] py-2 text-content-muted`} style={fs(12, 'body')}>
              <Markdown remarkPlugins={[remarkGfm, remarkBreaks]} components={markdownLinkComponents}>{r.notes}</Markdown>
            </div>
          </Block>
        )}

        {(r.travelers || []).length > 0 && (
          <Block label={t('reservations.travelers.label')}>
            <TravelerChips travelers={r.travelers || []} />
          </Block>
        )}

        {p.files.length > 0 && (
          <Block label={t('files.title')}>
            <FileRows files={p.files} />
          </Block>
        )}

        {p.costs.length > 0 && (
          <div className="mt-auto flex flex-wrap justify-end gap-1.5 pt-0.5">
            {p.costs.map(c => (
              <span key={c.currency} className="inline-flex items-center gap-1 rounded-full bg-surface-tertiary px-2.5 py-[3px] font-geist font-semibold tabular-nums text-content-secondary" style={fs(11.5)}>
                <Wallet size={11} strokeWidth={2} className="text-content-faint" />
                {formatMoney(c.amount, c.currency, locale)}
              </span>
            ))}
          </div>
        )}
      </div>

      <PluginCardFooter items={p.contributions} tripId={p.tripId} />
      {p.showFrames && p.detailPlugins.length > 0 && (
        <div role="presentation" onClick={e => e.stopPropagation()} className="flex flex-col gap-2 px-3 pb-3">
          {p.detailPlugins.map(pl => (
            <div key={pl.id} className={`${BOX} overflow-hidden`}>
              <PluginFrame pluginId={pl.id} tripId={String(p.tripId)} reservationId={String(r.id)} title={pl.name} surface="detail-slot" />
            </div>
          ))}
        </div>
      )}
    </article>
  )
}

/** A transit journey as the dialog shows it, compacted: its totals as fields, then leg by leg. */
function TransitBody({ r }: { r: Reservation }) {
  const { t } = useTranslation()
  const journey = transitSummary(parseMeta(r))
  if (!journey) return null
  const cells: { label: string; value: string }[] = []
  if (journey.duration) cells.push({ label: t('transit.durationLabel'), value: fmtTransitDuration(journey.duration, t) })
  if (journey.legs.length > 0) cells.push({ label: t('transit.transfersLabel'), value: String(journey.transfers) })
  if (journey.walk > 59) cells.push({ label: t('transit.walkLabel'), value: t('transit.min', { count: Math.round(journey.walk / 60) }) })
  return (
    <>
      {cells.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {cells.map((c, i) => <Field key={i} label={c.label}>{c.value}</Field>)}
        </div>
      )}
      {journey.legs.length > 0 && (
        <Block label={t('transit.itinerary')}>
          <TransitLegs legs={journey.legs} compact />
        </Block>
      )}
    </>
  )
}
