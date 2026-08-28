import React from 'react'
import {
  Fuel, Zap, ParkingSquare, Tent, Utensils, Camera, Search, Plus, RotateCw,
  AlertTriangle, MapPin, type LucideIcon,
} from 'lucide-react'
import { useTranslation } from '../../i18n/TranslationContext'
import { useSettingsStore } from '../../store/settingsStore'
import { formatDistance } from '../../utils/units'
import CustomSelect from '../shared/CustomSelect'
import { CORRIDOR_CATEGORY_KEYS, CORRIDOR_WIDTHS_KM, type RoadtripCorridor } from './useRoadtripCorridor'
import type { CorridorPoi } from './useCorridorPois'
import type { RoadtripRoutes } from './useRoadtripRoutes'

interface RoadtripCorridorPanelProps {
  corridor: RoadtripCorridor
  routes: RoadtripRoutes
  /** Opens the place form prefilled from a POI, optionally on a day. */
  onAddPoi?: (
    poi: { lat: number; lng: number; name: string; address: string | null; website: string | null; phone: string | null; osm_id: string },
    dayId?: number | null,
  ) => void
}

const CATEGORY_META: Record<string, { labelKey: string; Icon: LucideIcon }> = {
  fuel: { labelKey: 'roadtrip.poi.fuel', Icon: Fuel },
  charging: { labelKey: 'roadtrip.poi.charging', Icon: Zap },
  rest_area: { labelKey: 'roadtrip.poi.rest', Icon: ParkingSquare },
  campsite: { labelKey: 'roadtrip.poi.campsite', Icon: Tent },
  restaurant: { labelKey: 'roadtrip.poi.food', Icon: Utensils },
  sights: { labelKey: 'roadtrip.poi.sights', Icon: Camera },
}

const LABEL = 'text-caption font-medium text-content-faint uppercase tracking-wide'

/**
 * The brand's logo ahead of its name, falling back to the category icon.
 *
 * Same picture as the map pin: a corridor is mostly chains, and the logo is what the eye
 * finds first. The image lies over the icon and only appears once it has loaded, so a
 * brand without a logo — or a slow one — shows the icon rather than a hole in the row.
 */
function ResultBadge({ poi }: { poi: CorridorPoi }): React.ReactElement {
  const meta = CATEGORY_META[poi.category]
  const Icon = meta?.Icon ?? MapPin
  const brand = poi.brand_wikidata && /^Q[1-9][0-9]{0,11}$/.test(poi.brand_wikidata) ? poi.brand_wikidata : null
  return (
    <span className="relative grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface-tertiary">
      <Icon size={14} className="text-content-faint" aria-hidden />
      {brand ? (
        <img
          src={`/api/maps/brand-logo/${brand}`}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity"
          onLoad={e => { e.currentTarget.style.opacity = '1' }}
          onError={e => e.currentTarget.remove()}
        />
      ) : null}
    </span>
  )
}

function ResultRow({ poi, onAdd }: { poi: CorridorPoi; onAdd?: () => void }): React.ReactElement {
  const { t } = useTranslation()
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)
  return (
    <li className="group flex items-center gap-2.5 rounded-xl px-2.5 py-2 hover:bg-surface-hover">
      <ResultBadge poi={poi} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-body text-content">{poi.name}</div>
        <div className="text-caption text-content-faint tabular-nums">
          {t('roadtrip.poi.offRoute', { distance: formatDistance(poi.offRouteKm, distanceUnit) })}
          <span className="mx-1">·</span>
          {poi.alongKm < 0.5
            ? t('roadtrip.poi.atStart')
            : t('roadtrip.poi.alongRoute', { distance: formatDistance(poi.alongKm, distanceUnit) })}
        </div>
      </div>
      {onAdd ? (
        <button
          type="button"
          onClick={onAdd}
          className="flex shrink-0 items-center gap-1 rounded-lg border border-edge bg-surface-card px-2 py-1 text-caption font-medium text-content-secondary opacity-0 transition-opacity hover:text-content focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Plus size={12} aria-hidden />
          {t('roadtrip.poi.add')}
        </button>
      ) : null}
    </li>
  )
}

