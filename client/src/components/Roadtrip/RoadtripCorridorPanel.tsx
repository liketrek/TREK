import GoogleRouteImport from './GoogleRouteImport'
import React, { useMemo, useState } from 'react'
import {
  Search, Plus, RotateCw, AlertTriangle, X, BedDouble, MapPin, ChevronDown,
} from 'lucide-react'
import { useTranslation } from '../../i18n/TranslationContext'
import { Tooltip } from '../shared/Tooltip'
import EmptyState from '../shared/EmptyState'
import { useElementSize } from '../../hooks/useElementSize'
import { useSettingsStore } from '../../store/settingsStore'
import { formatDistance } from '../../utils/units'
import CustomSelect from '../shared/CustomSelect'
import RoadtripCategoryPicker from './RoadtripCategoryPicker'
import { serviceColor } from './roadtripModel'
import { CORRIDOR_CATEGORY_BY_KEY } from './stopKinds'
import { FS } from './typeScale'
import { CORRIDOR_CATEGORY_KEYS, CORRIDOR_SECTION_KM, CORRIDOR_WIDTHS_KM, type RoadtripCorridor } from './useRoadtripCorridor'
import type { CorridorPoi } from './useCorridorPois'
import type { RoadtripRoutes } from './useRoadtripRoutes'

interface RoadtripCorridorPanelProps {
  tripId?: number
  canImport?: boolean
  corridor: RoadtripCorridor
  routes: RoadtripRoutes
  /** Opens the place form prefilled from a POI, on a day and at a position in it. */
  onAddPoi?: (
    poi: { lat: number; lng: number; name: string; address: string | null; website: string | null; phone: string | null; osm_id: string },
    dayId?: number | null,
    position?: number | null,
  ) => void
  /**
   * Brings a hit into view on the map. A row is where you decide a place is worth
   * looking at, and looking at it means seeing which side of the road it is on.
   */
  onFocusPoint?: (lat: number, lng: number) => void
  /**
   * Opens the place form for a stop the search never found. Given only to somebody who
   * may add places, which is what keeps the button off a reader's panel.
   */
  onAddManual?: () => void
}

/**
 * How each socket family is written on the plug.
 *
 * Not translated and not derived from the tag: these are proper nouns with an accepted
 * spelling, and "Type 2" as a lowercase tag key is not what anybody looks for on a
 * charger. Anything not listed falls through to the raw key rather than being hidden,
 * because an unknown socket is still worth seeing.
 */
/** The steps worth offering: a household socket, a fast AC post, and the two DC tiers. */
const KW_STEPS = [11, 22, 50, 150]

/**
 * Below this the panel is cramped and stops spending width on words, in pixels.
 *
 * Measured from what the tightest row needs rather than picked round. The two actions at
 * the foot of the search card sit inside two levels of padding, which leaves each of them
 * about ninety pixels for a fifteen pixel icon, a gap and a word: "Search" and the
 * shortest sensible word beside it fit that, and a hair under it the first thing to go is
 * the end of the longer word. The panel's own heading goes at the same point, for the
 * same reason and to the same end: what it says is already the name of the column, and
 * the room it takes is the room the day picker beside it wants.
 */
const NARROW_PANEL_PX = 260

const SOCKET_LABEL: Record<string, string> = {
  type2: 'Type 2',
  type2_combo: 'CCS',
  type2_cable: 'Type 2 cable',
  ccs: 'CCS',
  chademo: 'CHAdeMO',
  type1: 'Type 1',
  type1_combo: 'CCS1',
  schuko: 'Schuko',
  tesla_supercharger: 'Supercharger',
  tesla_destination: 'Tesla Destination',
}

/** Label and icon per category, from the one table every road-trip surface reads. */
const CATEGORY_META = CORRIDOR_CATEGORY_BY_KEY

/** The small capitalised word over a group of controls, matching the rail's own captions. */
const EYEBROW = 'font-geist font-semibold uppercase tracking-[0.15em] text-content-faint'

