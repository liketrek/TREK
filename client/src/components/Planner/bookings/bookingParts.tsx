import type { CSSProperties, ReactNode } from 'react'
import { AlertCircle, ChevronDown, ChevronUp, FileText, Plane } from 'lucide-react'
import type { Reservation, TripFile } from '../../../types'
import type { ReservationTraveler } from '@trek/shared'
import { useTranslation } from '../../../i18n'
import { avatarSrc } from '../../../utils/avatarSrc'
import GuestBadge from '../../shared/GuestBadge'
import { Tooltip } from '../../shared/Tooltip'
import { PILL } from '../../shared/DialogShell'
import { useToast } from '../../shared/Toast'
import { parseMeta, typeInfo } from './bookingsModel'
import type { BookingFacts } from './bookingFacts'
import { openAttachment } from './openAttachment'

// The phone's card language on the desktop: small Geist eyebrows, framed value
// boxes, count pills. Sizes scale with the user's text size setting.
export const fs = (px: number, tier: 'caption' | 'body' | 'subtitle' = 'caption'): CSSProperties => ({ fontSize: `calc(${px}px * var(--fs-scale-${tier}, 1))` })
export const EYEBROW = 'font-geist font-bold uppercase tracking-[.08em] text-content-faint'
export const BOX = 'rounded-[10px] border border-edge-faint bg-surface-card'

export type StatusTone = 'confirmed' | 'pending' | 'transit'

export function toneOf(r: Reservation): StatusTone {
  if (r.type === 'transit') return 'transit'
  return r.status === 'confirmed' ? 'confirmed' : 'pending'
}

const TONE_VAR: Record<StatusTone, string> = { confirmed: 'var(--success)', pending: 'var(--warning)', transit: 'var(--info)' }

/** The status colour, and the head band's tint derived from it. */
export const toneColor = (tone: StatusTone) => TONE_VAR[tone]
export const toneTint = (tone: StatusTone) => `color-mix(in srgb, ${TONE_VAR[tone]} 11%, transparent)`

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`${EYEBROW} ${className}`} style={fs(9.5)}>{children}</div>
}

/** An uppercase label over a framed value, the field every phone card is made of. */
export function Field({ label, children, className = '', tabular = false }: { label: string; children: ReactNode; className?: string; tabular?: boolean }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <Eyebrow className="mb-[3px]">{label}</Eyebrow>
      <div className={`${BOX} truncate px-[10px] py-[7px] text-center font-semibold text-content ${tabular ? 'tabular-nums' : ''}`} style={fs(12.5, 'body')}>
        {children}
      </div>
    </div>
  )
}

/** Content longer than a field (a route, notes, people, files) under its own label, like every field. */
export function Block({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <Eyebrow className="mb-[3px]">{label}</Eyebrow>
      {children}
    </div>
  )
}

/** When a booking is: its day or day range beside its time, the time under a range that needs the width. */
export function WhenFields({ facts }: { facts: BookingFacts }) {
  const { t } = useTranslation()
  if (!facts.day && !facts.time) return null
  return (
    <div className={`flex gap-2 ${facts.day?.range ? 'flex-col' : ''}`}>
      {facts.day && (
        <Field label={t('reservations.date')} className="flex-[1.4]">
          {facts.day.label}
          {facts.day.date && <span className="ms-1.5 font-medium text-content-faint">{facts.day.date}</span>}
        </Field>
      )}
      {facts.time && <Field label={t('reservations.time')} className="flex-1" tabular>{facts.time}</Field>}
    </div>
  )
}

/** The stops of a journey in one framed line, the type's icon between them. */
export function RouteBox({ type, facts }: { type: string; facts: BookingFacts }) {
  const { t } = useTranslation()
  if (facts.endpoints.length < 2) return null
  const info = typeInfo(type)
  return (
    <Block label={t('reservations.routeLabel')}>
      <div className={`${BOX} flex flex-wrap items-center justify-center gap-2 px-[10px] py-2 font-semibold text-content`} style={fs(12.5, 'body')}>
        {facts.endpoints.map((ep, i) => (
          <span key={ep.id ?? i} className="inline-flex min-w-0 items-center gap-2">
            {i > 0 && <info.Icon size={13} strokeWidth={2.2} className="flex-none" style={{ color: info.color }} />}
            <span className="truncate">{ep.name}</span>
          </span>
        ))}
      </div>
    </Block>
  )
}

