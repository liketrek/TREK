import React, { useMemo } from 'react'
import {
  Search, Plus, RotateCw, AlertTriangle, X, BedDouble, MapPin,
} from 'lucide-react'
import { useTranslation } from '../../i18n/TranslationContext'
import { Tooltip } from '../shared/Tooltip'
import EmptyState from '../shared/EmptyState'
import { useSettingsStore } from '../../store/settingsStore'
import { formatDistance } from '../../utils/units'
import CustomSelect from '../shared/CustomSelect'
import RoadtripCategoryPicker from './RoadtripCategoryPicker'
import { serviceColor } from './roadtripModel'
import { CORRIDOR_CATEGORY_BY_KEY } from './stopKinds'
import { FS } from './typeScale'
import { CORRIDOR_CATEGORY_KEYS, CORRIDOR_WIDTHS_KM, type RoadtripCorridor } from './useRoadtripCorridor'
import type { CorridorPoi } from './useCorridorPois'
import type { RoadtripRoutes } from './useRoadtripRoutes'

interface RoadtripCorridorPanelProps {
  corridor: RoadtripCorridor
  routes: RoadtripRoutes
  /** Opens the place form prefilled from a POI, on a day and at a position in it. */
  onAddPoi?: (
    poi: { lat: number; lng: number; name: string; address: string | null; website: string | null; phone: string | null; osm_id: string },
    dayId?: number | null,
    position?: number | null,
  ) => void
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

function ResultRow({ poi, onAdd }: { poi: CorridorPoi; onAdd?: () => void }): React.ReactElement {
  const { t } = useTranslation()
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)
  return (
    <li className="group flex items-center gap-3 rounded-xl py-1.5 pe-1.5 ps-1 transition-colors hover:bg-surface-hover">
      <ResultBadge category={poi.category} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold tracking-[-0.012em] text-content" style={{ fontSize: FS.name }}>
          {poi.name}
        </div>
        {/* Two facts, two elements. Both are translated phrases rather than short fixed
            values, so they stay text and the gap does the separating a middot used to —
            which also lets them wrap onto their own lines instead of breaking around a
            dot left stranded at the end of a line. */}
        <div
          className="flex flex-wrap items-baseline gap-x-2 tabular-nums text-content-faint"
          style={{ fontSize: FS.meta }}
        >
          <span>{t('roadtrip.poi.offRoute', { distance: formatDistance(poi.offRouteKm, distanceUnit) })}</span>
          <span>
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
function ResultGroup({ category, pois, dayId, insertIndexFor, onAddPoi }: {
  category: string
  pois: CorridorPoi[]
  dayId: number | null
  insertIndexFor: RoadtripCorridor['insertIndexFor']
  onAddPoi: RoadtripCorridorPanelProps['onAddPoi']
}): React.ReactElement {
  const { t } = useTranslation()
  const meta = CATEGORY_META[category]
  const Icon = meta?.Icon ?? MapPin
  const color = serviceColor(category)
  return (
    <section className="pb-1">
      <header className="flex items-center gap-2.5 px-2 pb-1.5 pt-3">
        <span
          className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-[7px]"
          // theme-lint-disable — see ResultBadge.
          style={{ background: color, color: '#fff' }}
        >
          <Icon size={12} strokeWidth={2} aria-hidden />
        </span>
        <span className="font-semibold tracking-[-0.01em] text-content" style={{ fontSize: FS.name }}>
          {meta ? t(meta.labelKey) : category}
        </span>
        <span className={`ms-auto ${EYEBROW} tabular-nums`} style={{ fontSize: FS.micro }}>
          {t('roadtrip.poi.found', { count: pois.length })}
        </span>
      </header>
      <ul>
        {pois.map(poi => (
          <ResultRow
            key={poi.osm_id}
            poi={poi}
            // Added where it will be driven past, not at the end of the day.
            onAdd={onAddPoi ? () => onAddPoi(poi, dayId, insertIndexFor(poi)) : undefined}
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
export default function RoadtripCorridorPanel({ corridor, routes, onAddPoi }: RoadtripCorridorPanelProps): React.ReactElement {
  const { t } = useTranslation()
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)
  const { search } = corridor

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
    return [...seen].sort()
  }, [search.results])
  const hasCharging = socketsFound.length > 0

  const filteredToNothing = search.results.length > 0 && corridor.visible.length === 0

  const canSearch = !search.loading && corridor.categories.length > 0 && (corridor.day?.stops.length ?? 0) > 1
  const progressPct = search.progress.total
    ? Math.round((search.progress.done / search.progress.total) * 100)
    : 0

  const warnings: [string, string][] = []
  if (search.capped) warnings.push(['capped', t('roadtrip.poi.capped')])
  if (search.error) warnings.push(['failed', t('roadtrip.poi.failed')])
  // Some boxes answered and some did not. Saying so is the difference between "there is
  // no fuel on this stretch" and "nobody looked at this stretch".
  else if (search.failedAreas > 0) warnings.push(['partial', t('roadtrip.poi.partial', { count: search.failedAreas })])
  // The stretch was searched and the answer came back short. Without this line a filter
  // finding nothing looks like proof there is nothing.
  if (search.truncatedAreas > 0) warnings.push(['truncated', t('roadtrip.poi.truncated', { count: search.truncatedAreas })])

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 px-3.5 pb-3.5 pt-3">
      {/* Header — the panel's name, and the day the question is about. */}
      <div className="flex flex-shrink-0 items-center gap-2.5 px-1">
        <h2 className="font-semibold tracking-[-0.022em] text-content" style={{ fontSize: FS.panelTitle }}>
          {t('roadtrip.poi.title')}
        </h2>
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

        {/* One word, so it can be read at the size a primary action deserves. The panel
            it sits in is headed "along the route" and every control above it narrows the
            same search; repeating that on the button only made it small. */}
        <button
          type="button"
          onClick={search.search}
          disabled={!canSearch}
          className="flex h-[38px] w-full items-center justify-center gap-2 rounded-xl bg-accent text-body font-semibold text-accent-text transition-opacity disabled:opacity-50"
        >
          {search.loading
            ? <RotateCw size={15} className="animate-spin" aria-hidden />
            : <Search size={15} strokeWidth={2} aria-hidden />}
          {search.loading
            ? t('roadtrip.poi.searching', { done: search.progress.done, total: search.progress.total })
            : t('roadtrip.poi.search')}
        </button>
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
                  style={{ flex: 1 }}
                  size="sm"
                />
                <CustomSelect
                  value={String(corridor.minKw)}
                  onChange={value => corridor.setMinKw(Number(value))}
                  options={[
                    { value: '0', label: t('roadtrip.poi.anyPower') },
                    ...KW_STEPS.map(kw => ({ value: String(kw), label: `${kw}+ kW` })),
                  ]}
                  style={{ flex: 1 }}
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
              compact
              surface="var(--bg-secondary)"
              title={
                search.loading
                  ? t('roadtrip.poi.searchingHint')
                  : filteredToNothing
                    ? t('roadtrip.poi.noMatch', { name: corridor.nameFilter.trim() })
                    : t('roadtrip.poi.empty')
              }
            />
          ) : (
            <>
              {corridor.nameFilter.trim() ? (
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
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