/** A card in this column: the same corner, hairline and surface the rail's cards use. */
const CARD = 'rounded-2xl border border-edge-faint bg-surface-card'

/**
 * The tile in front of a result, in its category's own colour.
 *
 * Never the brand's logo. A corridor is mostly chains, and putting their marks here made
 * a list of petrol stations read as an advertisement — while the ones with no logo on
 * file fell back to a different picture entirely, so no two rows looked alike. The
 * category's icon in its own tint is the same thing the rail draws on its dashed line and
 * the map draws on the route, which is what makes a row, a pin and a stop recognisably
 * one place.
 */
function ResultBadge({ category }: { category: string }): React.ReactElement {
  const Icon = CATEGORY_META[category]?.Icon ?? MapPin
  const color = serviceColor(category)
  return (
    <span
      className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[10px]"
      // theme-lint-disable — the road-signage palette in `roadtripModel`, the same colour
      // this kind of stop carries in the rail and on the map.
      style={{ background: `${color}1f`, color }}
    >
      <Icon size={14} strokeWidth={1.9} aria-hidden />
    </span>
  )
}

/**
 * One fact about a hit, on its own surface.
 *
 * `bg-surface-secondary` rather than a literal: the row lifts to `surface-hover` under the
 * pointer, and a chip painted white would stop lifting with it in the dark scheme.
 */
const POI_CHIP = 'inline-flex items-center rounded-md bg-surface-secondary px-1.5 py-0.5 leading-none tabular-nums text-content-muted'

function ResultRow({ poi, onAdd, onFocus }: { poi: CorridorPoi; onAdd?: () => void; onFocus?: () => void }): React.ReactElement {
  const { t } = useTranslation()
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)
  /**
   * The badge and the text are one target, the Add button beside them another.
   *
   * Not the row itself and not a button around the lot: an Add button inside a row
   * button is markup neither a browser nor a screen reader can make sense of, and the
   * `<li>` has to stay one for the list around it to still be a list. Same shape
   * `AutomaticDayStop` uses: an element that is a button only when there is somewhere
   * for it to go, so a row without the map behind it is not a dead control.
   */
  const Block = onFocus ? 'button' : 'div'
  return (
    <li className="group flex items-center gap-3 rounded-xl py-1.5 pe-1.5 ps-1 transition-colors hover:bg-surface-hover">
      <Block
        type={onFocus ? 'button' : undefined}
        onClick={onFocus}
        // The hover surface stays the whole row: this only carries the focus ring, so
        // a keyboard lands on the same thing the pointer highlights.
        className={`flex min-w-0 flex-1 items-center gap-3 text-start ${onFocus ? 'rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent' : ''}`}
      >
        <ResultBadge category={poi.category} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold tracking-[-0.012em] text-content" style={{ fontSize: FS.name }}>
            {poi.name}
          </div>
          {poi.pluginId && <p className="truncate text-caption text-content-muted">{poi.pluginId}</p>}
          {/* Two facts, two chips. Where it is off the road and how far into the drive it
              comes are separate answers, and as two phrases sharing a line they read as one
              run-on sentence about the same thing. A chip each gives them an edge, and the
              row still wraps cleanly at a narrow width because nothing has to break around
              a separator. */}
          <div className="flex flex-wrap items-center gap-1" style={{ fontSize: FS.meta }}>
            <span className={POI_CHIP}>
              {t('roadtrip.poi.offRoute', { distance: formatDistance(poi.offRouteKm, distanceUnit) })}
            </span>
            <span className={POI_CHIP}>
              {poi.alongKm < 0.5
                ? t('roadtrip.poi.atStart')
                : t('roadtrip.poi.alongRoute', { distance: formatDistance(poi.alongKm, distanceUnit) })}
            </span>
            {/* What the charger offers, where OSM says. Socket names are proper nouns and
                stay as they are; the numbers around them are what decides whether a car can
                use it at all. A station that says nothing shows nothing rather than a row
                of dashes, because "not stated" is not "no". */}
            {poi.charging?.sockets.length ? (
              <span className="flex flex-wrap items-baseline gap-x-1.5">
                {poi.charging.sockets.slice(0, 3).map(s => (
                  <span key={s.type} className="text-content-muted">
                    {SOCKET_LABEL[s.type] ?? s.type}
                    {s.kw ? ` ${s.kw} kW` : ''}
                    {s.count && s.count > 1 ? ` ×${s.count}` : ''}
                  </span>
                ))}
              </span>
            ) : null}
            {poi.charging?.fee === false ? (
              <span className="text-success">{t('roadtrip.poi.free')}</span>
            ) : null}
          </div>
        </div>
      </Block>
      {/* Always there, quiet until the row is under the pointer: a button that only
          exists on hover is one a keyboard user has to find by faith. */}
      {onAdd ? (() => {
        // One button, two meanings. Somewhere to sleep ends the day rather than
        // interrupting the drive, so the icon and the label say that before the dialog
        // opens instead of after.
        const night = poi.category === 'hotel'
        const label = night ? t('roadtrip.stay.nightAction') : t('roadtrip.poi.add')
        const Icon = night ? BedDouble : Plus
        return (
          <Tooltip label={label}>
            <button
              type="button"
              onClick={onAdd}
              aria-label={label}
              className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-lg text-content-faint transition-colors hover:bg-accent hover:text-accent-text focus-visible:bg-accent focus-visible:text-accent-text focus-visible:outline-none"
            >
              <Icon size={15} strokeWidth={2.2} aria-hidden />
            </button>
          </Tooltip>
        )
      })() : null}
    </li>
  )
}