export function CountPill({ children }: { children: ReactNode }) {
  return (
    <span className="whitespace-nowrap rounded-full bg-surface-tertiary px-2 py-[2px] font-geist font-bold text-content-muted" style={fs(10)}>
      {children}
    </span>
  )
}

/** A collapsible section head: the label, what the day is, the count, and the chevron on the right. */
export function SectionHead({ label, sub, count, open, onToggle }: { label: string; sub?: string; count: number; open: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} aria-expanded={open} className="mb-3 flex w-full items-center gap-2 px-0.5 text-start">
      <span className={EYEBROW} style={fs(11)}>{label}</span>
      {sub && <span className="truncate font-geist font-medium text-content-muted" style={fs(11.5)}>{sub}</span>}
      <CountPill>{count}</CountPill>
      {open
        ? <ChevronUp size={14} strokeWidth={2} className="ms-auto flex-none text-content-faint" />
        : <ChevronDown size={14} strokeWidth={2} className="ms-auto flex-none text-content-faint" />}
    </button>
  )
}

/**
 * The status dot. With the right to edit bookings it is a switch between
 * confirmed and pending, as on the phone; a transit journey has no status and
 * shows its dot in the info colour.
 */
export function StatusDot({ r, canToggle, onToggle, size = 8 }: { r: Reservation; canToggle: boolean; onToggle: () => void; size?: number }) {
  const { t } = useTranslation()
  const tone = toneOf(r)
  const dot = <span className="block flex-none rounded-full" style={{ width: size, height: size, background: toneColor(tone) }} />
  if (!canToggle || tone === 'transit') return <span className="grid h-[22px] w-[22px] flex-none place-items-center">{dot}</span>
  const next = tone === 'confirmed' ? t('reservations.pending') : t('reservations.confirmed')
  const label = t('reservations.status.switchTo', { status: next })
  return (
    <Tooltip label={label}>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onToggle() }}
        aria-label={label}
        className="grid h-[22px] w-[22px] flex-none place-items-center rounded-full hover:bg-surface-hover"
      >
        {dot}
      </button>
    </Tooltip>
  )
}

export function TypeChip({ type }: { type: string }) {
  const { t } = useTranslation()
  const info = typeInfo(type)
  return (
    <span className="inline-flex flex-none items-center gap-1 rounded-full border border-edge-faint bg-surface-card px-2 py-[2px] font-geist font-bold uppercase tracking-[.06em] text-content-muted" style={fs(9.5)}>
      <info.Icon size={11} strokeWidth={2.2} style={{ color: info.color }} />
      {t(info.chipKey)}
    </span>
  )
}

/** The square tile with the type's icon, used by rows and the detail pane. */
export function TypeTile({ type, size = 32, raised = false }: { type: string; size?: number; raised?: boolean }) {
  const info = typeInfo(type)
  return (
    <span className={`grid flex-none place-items-center ${raised ? 'rounded-[14px] bg-surface-card shadow-sm' : 'rounded-[10px] bg-surface-tertiary'}`} style={{ width: size, height: size }}>
      <info.Icon size={Math.round(size * 0.47)} strokeWidth={1.9} style={{ color: info.color }} />
    </span>
  )
}

/** The warning icon beside a booking's name on a card or row, or with `pill` a header pill in the detail dialog. */
export function ReviewPill({ pill = false }: { pill?: boolean }) {
  const { t } = useTranslation()
  return (
    <Tooltip label={t('reservations.needsReviewHint')}>
      {pill ? (
        <span className={PILL} style={fs(12, 'body')}>
          <AlertCircle size={13} strokeWidth={2.2} className="text-warning" />
          {t('reservations.needsReview')}
        </span>
      ) : (
        <span role="img" aria-label={t('reservations.needsReview')} className="grid flex-none place-items-center text-warning">
          <AlertCircle size={14} strokeWidth={2.2} />
        </span>
      )}
    </Tooltip>
  )
}

/**
 * The AirTrail link of a booking. A multi-leg import is detached from sync by
 * design (#1535), which is not the same as a flight removed upstream (#1646).
 */
