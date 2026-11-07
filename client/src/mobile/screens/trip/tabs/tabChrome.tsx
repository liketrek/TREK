import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { ReservationTraveler } from '@trek/shared'
import { avatarSrc } from '../../../../utils/avatarSrc'
import GuestBadge from '../../../../components/shared/GuestBadge'
import PluginFrame from '../../../../components/Plugins/PluginFrame'
import { useReservationDetailPlugins } from '../../../../components/Planner/bookings/useReservationDetailPlugins'
import { useIsSplit } from '../../../../hooks/sizeClass'

/**
 * Scroll body shared by the list-style trip tabs (transports, bookings, costs,
 * lists, files). The shell paints the opaque z-30 overlay behind us and floats
 * the top controls (z-42) and the dock (z-40) on top; a panel fills the space
 * between them with the same clearance the browse overlay uses — the top clears
 * the floating controls, the bottom clears the dock via --bottom-nav-h. (Collab
 * lays out its own column so its composer can sit just above the dock.)
 */
export function TabScroller({ children, wide = 'readable' }: { children: ReactNode; wide?: 'readable' | 'full' }) {
  // On a wide window the list keeps a readable measure in the middle of the
  // page, as iPadOS lists do, while the scroller itself still spans the page so
  // a scroll anywhere on it moves the list. A grid (files) takes the page.
  return (
    <div className="flex h-full flex-col">
      <div
        className={`min-h-0 flex-1 overflow-x-hidden overflow-y-auto ${TAB_INSETS} ${
          wide === 'readable' ? 'wide:[&>*]:mx-auto wide:[&>*]:max-w-[760px]' : ''
        }`}
      >
        {children}
      </div>
    </div>
  )
}

/** The room a tab's scroll body keeps clear: the floating top controls above, the dock (or the home indicator) below. */
const TAB_INSETS = 'px-4 pb-[calc(var(--bottom-nav-h,84px)+22px)] pt-[calc(var(--m-safe-top,12px)+58px)] wide:px-6'
const PANE_INSETS = 'pb-[calc(var(--bottom-nav-h,84px)+22px)] pt-[calc(var(--m-safe-top,12px)+58px)]'

/**
 * The cards of a list tab (transports, bookings, tasks, polls): one column on a
 * phone; on a wide window as many columns of at least a phone's width as the
 * page holds, three on a 13" iPad on its side, two upright or on an unfolded
 * foldable on its side, one in a narrow Split View. The cards flow down the
 * columns, each keeping its own height, so the columns start level and no
 * short card ends above its neighbour in a ragged row or stretches into an
 * empty panel. In date order that reads down the first column, then the next.
 * The cards' own top margin gives way to an even gap under each card, so the
 * columns start on one line in every engine.
 */
export function CardGrid({ children }: { children: ReactNode }) {
  return (
    <div className="wide:columns-[340px] wide:gap-x-3 wide:pt-2 wide:[&>*]:mb-3 wide:[&>*]:mt-0 wide:[&>*]:break-inside-avoid">
      {children}
    </div>
  )
}

/**
 * A list tab in two panes once the window has room for them (split size
 * class), the iPad Mail and Settings arrangement: `aside` (a summary, the
 * filters) in a column of its own on the leading side, `children` (the list)
 * beside it, each scrolling on its own so the summary stays in view while the
 * list moves. On a foldable that reports its fold, the aside ends at the fold.
 * Narrower windows stack the two in one scroll body, the aside first, exactly
 * as the phone shows them.
 *
 * Both arrangements are one element tree with other classes, so a rotation
 * or a fold between them keeps what is typed or open in either pane, and the
 * reader keeps their place: the row at the top of the list stays at the top.
 */
export function TabPanes({ aside, asideLabel, children }: { aside: ReactNode; asideLabel: string; children: ReactNode }) {
  const split = useIsSplit()
  const body = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)
  // How far the list has moved under the top edge of its scroll body, read on
  // every scroll; 0 while its start is in view (or the summary above it,
  // stacked). Stacked, the list starts under the summary in the one scroll
  // body; split, it scrolls on its own. A change of arrangement puts it back.
  const into = useRef(0)
  useLayoutEffect(() => {
    const el = split ? list.current : body.current
    const top = list.current
    if (!el || !top || into.current <= 0) return
    el.scrollTop = split ? into.current : listStartIn(el, top) + into.current
  }, [split])
  const place = () => {
    const el = split ? list.current : body.current
    const top = list.current
    if (!el || !top) return
    into.current = split ? el.scrollTop : Math.max(0, el.scrollTop - listStartIn(el, top))
  }
  return (
    <div className={split ? 'flex h-full' : 'flex h-full flex-col'}>
      <div
        ref={body}
        onScroll={split ? undefined : place}
        className={
          split
            ? 'contents'
            : `min-h-0 flex-1 overflow-x-hidden overflow-y-auto ${TAB_INSETS} wide:[&>*]:mx-auto wide:[&>*]:max-w-[760px]`
        }
      >
        <div
          role={split ? 'complementary' : undefined}
          aria-label={split ? asideLabel : undefined}
          className={split ? `m-pane-aside min-h-0 flex-none overflow-y-auto overflow-x-hidden ps-6 pe-3 ${PANE_INSETS}` : undefined}
        >
          {aside}
        </div>
        <div
          ref={list}
          onScroll={split ? place : undefined}
          className={split ? `min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden pe-6 ps-3 ${PANE_INSETS}` : undefined}
        >
          <div className={split ? 'mx-auto max-w-[760px]' : undefined}>{children}</div>
        </div>
      </div>
    </div>
  )
}