/** One category's hits, so a mixed search reads as several short lists instead of one long one. */
function ResultGroup({ category, pois, dayId, insertIndexFor, onAddPoi, onFocusPoint }: {
  category: string
  pois: CorridorPoi[]
  dayId: number | null
  insertIndexFor: RoadtripCorridor['insertIndexFor']
  onAddPoi: RoadtripCorridorPanelProps['onAddPoi']
  onFocusPoint: RoadtripCorridorPanelProps['onFocusPoint']
}): React.ReactElement {
  const { t } = useTranslation()
  const meta = CATEGORY_META[category]
  const Icon = meta?.Icon ?? MapPin
  const color = serviceColor(category)
  /**
   * Folded away, per category.
   *
   * A search for fuel AND food comes back as two lists that push each other off the
   * screen, and the one being read is never the one at the top. Local state on purpose:
   * which group somebody has open right now is a way of looking, not a setting — it
   * should not outlive the search that produced these groups.
   */
  const [open, setOpen] = useState(true)
  const label = meta ? t(meta.labelKey) : category
  return (
    // The gap between two groups belongs to the section, not to the strip: as padding on
    // the strip it became part of the hover surface, which then hung well above the row
    // it highlights.
    <section className="pb-1 pt-1.5 first:pt-0">
      {/* The whole strip is the control, not a chevron at its end: it is what the eye is
          on when it decides this is not the list it wants, and at this width a 12px
          target in the corner is a miss waiting to happen. */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="group/cat flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-start transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
      >
        <span
          className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-[7px]"
          // theme-lint-disable — see ResultBadge.
          style={{ background: color, color: '#fff' }} // theme-lint-disable — road-signage palette
        >
          <Icon size={12} strokeWidth={2} aria-hidden />
        </span>
        <span className="font-semibold tracking-[-0.01em] text-content" style={{ fontSize: FS.name }}>
          {label}
        </span>
        <span className={`ms-auto ${EYEBROW} tabular-nums`} style={{ fontSize: FS.micro }}>
          {t('roadtrip.poi.found', { count: pois.length })}
        </span>
        {/* Quiet until the strip is under the pointer, then it says which way this goes.
            A chevron that is always at full contrast reads as a fourth piece of data in a
            header that already carries three. */}
        <ChevronDown
          size={13}
          className={`shrink-0 text-content-faint transition-all group-hover/cat:text-content ${open ? '' : '-rotate-90'}`}
          aria-hidden
        />
      </button>
      <ul hidden={!open}>
        {pois.map(poi => (
          <ResultRow
            key={poi.osm_id}
            poi={poi}
            // Added where it will be driven past, not at the end of the day.
            onAdd={onAddPoi ? () => onAddPoi(poi, dayId, insertIndexFor(poi)) : undefined}
            onFocus={onFocusPoint ? () => onFocusPoint(poi.lat, poi.lng) : undefined}
          />
        ))}
      </ul>
    </section>
  )
}

/**
 * "What is on the way" — the right column while road trip mode is on.
 *
 * Searching is a button, not a side effect of panning: one run is several Overpass
 * requests and the mirrors are shared infrastructure. The scope is one day's drive, which
 * keeps a run to a handful of boxes and makes "add this" unambiguous — the stop lands on
 * the day whose route it was found along. Hits are drawn on the map at the same time, so
 * the list answers "which of these" and the map answers "which side of the road".
 *
 * Three cards down one column, the same shapes the rail opposite uses: what to look for,
 * how the search is getting on, and what it found. The day it searches sits in the
 * header rather than among the filters — it is the question's subject, not one of its
 * conditions.
 */
export default function RoadtripCorridorPanel({
  corridor, routes, onAddPoi, onFocusPoint, onAddManual, tripId, canImport,
}: RoadtripCorridorPanelProps): React.ReactElement {
  const { t } = useTranslation()
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)
  const { search } = corridor
  /**
   * The column itself, measured, because it is resizable.
   *
   * A media query would ask about the window, which is the wrong question: this panel
   * can be narrow on a wide screen, so what it may spend on words depends on what it
   * actually got. One measurement rather than one per row, so the heading and the two
   * actions give way at the same width instead of at two widths a few pixels apart.
   * Zero means it has not been measured yet, and that reads as roomy rather than
   * cramped so nothing flashes away on the first paint.
   */
  const panel = useElementSize<HTMLDivElement>()
  const narrow = panel.width > 0 && panel.width < NARROW_PANEL_PX

  const dayOptions = routes.days.map(d => ({
    value: String(d.dayId),
    label: t('roadtrip.day', { number: d.dayNumber }),
  }))

  const grouped = CORRIDOR_CATEGORY_KEYS
    .map(key => ({ key, pois: corridor.visible.filter(p => p.category === key) }))
    .filter(g => g.pois.length > 0)

  // Something was found, the filter just hides it — a different state from "not searched
  // yet" and from "the drive really has none of these".
  /**
   * The socket families this search actually turned up, in the order the table lists
   * them. Offering all ten would put CHAdeMO in the dropdown for a corridor that has
   * three Type 2 posts on it, which is a filter that can only produce an empty list.
   */
  const socketsFound = useMemo(() => {
    const seen = new Set<string>()
    for (const p of search.results) for (const s of p.charging?.sockets ?? []) seen.add(s.type)
    // Compared explicitly: the default sort is by UTF-16 code unit, which is not the
    // order anybody reads a list of plug names in.
    return [...seen].sort((a, b) => a.localeCompare(b))
  }, [search.results])
  const hasCharging = socketsFound.length > 0

  const filteredToNothing = search.results.length > 0 && corridor.visible.length === 0

  // The day has to have routed. Until it does, the corridor is built from the
  // straight line between the stops, so the boxes march across whatever lies
  // between them rather than along the roads actually driven — and when the
  // routing answer lands a second later the line changes, which clears the
  // search mid-flight and drops every result with no error and no explanation.
  // The routing runs one day at a time, about a second apart, so on a long trip
  // that window is wide open for the day somebody picks.
  const dayRouted = (corridor.day?.geometry.length ?? 0) > 1
  const canSearch = !search.loading
    && !routes.loading
    && dayRouted
    && corridor.categories.length > 0
    && (corridor.day?.stops.length ?? 0) > 1
  const progressPct = search.progress.total
    ? Math.round((search.progress.done / search.progress.total) * 100)
    : 0

  const warnings: [string, string][] = []
  if (search.failedSources?.length) warnings.push(['sources', `${t('common.error')}: ${search.failedSources.join(', ')}`])
  if (search.capped) warnings.push(['capped', t('roadtrip.poi.capped')])
  if (search.error) warnings.push(['failed', t('roadtrip.poi.failed')])
  // Some boxes answered and some did not. Saying so is the difference between "there is
  // no fuel on this stretch" and "nobody looked at this stretch".
  else if (search.failedAreas > 0) warnings.push(['partial', t('roadtrip.poi.partial', { count: search.failedAreas })])
  // A stretch that answered short is deliberately NOT reported. It fired on almost every
  // search of a long day — the ceiling is per box and a busy corridor reaches it easily —
  // so it read as a permanent complaint about a search that had in fact worked, and the
  // advice it gave ("narrow the corridor") makes the answer smaller rather than better.
  // The two warnings that remain are about a search that did not happen.

  return (
    <div ref={panel.ref} className="flex h-full min-h-0 flex-col gap-3 px-3.5 pb-3.5 pt-3">
      {/* Header: the panel's name, and the day the question is about.

          Pulled at, the name is the first thing to go. It repeats what the column
          already is, the day picker beside it is the part somebody came here to change,
          and a heading that shortens to an ellipsis says less than no heading at all. */}
      <div className="flex flex-shrink-0 items-center gap-2.5 px-1">
        {narrow ? null : (
          <h2 className="min-w-0 truncate font-semibold tracking-[-0.022em] text-content" style={{ fontSize: FS.panelTitle }}>
            {t('roadtrip.poi.title')}
          </h2>
        )}
        {dayOptions.length > 1 ? (
          <div className="ms-auto min-w-0">
            <CustomSelect
              value={corridor.dayId}
              onChange={value => corridor.setDayId(String(value))}
              options={dayOptions}
              size="sm"
            />
          </div>
        ) : null}
        {tripId !== undefined && tripId > 0 && canImport && <GoogleRouteImport tripId={tripId} dayId={corridor.day?.dayId} />}
      </div>

      {/* What to look for. */}
      <div className={`flex flex-shrink-0 flex-col gap-3.5 ${CARD} px-4 pb-3.5 pt-3.5`}>
        <div className="flex flex-col gap-2">
          <span className={EYEBROW} style={{ fontSize: FS.label }}>{t('roadtrip.poi.looking')}</span>
          <RoadtripCategoryPicker
            keys={CORRIDOR_CATEGORY_KEYS}
            meta={CATEGORY_META}
            selected={corridor.categories}
            onToggle={corridor.toggleCategory}
          />
        </div>

        <span className="h-px bg-edge-faint" aria-hidden />

        <div className="flex flex-col gap-2">
          <span className={EYEBROW} style={{ fontSize: FS.label }}>{t('roadtrip.poi.within')}</span>
          <div className="flex gap-1 rounded-xl bg-surface-tertiary p-1">
            {CORRIDOR_WIDTHS_KM.map(km => (
              <button
                key={km}
                type="button"
                aria-pressed={corridor.widthKm === km}
                onClick={() => corridor.setWidthKm(km)}
                style={{ fontSize: FS.control }}
                className={`flex h-[26px] flex-1 items-center justify-center rounded-lg tabular-nums transition-colors ${
                  corridor.widthKm === km
                    ? 'bg-surface-card font-semibold text-content shadow-card'
                    : 'font-medium text-content-muted hover:bg-surface-hover hover:text-content'
                }`}
              >
                {formatDistance(km, distanceUnit)}
              </button>
            ))}
          </div>
        </div>

        {/* One word each, so both can be read at the size an action deserves. The panel
            they sit in is headed "along the route" and every control above them narrows
            the same search; repeating that on a button only made it small.

            Their height is the controls' height, not a size of their own. At 38px the
            search stood a head above the segmented rows it follows and read as a second
            panel rather than as the end of this one.

            Two halves of one row, because the search finds most of what is out there and
            not all of it: a good share of the chargers standing at a junction are in
            nobody's OpenStreetMap extract. The second button is the way to those, and it
            sits beside the search rather than under it so neither is the afterthought.

            Below `ICON_ONLY_BELOW_PX` the two drop their labels rather than shortening
            them. A truncated word is worse than no word: "Add manu…" is neither the
            label nor a shape you recognise, while the plus and the magnifier are both
            read at a glance and keep their full names for a pointer and a reader. */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={search.search}
            disabled={!canSearch}
            aria-label={t('roadtrip.poi.search')}
            title={narrow ? t('roadtrip.poi.search') : undefined}
            className="flex h-[32px] min-w-0 flex-1 items-center justify-center gap-2 rounded-lg bg-accent text-body font-semibold text-accent-text transition-opacity disabled:opacity-50"
          >
            {search.loading
              ? <RotateCw size={15} className="shrink-0 animate-spin" aria-hidden />
              : <Search size={15} strokeWidth={2} className="shrink-0" aria-hidden />}
            {/* The word stays put while a run is on, and the spinner in front of it says
                the run is on. It used to become "Searching 3 of 12", which is both the
                longest label in the panel and the very sentence the progress row right
                underneath prints, next to the share as a figure. */}
            {narrow ? null : <span className="min-w-0 truncate">{t('roadtrip.poi.search')}</span>}
          </button>
          {/* The day is part of the offer: with no drive on the trip at all there is
              nowhere for a stop to go, and a dialog that can only be cancelled is worse
              than a button that waited. */}
          {onAddPoi && onAddManual && corridor.day ? (
            <button
              type="button"
              onClick={onAddManual}
              // The full sentence is the accessible name and the tooltip; the face of
              // the button carries the one word that fits beside "Search".
              aria-label={t('roadtrip.poi.addManual')}
              title={t('roadtrip.poi.addManual')}
              className="flex h-[32px] min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-edge bg-surface-card text-body font-semibold text-content transition-colors hover:bg-surface-hover"
            >
              <Plus size={15} strokeWidth={2.2} className="shrink-0" aria-hidden />
              {narrow ? null : <span className="min-w-0 truncate">{t('roadtrip.poi.addManualShort')}</span>}
            </button>
          ) : null}
        </div>
      </div>

      {/* How the run is getting on — a row of its own while it lasts, with the share
          done as a figure rather than only as a bar: a corridor search is many requests
          and "58%" answers "is this worth waiting for" that a bar only hints at. */}
      {search.loading ? (
        <div
          className="flex h-[32px] flex-shrink-0 items-center gap-2 rounded-xl border border-edge bg-surface-card pe-1.5 ps-3 text-content-muted"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <RotateCw size={13} className="animate-spin" aria-hidden />
          <span className="min-w-0 truncate font-medium" style={{ fontSize: FS.control }}>
            {t('roadtrip.poi.searching', { done: search.progress.done, total: search.progress.total })}
          </span>
          <span
            className="ms-auto inline-flex h-[22px] shrink-0 items-center rounded-full bg-inverse px-2 font-geist font-semibold tabular-nums tracking-[0.08em] text-inverse-text"
            style={{ fontSize: FS.micro }}
          >
            {`${progressPct}%`}
          </span>
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div className="flex flex-shrink-0 flex-col gap-1.5">
          {warnings.map(([key, text]) => (
            <p
              key={key}
              className={`flex items-start gap-1.5 ${key === 'failed' ? 'text-danger' : 'text-warning'}`}
              style={{ fontSize: FS.meta }}
            >
              <AlertTriangle size={12} className="mt-px shrink-0" aria-hidden />
              {text}
            </p>
          ))}
        </div>
      ) : null}

      {/* What was found. */}
      <div className={`flex min-h-0 flex-1 flex-col overflow-hidden ${CARD}`}>
        {/* Narrowing what was found. Deliberately not called "search": the button above
            asks the place search for new results, this only hides rows already in. It
            appears once there is something to narrow. */}
        {search.results.length > 0 ? (
          <div className="flex-shrink-0 border-b border-edge-faint p-3">
            {/* What was found, and the way back out of it. A search that turned up the
                wrong thing left its hits here and its pins on the map with no way to
                dismiss them: the only way out was switching to the day plan and back.
                Here rather than beside the search button, because throwing an answer
                away is only ever meaningful once there is one. */}
            <div className="mb-2 flex items-center gap-2">
              <span className={EYEBROW} style={{ fontSize: FS.label }}>
                {t('roadtrip.poi.found', { count: search.results.length })}
              </span>
              <button
                type="button"
                onClick={corridor.clear}
                className="ms-auto inline-flex h-[22px] shrink-0 items-center gap-1 rounded-lg px-1.5 font-medium text-content-muted transition-colors hover:bg-surface-hover hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                style={{ fontSize: FS.control }}
              >
                <X size={12} strokeWidth={2.2} aria-hidden />
                {t('roadtrip.poi.clearResults')}
              </button>
            </div>
            <div className="relative">
              <Search size={14} strokeWidth={1.9} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-content-faint" aria-hidden />
              <input
                type="text"
                value={corridor.nameFilter}
                onChange={e => corridor.setNameFilter(e.target.value)}
                placeholder={t('roadtrip.poi.filter')}
                aria-label={t('roadtrip.poi.filter')}
                style={{ fontSize: FS.time }}
                className="h-[32px] w-full rounded-[10px] bg-surface-tertiary pe-8 ps-9 text-content placeholder:text-content-faint focus:outline-none focus:ring-1 focus:ring-accent"
              />
              {corridor.nameFilter ? (
                <button
                  type="button"
                  onClick={() => corridor.setNameFilter('')}
                  aria-label={t('common.clear')}
                  className="absolute end-1.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-content-faint transition-colors hover:bg-surface-hover hover:text-content"
                >
                  <X size={13} aria-hidden />
                </button>
              ) : null}
            </div>

            {/* Around one point of the drive, which is how a break is actually planned: you
                decide roughly where to stop and then look at what is there, rather than
                reading seventy hits spread over seven hundred kilometres. The midpoint of
                a leg is offered alongside the stops, because a break on a five-hour drive
                belongs in the middle of it and not at either end.

                The minWidth: 0 is what makes the name shorten instead of pushing the
                kilometre control off the panel: a nowrap label reports its whole width as
                its min-content contribution, so a flex item at its default min-width of
                auto refuses to go below it however long the place name is. */}
            {corridor.anchors.length > 1 && corridor.day ? (
              <div className="mt-2 flex gap-2">
                <CustomSelect
                  value={corridor.section ? `${corridor.section.kind}:${corridor.section.index}` : ''}
                  onChange={value => {
                    const raw = String(value)
                    if (!raw) { corridor.setSection(null); return }
                    const [kind, index] = raw.split(':')
                    corridor.setSection({
                      dayId: corridor.day!.dayId,
                      kind: kind as 'stop' | 'leg',
                      index: Number(index),
                    })
                  }}
                  options={[
                    { value: '', label: t('roadtrip.poi.wholeDay') },
                    ...corridor.anchors.map(a => ({
                      value: `${a.kind}:${a.index}`,
                      label: a.kind === 'stop'
                        ? (corridor.day!.stops[a.index]?.name ?? t('roadtrip.poi.wholeDay'))
                        : t('roadtrip.poi.midLeg', {
                            from: corridor.day!.stops[a.index]?.name ?? '',
                            to: corridor.day!.stops[a.index + 1]?.name ?? '',
                          }),
                    })),
                  ]}
                  style={{ flex: 1, minWidth: 0 }}
                  size="sm"
                  menuFit="content"
                />
                {corridor.section ? (
                  <CustomSelect
                    value={String(corridor.sectionKm)}
                    onChange={value => corridor.setSectionKm(Number(value))}
                    options={CORRIDOR_SECTION_KM.map(km => ({
                      value: String(km),
                      label: `± ${formatDistance(km, distanceUnit)}`,
                    }))}
                    style={{ width: 110, flexShrink: 0 }}
                    size="sm"
                  />
                ) : null}
              </div>
            ) : null}

            {/* Only where there is a charger to narrow. Two answers OSM actually carries
                often enough to filter on: which plug, and how fast. A station that states
                neither stays in the list, because roughly two thirds of them state no
                power at all and reading that silence as "too slow" would empty the map. */}
            {hasCharging ? (
              <div className="mt-2 flex gap-2">
                <CustomSelect
                  value={corridor.socketFilter}
                  onChange={value => corridor.setSocketFilter(String(value))}
                  options={[
                    { value: '', label: t('roadtrip.poi.anySocket') },
                    ...socketsFound.map(s => ({ value: s, label: SOCKET_LABEL[s] ?? s })),
                  ]}
                  style={{ flex: 1, minWidth: 0 }}
                  size="sm"
                />
                <CustomSelect
                  value={String(corridor.minKw)}
                  onChange={value => corridor.setMinKw(Number(value))}
                  options={[
                    { value: '0', label: t('roadtrip.poi.anyPower') },
                    ...KW_STEPS.map(kw => ({ value: String(kw), label: `${kw}+ kW` })),
                  ]}
                  style={{ flex: 1, minWidth: 0 }}
                  size="sm"
                />
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto px-2.5 pb-3">
          {grouped.length === 0 ? (
            // The same empty state the rest of TREK uses, with the mascot acting out the
            // scene. `search` while it is running, `idle` before anyone has asked, and a
            // confused look when a filter left nothing standing — the picture says which
            // of the three it is before the sentence is read.
            <EmptyState
              scene={search.loading ? 'search' : 'idle'}
              mood={filteredToNothing ? 'confused' : undefined}
              size={88}
              fill
              surface="var(--bg-secondary)"
              title={
                search.loading
                  ? t('roadtrip.poi.searchingHint')
                  : filteredToNothing
                    // Four controls narrow this list and only one of them is the
                    // name box. Blaming it regardless produced `Nothing on the
                    // way matches ""` — empty quotes naming a filter the reader
                    // never set — when a section, a plug type or a minimum power
                    // was what emptied it.
                    ? corridor.nameFilter.trim()
                      ? t('roadtrip.poi.noMatch', { name: corridor.nameFilter.trim() })
                      : t('roadtrip.poi.noneMatchFilters')
                    // The one sentence here that nothing has happened yet to explain.
                    // In a narrow column it wraps over three lines to tell somebody to
                    // press the button they are already looking at, so the mascot makes
                    // the point on its own. The other three are answers to something
                    // the reader did, and those are worth the room at any width.
                    : narrow ? '' : t('roadtrip.poi.empty')
              }
            />
          ) : (
            <>
              {/* Shown whenever anything narrowed the list, not only the name
                  box: a section or a plug filter hides hits just as much, and
                  the reader is owed the same "x of y" either way. */}
              {corridor.visible.length !== search.results.length ? (
                <p className="px-2 pt-2.5 text-content-faint" style={{ fontSize: FS.meta }}>
                  {t('roadtrip.poi.foundFiltered', { count: corridor.visible.length, total: search.results.length })}
                </p>
              ) : null}
              {grouped.map(g => (
                <ResultGroup
                  key={g.key}
                  category={g.key}
                  pois={g.pois}
                  dayId={corridor.day?.dayId ?? null}
                  insertIndexFor={corridor.insertIndexFor}
                  onAddPoi={onAddPoi}
                  onFocusPoint={onFocusPoint}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