export function AirTrailPill({ r, pill = false }: { r: Reservation; pill?: boolean }) {
  const { t } = useTranslation()
  if (r.external_source !== 'airtrail') return null
  const meta = parseMeta(r)
  const multiLeg = !r.sync_enabled && ((Array.isArray(meta.legs) && meta.legs.length > 1) || (r.endpoints || []).length > 2)
  const live = !!r.sync_enabled || multiLeg
  return (
    <Tooltip label={r.sync_enabled ? t('reservations.airtrail.syncedHint') : multiLeg ? t('reservations.airtrail.layoverHint') : t('reservations.airtrail.notSyncedHint')}>
      {pill ? (
        <span className={PILL} style={fs(12, 'body')}>
          <Plane size={13} strokeWidth={2.2} className={live ? 'text-info' : 'text-content-faint'} />
          {live ? t('reservations.airtrail.synced') : t('reservations.airtrail.notSynced')}
        </span>
      ) : (
        <span
          className={`inline-flex flex-none items-center gap-1 rounded-full px-2 py-[2px] font-geist font-bold uppercase tracking-[.03em] ${live ? 'bg-info-soft text-info' : 'bg-surface-tertiary text-content-faint'}`}
          style={fs(9)}
        >
          <Plane size={10} />
          {live ? t('reservations.airtrail.synced') : t('reservations.airtrail.notSynced')}
        </span>
      )}
    </Tooltip>
  )
}

/** A round 26 px action on a card head, quiet until the card is hovered or focused. */
export function RoundAction({ label, onClick, children, danger = false }: { label: string; onClick: () => void; children: ReactNode; danger?: boolean }) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onClick() }}
        aria-label={label}
        className={`grid h-[26px] w-[26px] flex-none place-items-center rounded-full bg-surface-card text-content-muted opacity-60 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 ${danger ? 'hover:text-danger' : 'hover:text-content'}`}
      >
        {children}
      </button>
    </Tooltip>
  )
}

/** Who a booking is for, as the phone shows them: avatar and name in a soft chip. */
export function TravelerChips({ travelers }: { travelers: ReservationTraveler[] }) {
  if (travelers.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {travelers.map(tv => {
        const src = tv.avatar_url || avatarSrc(tv.avatar)
        return (
          <span key={tv.user_id} className={`${BOX} flex items-center gap-1.5 rounded-full py-[3px] ps-[3px] pe-2.5`}>
            <span className="grid h-5 w-5 flex-none place-items-center overflow-hidden rounded-full bg-accent font-bold text-accent-text" style={fs(9)}>
              {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : tv.username?.[0]?.toUpperCase()}
            </span>
            <span className="truncate font-semibold text-content" style={fs(12, 'body')}>{tv.username}</span>
            {!!tv.is_guest && <GuestBadge size="xs" customTooltip />}
          </span>
        )
      })}
    </div>
  )
}

/** Stacked avatars for a dense row, named in the tooltip and for screen readers. */
export function TravelerStack({ travelers, max = 3 }: { travelers: ReservationTraveler[]; max?: number }) {
  if (travelers.length === 0) return null
  const names = travelers.map(tv => tv.username).join(', ')
  return (
    <Tooltip label={names}>
      <span className="flex items-center" aria-label={names}>
        {travelers.slice(0, max).map((tv, i) => {
          const src = tv.avatar_url || avatarSrc(tv.avatar)
          return (
            <span key={tv.user_id} className="grid h-[22px] w-[22px] flex-none place-items-center overflow-hidden rounded-full border-2 border-surface-card bg-accent font-bold text-accent-text" style={{ ...fs(9), marginInlineStart: i ? -7 : 0 }}>
              {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : tv.username?.[0]?.toUpperCase()}
            </span>
          )
        })}
        {travelers.length > max && <span className="ms-1 font-geist font-semibold text-content-faint" style={fs(10.5)}>+{travelers.length - max}</span>}
      </span>
    </Tooltip>
  )
}

/** Opens an attached file, and says so when it cannot. */
export function useOpenFile() {
  const { t } = useTranslation()
  const toast = useToast()
  return (f: TripFile) => openAttachment(f, () => toast.error(t('files.openError')))
}

/** The attached files, one framed row each, opening the file. */
export function FileRows({ files }: { files: TripFile[] }) {
  const open = useOpenFile()
  if (files.length === 0) return null
  return (
    <div className="flex flex-col gap-1">
      {files.map(f => (
        <button
          key={f.id}
          type="button"
          onClick={e => { e.stopPropagation(); open(f) }}
          className={`${BOX} flex items-center gap-1.5 px-[10px] py-[7px] text-start hover:bg-surface-hover`}
        >
          <FileText size={12} strokeWidth={2} className="flex-none text-content-muted" />
          <span className="truncate font-geist font-semibold text-content-muted" style={fs(11.5)}>{f.original_name}</span>
        </button>
      ))}
    </div>
  )
}
