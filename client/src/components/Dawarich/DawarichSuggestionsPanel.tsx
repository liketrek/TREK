import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, MapPin, BookOpen, Check, X, RotateCcw, AlertTriangle, Clock, Hourglass, CalendarDays, Briefcase, Gauge, History, Unplug } from 'lucide-react'
import type { DawarichAccept, DawarichSuggestion, DawarichSuggestionTarget } from '@trek/shared'
import { useTranslation } from '../../i18n'
import { useDawarichSuggestions } from '../../hooks/useDawarichSuggestions'
import { useTripStore } from '../../store/tripStore'
import { useIsPhone } from '../../mobile/useIsPhone'
import { relativeTime } from '../../utils/relativeTime'
import { Tooltip } from '../shared/Tooltip'
import DawarichIcon from '../shared/DawarichIcon'
import Badge from './DawarichBadge'
import DawarichAcceptDialog, { type AcceptTargetOption } from './DawarichAcceptDialog'
import { formatDayHeading, formatDuration, groupByDay, timeRange } from './dawarichSuggestionModel'

/**
 * The panel sits inside the places rail, and it has to read at the same size as
 * the rows below it — `text-body` (14px) and `text-caption` (12px) made every
 * line of it a size larger than the trip's own places, which is the one thing a
 * panel about somebody else's data must not be.
 *
 * These are the rail's own figures (PlacesSidebarRow uses exactly 13 / 11 / 10),
 * kept as calc() against the per-tier multipliers so the appearance text-size
 * control still reaches them — a bare number would not.
 */
const TYPE = {
  name: { fontSize: 'calc(13px * var(--fs-scale-body, 1))' },
  meta: { fontSize: 'calc(11px * var(--fs-scale-caption, 1))' },
  micro: { fontSize: 'calc(10px * var(--fs-scale-caption, 1))' },
} as const

export interface DawarichSuggestionsPanelProps {
  /** Only stays that fall inside this trip. */
  tripId?: number
  /** Trips the user may write a place into. */
  trips?: AcceptTargetOption[]
  daysForTrip?: (tripId: number) => AcceptTargetOption[]
  /** Journeys the user may add an entry to. */
  journals?: AcceptTargetOption[]
  /** Called after something was written, so the host can refresh its own list. */
  onAccepted?: (suggestion: DawarichSuggestion) => void
  /** Start collapsed. The planner does; the journal does not. */
  initiallyCollapsed?: boolean
  /**
   * Drop the panel's own card and header.
   *
   * For a sheet that already carries both — the phone's journey opens this list
   * in one, and a second "From Dawarich" under the first is a stutter.
   */
  bare?: boolean
}

/**
 * The stays Dawarich recorded, waiting to be reviewed.
 *
 * One component for both shells. The phone and the desktop place it
 * differently, but the rows are the same rows, and a second copy of them is a
 * second thing to keep in step — the same reasoning as `TripRouteOverviewPanel`
 * next door, and the same reason SonarCloud's duplication budget exists.
 *
 * **Grouped by day, and coloured like the map.** A day of travel produces four
 * or five stays; repeating the full date on each of them buries the one thing
 * that tells them apart, which is the time. The day's dot carries the colour its
 * line is drawn in on the trip map, so "the purple day" means the same thing in
 * both places.
 *
 * The panel renders **nothing at all** when there is nothing to review. An
 * integration that is connected and quiet should be invisible, not a permanent
 * empty card explaining that it found nothing.
 */
