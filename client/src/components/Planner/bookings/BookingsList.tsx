import { useRef, type KeyboardEvent } from 'react'
import { Paperclip, Pencil, Trash2, Wallet } from 'lucide-react'
import type { Reservation } from '../../../types'
import { useTranslation } from '../../../i18n'
import { BlurredCode } from '../../shared/BookingCode'
import { formatMoney } from '../../../utils/formatters'
import { TransitLegChips } from '../transitDisplay'
import { displayTitle, parseMeta, type BookingGroup, type CostTotal } from './bookingsModel'
import type { BookingFacts } from './bookingFacts'
import { AirTrailPill, CountPill, EYEBROW, ReviewPill, RoundAction, StatusDot, TravelerStack, TypeTile, fs } from './bookingParts'

export interface BookingsListProps {
  groups: BookingGroup[]
  factsOf: (r: Reservation) => BookingFacts
  filesCount: (r: Reservation) => number
  costsOf: (r: Reservation) => CostTotal[]
  selectedId: number | null
  canEdit: boolean
  collapsed: (groupId: string) => boolean
  onToggleGroup: (groupId: string) => void
  onSelect: (r: Reservation) => void
  onEdit: (r: Reservation) => void
  onDelete: (r: Reservation) => void
  onToggleStatus: (r: Reservation) => void
}

/**
 * The dense view: one card per group, one row per booking, like the phone's
 * lists. A row opens the detail dialog; the arrow keys move through the rows
 * and Enter or Space opens the one in focus.
 */
export default function BookingsList(p: BookingsListProps) {
  const { t, locale } = useTranslation()
  const rootRef = useRef<HTMLDivElement>(null)
  const flat = p.groups.flatMap(g => (p.collapsed(g.id) ? [] : g.items))

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const focused = document.activeElement instanceof HTMLElement ? Number(document.activeElement.dataset.row) : Number.NaN
    const i = flat.findIndex(r => r.id === focused)
    const next = flat[e.key === 'ArrowDown' ? Math.min(flat.length - 1, i + 1) : Math.max(0, i - 1)]
    if (next) rootRef.current?.querySelector<HTMLElement>(`[data-row="${next.id}"]`)?.focus()
  }

  return (
    <div ref={rootRef} onKeyDown={onKeyDown} className="flex flex-col gap-6">
      {p.groups.map(g => {
        const open = !p.collapsed(g.id)
        return (
          <section key={g.id} className="overflow-hidden rounded-2xl border border-edge-faint bg-surface-card">
            {g.label && (
              <button type="button" onClick={() => p.onToggleGroup(g.id)} aria-expanded={open}
                className="flex w-full items-center gap-2 bg-surface-secondary px-3.5 py-2.5 text-left">
                <span className={EYEBROW} style={fs(10.5)}>{g.label}</span>
                {g.sub && <span className="truncate font-geist font-medium text-content-muted" style={fs(11.5)}>{g.sub}</span>}
                <CountPill>{g.items.length}</CountPill>
              </button>
            )}
            {open && g.items.map(r => (
              <Row key={r.id} r={r} p={p} facts={p.factsOf(r)} files={p.filesCount(r)} costs={p.costsOf(r)} t={t} locale={locale} />
            ))}
          </section>
        )
      })}
    </div>
  )
}

function Row({ r, p, facts, files, costs, t, locale }: {
  r: Reservation
  p: BookingsListProps
  facts: BookingFacts
  files: number
  costs: CostTotal[]
  t: (k: string, v?: Record<string, string | number>) => string
  locale: string
}) {
  const selected = p.selectedId === r.id
  const transit = r.type === 'transit'
  const meta = parseMeta(r)
  const sub = facts.endpoints.length >= 2
    ? facts.endpoints.map(e => e.code || e.name).join(' → ')
    : facts.accommodation || facts.place || ''
  const extras: string[] = [meta.airline && meta.flight_number ? `${meta.airline} ${meta.flight_number}` : meta.flight_number || meta.airline, meta.train_number, meta.seat, meta.platform].filter(Boolean)

  return (
    <div
      data-row={r.id}
      tabIndex={0}
      role="button"
      aria-pressed={selected}
      aria-label={displayTitle(r)}
      onClick={() => p.onSelect(r)}
      onKeyDown={e => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); p.onSelect(r) } }}
      className={`group relative grid cursor-pointer grid-cols-[22px_32px_minmax(0,1fr)_minmax(118px,auto)_auto] items-center gap-3 border-t border-edge-faint px-3.5 py-2.5 first:border-t-0 hover:bg-surface-hover focus-visible:outline-none focus-visible:bg-surface-hover ${selected ? 'bg-surface-hover shadow-[inset_3px_0_0_0_var(--text-primary)]' : ''}`}
    >
      <StatusDot r={r} canToggle={p.canEdit} onToggle={() => p.onToggleStatus(r)} />
      <TypeTile type={r.type} />
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate font-semibold text-content" style={fs(13.5, 'body')}>{displayTitle(r)}</span>
          {!!r.needs_review && <ReviewPill />}
          <AirTrailPill r={r} />
        </div>
        {transit ? (
          <div className="mt-1"><TransitLegChips legs={Array.isArray(meta.transit?.legs) ? meta.transit.legs : []} size="sm" t={t} /></div>
        ) : (
          <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 font-geist text-content-muted" style={fs(11.5)}>
            {sub && <span className="truncate">{sub}</span>}
            {extras.map(x => <span key={x} className="rounded-full bg-surface-tertiary px-2 py-px">{x}</span>)}
            {r.confirmation_number && (
              <span className="rounded-full bg-surface-tertiary px-2 py-px tabular-nums">
                <BlurredCode interactive={false}>{r.confirmation_number}</BlurredCode>{facts.legCodes.length > 1 ? ` +${facts.legCodes.length - 1}` : ''}
              </span>
            )}
            {costs.map(c => (
              <span key={c.currency} className="inline-flex items-center gap-1 rounded-full bg-surface-tertiary px-2 py-px tabular-nums">
                <Wallet size={10} strokeWidth={2} />{formatMoney(c.amount, c.currency, locale)}
              </span>
            ))}
            {files > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-surface-tertiary px-2 py-px"><Paperclip size={10} strokeWidth={2} />{files}</span>}
          </div>
        )}
      </div>
      <div className="text-right tabular-nums">
        <div className="font-geist text-content-faint" style={fs(11)}>{facts.day ? [facts.day.label, facts.day.date].filter(Boolean).join('  ') : t('reservations.undated')}</div>
        {facts.time && <div className="font-semibold text-content" style={fs(12.5, 'body')}>{facts.time}</div>}
      </div>
      <div className="flex items-center justify-end gap-1.5">
        <TravelerStack travelers={r.travelers || []} />
        {p.canEdit && <RoundAction label={t('common.edit')} onClick={() => p.onEdit(r)}><Pencil size={12} strokeWidth={2} /></RoundAction>}
        {p.canEdit && <RoundAction label={t('common.delete')} onClick={() => p.onDelete(r)} danger><Trash2 size={12} strokeWidth={2} /></RoundAction>}
      </div>
    </div>
  )
}
