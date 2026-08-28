import React, { useMemo, useState } from 'react'
import { Fuel, Zap, ParkingSquare, Tent, Utensils, Camera, Search, Plus, RotateCw, AlertTriangle, type LucideIcon } from 'lucide-react'
import { useTranslation } from '../../i18n/TranslationContext'
import { useSettingsStore } from '../../store/settingsStore'
import { formatDistance } from '../../utils/units'
import CustomSelect from '../shared/CustomSelect'
import { useCorridorPois, type CorridorPoi } from './useCorridorPois'
import type { LatLng } from './corridor'
import type { RoadtripRoutes } from './useRoadtripRoutes'

interface RoadtripCorridorPanelProps {
  routes: RoadtripRoutes
  /** Opens the place form prefilled from a POI, optionally on a day. */
  onAddPoi?: (
    poi: { lat: number; lng: number; name: string; address: string | null; website: string | null; phone: string | null; osm_id: string },
    dayId?: number | null,
  ) => void
}

/**
 * What a drive needs, rather than what a city visit does. Deliberately a short list:
 * every extra category is another round of requests against a shared Overpass mirror.
 */
const CORRIDOR_CATEGORIES: { key: string; labelKey: string; Icon: LucideIcon }[] = [
  { key: 'fuel', labelKey: 'roadtrip.poi.fuel', Icon: Fuel },
  { key: 'charging', labelKey: 'roadtrip.poi.charging', Icon: Zap },
  { key: 'rest_area', labelKey: 'roadtrip.poi.rest', Icon: ParkingSquare },
  { key: 'campsite', labelKey: 'roadtrip.poi.campsite', Icon: Tent },
  { key: 'restaurant', labelKey: 'roadtrip.poi.food', Icon: Utensils },
  { key: 'sights', labelKey: 'roadtrip.poi.sights', Icon: Camera },
]

const CATEGORY_ICON: Record<string, LucideIcon> = Object.fromEntries(
  CORRIDOR_CATEGORIES.map(c => [c.key, c.Icon]),
)

const WIDTHS_KM = [2, 5, 10]

function ResultRow({ poi, onAdd }: { poi: CorridorPoi; onAdd?: () => void }): React.ReactElement {
  const { t } = useTranslation()
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)
  const Icon = CATEGORY_ICON[poi.category] ?? Camera
  return (
    <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-surface-hover">
      <Icon size={15} className="shrink-0 text-content-faint" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="text-body text-content truncate">{poi.name}</div>
        <div className="text-caption text-content-faint tabular-nums">
          {t('roadtrip.poi.offRoute', { distance: formatDistance(poi.offRouteKm, distanceUnit) })}
          <span className="mx-1">·</span>
          {/* A candidate beside the first stop projects to the very start of the line;
              printing that as "after 0 m" reads like a bug rather than "right here". */}
          {poi.alongKm < 0.5
            ? t('roadtrip.poi.atStart')
            : t('roadtrip.poi.alongRoute', { distance: formatDistance(poi.alongKm, distanceUnit) })}
        </div>
      </div>
      {onAdd ? (
        <button
          type="button"
          onClick={onAdd}
          className="shrink-0 flex items-center gap-1 rounded-lg px-2 py-1 text-caption text-content-secondary hover:text-content hover:bg-surface-selected"
        >
          <Plus size={12} aria-hidden />
          {t('roadtrip.poi.add')}
        </button>
      ) : null}
    </div>
  )
}

/**
 * "What is on the way" — the right column while road trip mode is on.
 *
 * Searching is a button, not a side effect of panning: one run is several Overpass
 * requests and the mirrors are shared infrastructure. The scope is one day's drive by
 * default, which keeps a run to a handful of boxes and makes "add this" unambiguous —
 * the stop lands on the day whose route it was found along.
 */
export default function RoadtripCorridorPanel({ routes, onAddPoi }: RoadtripCorridorPanelProps): React.ReactElement {
  const { t } = useTranslation()
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)
  const [dayId, setDayId] = useState<string>(() => String(routes.days[0]?.dayId ?? ''))
  const [active, setActive] = useState<string[]>(['fuel'])
  const [widthKm, setWidthKm] = useState<number>(5)

  const day = routes.days.find(d => String(d.dayId) === dayId) ?? routes.days[0]
  const line = useMemo<LatLng[]>(() => {
    if (!day) return []
    // The stops themselves are enough of a spine: the corridor is kilometres wide, and
    // the routed geometry per leg is not kept once its numbers are read.
    return day.stops.map(s => ({ lat: s.lat, lng: s.lng }))
  }, [day])

  const search = useCorridorPois(line, active, widthKm)

  const dayOptions = routes.days.map(d => ({
    value: String(d.dayId),
    label: t('roadtrip.day', { number: d.dayNumber }),
  }))

  const toggle = (key: string): void =>
    setActive(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]))

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-3 pt-3 pb-2 flex flex-col gap-2.5">
        <h2 className="text-subtitle font-semibold text-content">{t('roadtrip.poi.title')}</h2>

        {dayOptions.length > 1 ? (
          <CustomSelect value={dayId} onChange={value => setDayId(String(value))} options={dayOptions} size="sm" />
        ) : null}

        <div className="flex flex-wrap gap-1.5">
          {CORRIDOR_CATEGORIES.map(({ key, labelKey, Icon }) => {
            const on = active.includes(key)
            return (
              <button
                key={key}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(key)}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-caption transition-colors ${
                  on
                    ? 'bg-accent text-accent-text border-transparent'
                    : 'bg-surface-card text-content-secondary border-edge hover:border-edge-secondary'
                }`}
              >
                <Icon size={12} aria-hidden />
                {t(labelKey)}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-caption text-content-faint">{t('roadtrip.poi.within')}</span>
          <div className="flex gap-1 p-0.5 rounded-lg bg-surface-tertiary border border-edge-faint">
            {WIDTHS_KM.map(km => (
              <button
                key={km}
                type="button"
                aria-pressed={widthKm === km}
                onClick={() => setWidthKm(km)}
                className={`rounded-md px-2 py-0.5 text-caption tabular-nums transition-colors ${
                  widthKm === km ? 'bg-surface-card text-content' : 'text-content-muted hover:text-content'
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
          disabled={search.loading || active.length === 0 || line.length < 2}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-inverse text-inverse-text px-3 py-2 text-body font-medium disabled:opacity-50"
        >
          {search.loading ? <RotateCw size={14} className="animate-spin" aria-hidden /> : <Search size={14} aria-hidden />}
          {search.loading
            ? t('roadtrip.poi.searching', { done: search.progress.done, total: search.progress.total })
            : t('roadtrip.poi.search')}
        </button>

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
        ) : null}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-1.5 pb-3">
        {search.results.length === 0 && !search.loading ? (
          <p className="px-3 py-6 text-caption text-content-muted text-center">{t('roadtrip.poi.empty')}</p>
        ) : (
          search.results.map(poi => (
            <ResultRow
              key={poi.osm_id}
              poi={poi}
              onAdd={onAddPoi ? () => onAddPoi(poi, day?.dayId ?? null) : undefined}
            />
          ))
        )}
      </div>
    </div>
  )
}