export default function DawarichSuggestionsPanel({
  tripId,
  trips = [],
  daysForTrip,
  journals = [],
  onAccepted,
  initiallyCollapsed = false,
  bare = false,
}: DawarichSuggestionsPanelProps): React.ReactElement | null {
  const { t, locale } = useTranslation()
  const S = useDawarichSuggestions({ tripId })
  // The phone shell has its own palette (`--m-*`): a card in the desktop surface
  // tokens glares next to it. Same component, the shell's own colours.
  const phone = useIsPhone()
  const [collapsed, setCollapsed] = useState(initiallyCollapsed)
  const [showHandled, setShowHandled] = useState(false)
  const [pending, setPending] = useState<{ suggestion: DawarichSuggestion; target: DawarichSuggestionTarget } | null>(null)

  // Deleting the place an acceptance created is how somebody says "not that
  // one" after the fact: the server puts the stay back into review, and a
  // shrinking place count is what tells us to go and ask. Only a shrink — a
  // place being added is usually this panel's own doing.
  const placeCount = useTripStore(state => (tripId === undefined ? 0 : state.places.length))
  const lastPlaceCount = useRef(placeCount)
  const reload = S.reload
  useEffect(() => {
    const shrank = placeCount < lastPlaceCount.current
    lastPlaceCount.current = placeCount
    if (shrank) reload()
  }, [placeCount, reload])

  const open = useMemo(() => S.suggestions.filter(item => item.state === 'new'), [S.suggestions])
  const handled = useMemo(() => S.suggestions.filter(item => item.state !== 'new'), [S.suggestions])
  const openDays = useMemo(() => groupByDay(open), [open])

  // Nothing to review and nothing to report: stay out of the way entirely.
  if (S.status === 'idle') return null
  if (S.status === 'ready' && open.length === 0 && handled.length === 0) return null

  const confirm = async (body: DawarichAccept) => {
    if (!pending) return
    const ok = await S.accept(pending.suggestion.id, body)
    if (ok) {
      onAccepted?.(pending.suggestion)
      setPending(null)
    }
  }

  const rowProps = {
    phone,
    // Offered only where there is somewhere to put it: the planner has no
    // journey list, and a button that opens an empty picker is worse than none.
    allowJournal: journals.length > 0,
    allowPlace: trips.length > 0,
    // The trip name is noise when every row is from the same trip.
    showTrip: tripId === undefined,
  }

  return (
    <section
      className={
        bare
          ? ''
          : `rounded-2xl overflow-hidden ${phone ? 'bg-[color:var(--m-ic)]' : 'border border-edge bg-surface-secondary'}`
      }
    >
      {bare ? (
        <p className={`px-1 pb-2 ${phone ? 'text-m-muted' : 'text-content-muted'}`} style={TYPE.micro}>
          {statusLine(S, open.length, t, locale)}
        </p>
      ) : (
      <button
        type="button"
        onClick={() => setCollapsed(value => !value)}
        aria-expanded={!collapsed}
        className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left ${
          phone ? 'active:bg-[color:var(--m-inner)]' : 'hover:bg-surface-hover'
        }`}
      >
        {/* Rounded, like every other avatar-sized mark in TREK: the logo is a
            square badge and a hard corner beside a rounded card reads as a
            pasted-in image. */}
        <span className="flex-shrink-0 overflow-hidden rounded-[6px]">
          <DawarichIcon size={22} />
        </span>
        <span className="flex-1 min-w-0">
          <span className={`block truncate font-semibold leading-tight ${phone ? 'text-m-ink' : 'text-content'}`} style={TYPE.name}>
            {t('dawarich.suggestions.title')}
          </span>
          <span className={`block truncate ${phone ? 'text-m-muted' : 'text-content-muted'}`} style={TYPE.micro}>
            {statusLine(S, open.length, t, locale)}
          </span>
        </span>
        {open.length > 0 && (
          <span
            className={`flex-shrink-0 min-w-[18px] h-[18px] px-1.5 inline-flex items-center justify-center rounded-full font-bold ${
              phone ? 'bg-m-act text-m-actfg' : 'bg-accent text-accent-text'
            }`}
            style={TYPE.micro}
          >
            {open.length}
          </span>
        )}
        {collapsed
          ? <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${phone ? 'text-m-faint' : 'text-content-faint'}`} />
          : <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 ${phone ? 'text-m-faint' : 'text-content-faint'}`} />}
      </button>
      )}

      {(bare || !collapsed) && (
        <div className="border-t border-edge-secondary">
          {S.status !== 'ready' && (
            <p className={`px-3.5 py-2.5 ${S.status === 'unavailable' ? 'text-danger' : 'text-content-secondary'}`} style={TYPE.meta}>
              {statusLine(S, open.length, t, locale)}
            </p>
          )}

          {S.lastSyncError && S.status === 'ready' && (
            <p className="px-3.5 pt-2.5 text-danger" style={TYPE.meta}>{S.lastSyncError}</p>
          )}

          {open.length === 0 && S.status === 'ready' && (
            <p className={`px-3.5 py-2.5 ${phone ? 'text-m-muted' : 'text-content-muted'}`} style={TYPE.meta}>{t('dawarich.suggestions.allHandled')}</p>
          )}

          {openDays.map(day => (
            <div key={day.date}>
              <div className="flex items-center gap-2 px-3.5 pt-2.5 pb-1">
                {/* The colour this day's line is drawn in on the map. */}
                <span
                  aria-hidden="true"
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: day.color }}
                />
                <span className={`font-bold uppercase tracking-wider whitespace-nowrap ${phone ? 'text-m-muted' : 'text-content-muted'}`} style={TYPE.micro}>
                  {formatDayHeading(day.date, locale)}
                </span>
                <span className="flex-1 h-px bg-edge-faint" />
                <Badge tone="quiet">{day.stays.length}</Badge>
              </div>
              {day.stays.map(suggestion => (
                <SuggestionRow
                  key={suggestion.id}
                  suggestion={suggestion}
                  busy={S.busyId === suggestion.id}
                  {...rowProps}
                  onAccept={target => setPending({ suggestion, target })}
                  onDismiss={() => S.dismiss(suggestion.id)}
                />
              ))}
            </div>
          ))}

          {handled.length > 0 && (
            <div className="border-t border-edge-faint">
              <button
                type="button"
                onClick={() => setShowHandled(value => !value)}
                className={`w-full px-3.5 py-2 text-left ${
                  phone ? 'text-m-muted active:bg-[color:var(--m-inner)]' : 'text-content-muted hover:bg-surface-hover'
                }`}
                style={TYPE.meta}
              >
                {showHandled
                  ? t('dawarich.suggestions.hideHandled')
                  : t('dawarich.suggestions.showHandled', { count: handled.length })}
              </button>
              {showHandled &&
                handled.map(suggestion => (
                  <SuggestionRow
                    key={suggestion.id}
                    suggestion={suggestion}
                    busy={S.busyId === suggestion.id}
                    showTrip={rowProps.showTrip}
                    showDate
                    onRestore={suggestion.state === 'dismissed' ? () => S.restore(suggestion.id) : undefined}
                  />
                ))}
            </div>
          )}
        </div>
      )}

      <DawarichAcceptDialog
        suggestion={pending?.suggestion ?? null}
        target={pending?.target ?? 'journal'}
        trips={trips}
        daysForTrip={daysForTrip}
        journals={journals}
        busy={S.busyId !== null}
        onCancel={() => setPending(null)}
        onConfirm={confirm}
      />
    </section>
  )
}

/**
 * One stay: a name, when it was, and how to act on it.
 *
 * Two lines and no chip soup. The meta line carries only what varies — how long,
 * and the two things worth interrupting for: a wish this fulfils, and a
 * detection the source itself was unsure about. The "detected, unconfirmed"
 * label that used to sit on nearly every row is gone: since Dawarich 1.12.0
 * unconfirmed is the normal state of a visit, so saying it everywhere said
 * nothing. Reviewing it here *is* the confirmation.
 *
 * The actions fade in on hover on a pointer device and stay visible on touch,
 * where there is no hover to reveal them.
 */
function SuggestionRow({
  suggestion,
  busy,
  allowJournal = false,
  allowPlace = false,
  showTrip = false,
  showDate = false,
  phone = false,
  onAccept,
  onDismiss,
  onRestore,
}: {
  suggestion: DawarichSuggestion
  busy: boolean
  allowJournal?: boolean
  allowPlace?: boolean
  showTrip?: boolean
  showDate?: boolean
  /** Rendered inside the phone shell, which has its own palette and its own reach. */
  phone?: boolean
  onAccept?: (target: DawarichSuggestionTarget) => void
  onDismiss?: () => void
  onRestore?: () => void
}): React.ReactElement {
  const { t, locale } = useTranslation()

  return (
    <div className="flex items-stretch gap-[6px] px-3 py-[5px]">
      {/* A stay is a card with its actions clipped to the side — the shape an
          expense already has in Costs. One layout in both shells; only the
          palette differs, because the phone paints from `--m-*` and the desktop
          from the semantic tokens, and neither set exists outside its own. */}
      <div
        className={`flex min-w-0 flex-1 flex-col justify-center rounded-2xl border px-[11px] py-[9px] ${
          phone ? 'border-[color:var(--m-gbr)] bg-m-card' : 'border-edge bg-surface-card'
        }`}
      >
        {/* The name gets the line, and the one badge that is about the name
            itself rides with it: "Unsure" qualifies what this place is called,
            not how long somebody stayed, and two lines below the name it read as
            one more fact among the times. It never pushes the name out — the
            name truncates, the flag does not. */}
        <p className={`flex items-center gap-1.5 font-medium ${phone ? 'text-m-ink' : 'text-content'}`} style={TYPE.name}>
          <span className="truncate">{suggestion.name}</span>
          {/* The mark, never the word: the name is what the line is for, and
              "Unsure" beside it is a caption competing with a title. The tooltip
              and the accessible name still say it in full. */}
          {suggestion.confidenceBand === 'low' && (
            <Badge icon={Gauge} tone="warning" label={t('dawarich.badge.lowConfidence')} title={t('dawarich.confidence.low')} />
          )}
        </p>

        {/* One badge row, one badge shape, colour carrying the meaning: neutral
            for a fact, accent for a wish this fulfils, success for what was
            already taken, amber for the two things worth interrupting for.
            Nothing wraps — a row that reflows every time a name is long reads as
            a mess, so it stays one line and the badges that do not fit are cut
            off rather than pushed onto a second. */}
        {/* Wraps, and only here: each badge is a fixed-height pill whose own text
            never breaks, so a second line of them reads as a second line of
            badges rather than as a paragraph coming apart. Cutting them off
            instead would hide the wish a stay fulfils, which is the one thing in
            the row worth the space. */}
        <div className="mt-1 flex flex-wrap items-center gap-1">
          {/* Ordered by what a reader needs first, because the rail is narrow and
              the row does not wrap: how long, then what it would fulfil, then the
              flags. The flags are icon-only — the word costs half the row and the
              sentence under the badges says it properly anyway. */}
          {showDate && (
            <Badge icon={CalendarDays}>{formatDayHeading(suggestion.localDate, locale)}</Badge>
          )}
          <Badge icon={Clock}>{timeRange(suggestion.startedAt, suggestion.endedAt)}</Badge>
          <Badge icon={Hourglass}>{formatDuration(suggestion.durationMinutes, t)}</Badge>

          {suggestion.state === 'accepted' && (
            <Badge icon={Check} tone="success">
              {t('dawarich.suggestions.acceptedAs.' + (suggestion.target ?? 'journal'))}
            </Badge>
          )}
          {suggestion.state === 'dismissed' && (
            <Badge icon={X} tone="quiet">{t('dawarich.suggestions.dismissed')}</Badge>
          )}

          {showTrip && suggestion.tripTitle && (
            <Badge icon={Briefcase}>{suggestion.tripTitle}</Badge>
          )}

          {suggestion.sourceMissing && (
            <Badge icon={Unplug} tone="warning" label={t('dawarich.badge.sourceMissing')} />
          )}
          {!suggestion.sourceMissing && suggestion.sourceChanged && (
            <Badge icon={History} tone="warning" label={t('dawarich.badge.sourceChanged')} />
          )}
        </div>

        {/* The long form of the two warnings, under the badges: the badge is the
            flag, this is what it means, and somebody reading the panel for the
            first time should not have to hover to find out. */}
        {(suggestion.sourceChanged || suggestion.sourceMissing) && (
          <p className={`mt-1 flex items-start gap-1.5 ${phone ? 'text-m-muted' : 'text-content-muted'}`} style={TYPE.meta}>
            <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-px text-warning" />
            {suggestion.sourceMissing
              ? t('dawarich.suggestions.sourceMissing')
              : t('dawarich.suggestions.sourceChanged')}
          </p>
        )}
      </div>

      {/* Always on screen. Hiding them until hover made the only two things a row
          is for invisible to anyone who had not discovered that hovering did
          something — and on a touch screen there is no hover at all.

          A column beside the text in the desktop rail, which is narrow and tall;
          a row on a phone, where there is width to spare and a stack of small
          squares reads as a scrollbar. Centred either way, against the name and
          the time it belongs to. */}
      {onAccept && (
        <div className={ACTIONS(phone)}>
          {allowJournal && (
            <RowAction
              label={t('dawarich.suggestions.asJournal')}
              icon={<BookOpen className="w-3.5 h-3.5" />}
              disabled={busy}
              phone={phone}
              onClick={() => onAccept('journal')}
            />
          )}
          {allowPlace && (
            <RowAction
              label={t('dawarich.suggestions.asPlace')}
              icon={<MapPin className="w-3.5 h-3.5" />}
              disabled={busy}
              phone={phone}
              onClick={() => onAccept('place')}
            />
          )}
          {onDismiss && (
            <RowAction
              label={t('dawarich.suggestions.dismiss')}
              icon={<X className="w-3.5 h-3.5" />}
              disabled={busy}
              phone={phone}
              onClick={onDismiss}
            />
          )}
        </div>
      )}

      {onRestore && (
        <div className={ACTIONS(phone)}>
          <RowAction
            label={t('dawarich.suggestions.restore')}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            disabled={busy}
            phone={phone}
            onClick={onRestore}
          />
        </div>
      )}
    </div>
  )
}

/**
 * Where a row keeps its actions: a pill clipped to the side of the card, the
 * same in both shells, painted from whichever palette the shell has.
 */
const ACTIONS = (phone: boolean): string =>
  'flex flex-none flex-col gap-1 rounded-full border p-[5px] ' +
  (phone ? 'border-[color:var(--m-gbr)] bg-[color:var(--m-glass)]' : 'border-edge bg-surface')

/**
 * One action on a row: a real target with a real accessible name.
 *
 * A square with a border rather than a bare glyph, because a bare glyph on a
 * white rail reads as decoration; this reads as a button, which is what it is.
 * The label is a tooltip and the accessible name — spelling it out beside the
 * icon would cost the row the width its name needs.
 *
 * All of them look the same. Marking one as the primary action would be TREK
 * deciding for the reader which of "put it on the map" and "write about it" they
 * meant, and the whole review step exists because that is theirs to decide.
 *
 * Hover fills the square with the inverse surface — near-black in the light
 * scheme, near-white in the dark one — so the button somebody is about to press
 * is unmistakable without inventing a colour the theme does not have.
 */
function RowAction({
  label,
  icon,
  disabled,
  phone = false,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  disabled?: boolean
  phone?: boolean
  onClick: () => void
}): React.ReactElement {
  const button = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full transition-all disabled:opacity-40 ${
        phone
          ? 'text-m-muted active:scale-95'
          : 'text-content-secondary hover:bg-inverse hover:text-inverse-text'
      }`}
    >
      {icon}
    </button>
  )
  // No tooltip on a phone: there is no hover to open it with, and the label is
  // already the button's accessible name.
  return phone ? button : <Tooltip label={label} placement="left">{button}</Tooltip>
}

/**
 * Where the data came from and how fresh it is, in one line under the title.
 *
 * Relative rather than a stamp: "checked 2 minutes ago" answers the question
 * somebody actually has, and "9/12/2026, 6:40:19 PM" makes them do the
 * subtraction themselves — on two lines, seconds included.
 */
function statusLine(
  state: ReturnType<typeof useDawarichSuggestions>,
  openCount: number,
  t: (key: string, params?: Record<string, unknown>) => string,
  locale: string,
): string {
  if (state.status === 'loading') return t('dawarich.suggestions.loading')
  if (state.status === 'disconnected') return t('dawarich.suggestions.notConnected')
  if (state.status === 'offline') return t('dawarich.trail.offline')
  if (state.status === 'unavailable') return t('dawarich.suggestions.unavailable')

  // Just the freshness. The count sits in the badge beside this line, and
  // gluing the two together with a separator said the same thing twice.
  return state.lastSyncAt
    ? t('dawarich.checkedAgo', { ago: relativeTime(Date.parse(state.lastSyncAt), locale) })
    : t('dawarich.neverSynced')
}