/** One category's hits, so a mixed search reads as several short lists instead of one long one. */
function ResultGroup({ category, pois, dayId, onAddPoi }: {
  category: string
  pois: CorridorPoi[]
  dayId: number | null
  onAddPoi: RoadtripCorridorPanelProps['onAddPoi']
}): React.ReactElement {
  const { t } = useTranslation()
  const meta = CATEGORY_META[category]
  const Icon = meta?.Icon ?? MapPin
  return (
    <section className="pb-1">
      <header className="flex items-center gap-2 px-4 py-1.5">
        <Icon size={13} className="text-content-faint" aria-hidden />
        <span className={LABEL}>{meta ? t(meta.labelKey) : category}</span>
        <span className="ml-auto text-caption text-content-faint tabular-nums">{pois.length}</span>
      </header>
      <ul className="px-1.5">
        {pois.map(poi => (
          <ResultRow key={poi.osm_id} poi={poi} onAdd={onAddPoi ? () => onAddPoi(poi, dayId) : undefined} />
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
    .map(key => ({ key, pois: search.results.filter(p => p.category === key) }))
    .filter(g => g.pois.length > 0)

  const canSearch = !search.loading && corridor.categories.length > 0 && (corridor.day?.stops.length ?? 0) > 1
  const progressPct = search.progress.total
    ? Math.round((search.progress.done / search.progress.total) * 100)
    : 0

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header — the rhythm of the places sidebar this replaces. */}
      <div className="flex-shrink-0 border-b border-edge-faint px-4 pb-2.5 pt-3.5">
        <h2 className="text-subtitle font-semibold text-content">{t('roadtrip.poi.title')}</h2>
      </div>

      {/* Search controls */}
      <div className="flex flex-shrink-0 flex-col gap-3 border-b border-edge-faint px-4 py-3">
        {dayOptions.length > 1 ? (
          <div>
            <span className={LABEL}>{t('roadtrip.poi.scope')}</span>
            <div className="mt-1">
              <CustomSelect
                value={corridor.dayId}
                onChange={value => corridor.setDayId(String(value))}
                options={dayOptions}
                size="sm"
              />
            </div>
          </div>
        ) : null}

        <div>
          <span className={LABEL}>{t('roadtrip.poi.looking')}</span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {CORRIDOR_CATEGORY_KEYS.map(key => {
              const { labelKey, Icon } = CATEGORY_META[key]
              const on = corridor.categories.includes(key)
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => corridor.toggleCategory(key)}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-caption font-medium transition-colors ${
                    on
                      ? 'border-transparent bg-accent text-accent-text'
                      : 'border-edge bg-surface-card text-content-secondary hover:border-edge-secondary hover:text-content'
                  }`}
                >
                  <Icon size={12} aria-hidden />
                  {t(labelKey)}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={LABEL}>{t('roadtrip.poi.within')}</span>
          <div className="ml-auto flex gap-0.5 rounded-lg border border-edge-faint bg-surface-tertiary p-0.5">
            {CORRIDOR_WIDTHS_KM.map(km => (
              <button
                key={km}
                type="button"
                aria-pressed={corridor.widthKm === km}
                onClick={() => corridor.setWidthKm(km)}
                className={`rounded-md px-2.5 py-1 text-caption tabular-nums transition-colors ${
                  corridor.widthKm === km ? 'bg-surface-card font-medium text-content' : 'text-content-muted hover:text-content'
                }`}
              >
                {formatDistance(km, distanceUnit)}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={search.search}
          disabled={!canSearch}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-body font-medium text-accent-text transition-opacity disabled:opacity-50"
        >
          {search.loading
            ? <RotateCw size={14} className="animate-spin" aria-hidden />
            : <Search size={14} aria-hidden />}
          {search.loading
            ? t('roadtrip.poi.searching', { done: search.progress.done, total: search.progress.total })
            : t('roadtrip.poi.search')}
        </button>

        {search.loading ? (
          <div className="h-0.5 overflow-hidden rounded-full bg-surface-tertiary" role="progressbar" aria-valuenow={progressPct}>
            <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${progressPct}%` }} />
          </div>
        ) : null}

        {search.capped ? (
          <p className="flex items-start gap-1.5 text-caption text-warning">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden />
            {t('roadtrip.poi.capped')}
          </p>
        ) : null}
        {search.error ? (
          <p className="flex items-start gap-1.5 text-caption text-danger">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden />
            {t('roadtrip.poi.failed')}
          </p>
        ) : search.failedAreas > 0 ? (
          // Some boxes answered and some did not. Saying so is the difference between
          // "there is no fuel on this stretch" and "nobody looked at this stretch".
          <p className="flex items-start gap-1.5 text-caption text-warning">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden />
            {t('roadtrip.poi.partial', { count: search.failedAreas })}
          </p>
        ) : null}
      </div>

      {/* Results */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-surface-secondary">
        {grouped.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <MapPin size={20} className="mx-auto mb-2.5 text-content-faint" aria-hidden />
            <p className="text-caption text-content-muted">
              {search.loading ? t('roadtrip.poi.searchingHint') : t('roadtrip.poi.empty')}
            </p>
          </div>
        ) : (
          <>
            <p className="px-4 pb-1 pt-2.5 text-caption text-content-faint">
              {t('roadtrip.poi.found', { count: search.results.length })}
            </p>
            {grouped.map(g => (
              <ResultGroup
                key={g.key}
                category={g.key}
                pois={g.pois}
                dayId={corridor.day?.dayId ?? null}
                onAddPoi={onAddPoi}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