/** Where the list starts in its scroll body's content, under the body's top padding. */
function listStartIn(el: HTMLElement, top: HTMLElement): number {
  const pad = parseFloat(getComputedStyle(el).paddingTop) || 0
  return top.getBoundingClientRect().top - el.getBoundingClientRect().top - pad + el.scrollTop
}

/** Small count badge next to a section label / settle row (spec 03 §1.1). */
export function CountPill({ children }: { children: ReactNode }) {
  return (
    <span className="whitespace-nowrap rounded-full bg-[color:var(--m-ic)] px-2 py-[2px] font-geist text-[0.59375rem] font-bold text-m-muted">
      {children}
    </span>
  )
}

/**
 * Collapsible group header (Confirmed / Pending / … ). Chevron flips up when the
 * section is open; the count pill is optional. Layout per spec 03 §1.1.
 */
export function SectionHeader({ label, count, open, onToggle }: {
  label: string
  count?: ReactNode
  open: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="mb-[2px] mt-[15px] flex w-full items-center gap-[7px] px-[2px] text-start"
    >
      <span className="font-geist text-[0.625rem] font-bold uppercase tracking-[.09em] text-m-faint">
        {label}
      </span>
      {count != null && <CountPill>{count}</CountPill>}
      {open ? (
        <ChevronUp size={13} strokeWidth={2} className="ms-auto flex-none text-m-faint" />
      ) : (
        <ChevronDown size={13} strokeWidth={2} className="ms-auto flex-none text-m-faint" />
      )}
    </button>
  )
}

/**
 * Uppercase label over a bordered value box — the field pattern used all over
 * the transport / booking cards (spec 03 §1.1). Width is set by the caller via
 * `className` (e.g. flex weights); `tabular` aligns times and prices.
 */
export function Field({ label, children, className = '', tabular = false }: {
  label: string
  children: ReactNode
  className?: string
  tabular?: boolean
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <div className="mb-[3px] font-geist text-[0.5625rem] font-bold uppercase tracking-[.08em] text-m-faint">
        {label}
      </div>
      <div
        className={`overflow-hidden text-ellipsis whitespace-nowrap rounded-[10px] border border-[color:var(--m-rowbr)] bg-m-card px-[10px] py-[7px] text-center text-[0.71875rem] font-semibold text-m-ink ${
          tabular ? 'tabular-nums' : ''
        }`}
      >
        {children}
      </div>
    </div>
  )
}

/**
 * Booking code with the optional shoulder-surfing blur (setting
 * blur_booking_codes). While the blur is on the box is a real button so the
 * reveal works by keyboard too; without it there is nothing to operate and it
 * stays a plain value box.
 */
export function ConfirmationCode({ code, label, blurred, onToggle }: {
  code: string
  label: string
  blurred: boolean
  onToggle?: () => void
}) {
  const boxCls = `block w-full overflow-hidden text-ellipsis whitespace-nowrap rounded-[10px] border border-[color:var(--m-rowbr)] bg-m-card px-[10px] py-[7px] text-center font-geist text-[0.71875rem] font-semibold tabular-nums text-m-ink ${
    blurred ? 'blur-[4px] select-none' : ''
  }`
  return (
    <div className="mt-2">
      <div className="mb-[3px] font-geist text-[0.5625rem] font-bold uppercase tracking-[.08em] text-m-faint">
        {label}
      </div>
      {onToggle
        ? <button type="button" onClick={onToggle} aria-pressed={!blurred} className={boxCls}>{code}</button>
        : <div className={boxCls}>{code}</div>}
    </div>
  )
}

/** 7px status dot; `color` is a --m-st-* token from STATUS_COLOR. */
export function StatusDot({ color }: { color: string }) {
  return <span className="h-[7px] w-[7px] flex-none rounded-full" style={{ background: color }} />
}

/**
 * Plugins that declared a reservation-detail slot, mounted at the foot of a
 * transport / booking card and scoped to that reservation: the phone half of
 * what ReservationsPanel does on the desktop, which the phone cards never had,
 * so a widget like Flight Tracker only appeared once the viewport crossed the
 * desktop breakpoint (#2440). Sits outside the card's body button (buttons
 * cannot nest, and a tap in the frame must not open the detail sheet), and the
 * frame follows the host colour scheme like the desktop detail slots do, so a
 * kit plugin that goes dark with TREK keeps compositing transparently.
 */
export function ReservationPluginSlots({ tripId, reservationId }: { tripId: number; reservationId: number }) {
  const plugins = useReservationDetailPlugins()
  if (plugins.length === 0) return null
  return (
    <div className="flex flex-col gap-2 px-3 pb-3">
      {plugins.map(p => (
        <div key={p.id} className="overflow-hidden rounded-[10px] border border-[color:var(--m-rowbr)] bg-m-card">
          <PluginFrame
            pluginId={p.id}
            tripId={String(tripId)}
            reservationId={String(reservationId)}
            title={p.name}
            surface="detail-slot"
          />
        </div>
      ))}
    </div>
  )
}

/**
 * Read-only avatar-chip cluster for a reservation's assigned travelers (#1517).
 * The mobile transport / booking cards only display them — assignment editing
 * lives in the reservation sheet, so there is no picker here. Reuses the shared
 * avatarSrc + GuestBadge like the cost member chips; renders nothing when nobody
 * is assigned. `label` comes from 'reservations.travelers.label'.
 */
export function TravelerAvatars({ travelers, label }: {
  travelers: ReservationTraveler[]
  label: string
}) {
  if (travelers.length === 0) return null
  return (
    <div className="mt-2">
      <div className="mb-[3px] font-geist text-[0.5625rem] font-bold uppercase tracking-[.08em] text-m-faint">
        {label}
      </div>
      <div className="flex flex-wrap items-center gap-[6px]">
        {travelers.map(tv => {
          const src = tv.avatar_url || avatarSrc(tv.avatar)
          return (
            <span
              key={tv.user_id}
              className="flex items-center gap-[6px] rounded-full border border-[color:var(--m-rowbr)] bg-m-card py-[3px] ps-[3px] pe-[10px]"
            >
              <span className="flex h-[20px] w-[20px] flex-none items-center justify-center overflow-hidden rounded-full bg-m-act text-[0.5625rem] font-extrabold text-m-actfg">
                {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : tv.username?.[0]?.toUpperCase()}
              </span>
              <span className="truncate text-[0.71875rem] font-semibold text-m-ink">{tv.username}</span>
              {!!tv.is_guest && <GuestBadge size="xs" />}
            </span>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Avatar toggle row to filter the list by assigned traveler (#1517/#1557).
 *
 * The avatars used to sit on their own between the toolbar and the first
 * section, which read as decoration rather than as a control: nothing said what
 * they were, and with a filter on there was no way back other than tapping the
 * same avatar again. It is a labelled bar now, closed off by the same divider
 * the rows below use, with an explicit way to clear the filter.
 *
 * Its horizontal padding follows SectionHeader rather than the sheet's usual 18,
 * so the label starts on the same line as the section titles right below it.
 */
export function TravelerFilterRow({ members, active, onToggle, onClear, label, allLabel }: {
  members: { id: number; username: string; avatar_url?: string | null }[]
  active: Set<number>
  onToggle: (id: number) => void
  onClear?: () => void
  label: string
  /** Resets the filter. Only rendered while one is active. */
  allLabel?: string
}) {
  const filtering = active.size > 0
  return (
    <div
      className="mb-[2px] flex items-center gap-[10px] border-b border-[color:var(--m-rowbr)] px-[2px] pb-[9px] pt-[2px]"
      role="group"
      aria-label={label}
    >
      <span className="flex-none font-geist text-[0.625rem] font-bold uppercase tracking-[.09em] text-m-faint">
        {label}
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {members.map(m => {
          const on = active.has(m.id)
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onToggle(m.id)}
              title={m.username}
              aria-pressed={on}
              className={`flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-[color:var(--m-ic)] text-[0.625rem] font-bold text-m-muted transition-opacity ${on ? 'border-[color:var(--m-act)]' : 'border-[color:var(--m-rowbr)]'} ${on || !filtering ? 'opacity-100' : 'opacity-40'}`}
            >
              {m.avatar_url
                ? <img src={m.avatar_url} className="h-full w-full object-cover" alt="" />
                : m.username?.[0]?.toUpperCase()}
            </button>
          )
        })}
      </div>
      {filtering && allLabel && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="flex-none rounded-full border border-[color:var(--m-rowbr)] px-[9px] py-[3px] font-geist text-[0.625rem] font-bold uppercase tracking-[.06em] text-m-muted"
        >
          {allLabel}
        </button>
      )}
    </div>
  )
}
