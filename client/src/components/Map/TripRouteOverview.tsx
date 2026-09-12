import { Route } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { profileIcon } from '../Planner/DayPlanSidebarRouteConnector'
import { formatDistance } from '../../utils/units'
import { MAP_CONTROL_SHADOW } from './mapControlShadow'
import type { TripRouteOverview as Overview } from './useTripRouteOverview'
import type { DistanceUnit } from '../../types'

/**
 * Toggle for the whole-trip route overview (#1736). Same frosted shell as the other
 * map controls, so it lines up with the compass and the layer switcher.
 */
export function TripRouteOverviewPill({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  const { t } = useTranslation()
  const label = active ? t('map.overview.hide') : t('map.overview.show')
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', padding: 4, borderRadius: 999, pointerEvents: 'auto',
      background: 'var(--sidebar-bg)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      boxShadow: MAP_CONTROL_SHADOW,
    }}>
      <button
        type="button"
        onClick={onToggle}
        aria-label={label}
        title={label}
        aria-pressed={active}
        data-testid="trip-overview-pill"
        className={active ? 'text-accent' : 'text-content-muted'}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 34, height: 34, borderRadius: 999, border: 'none', cursor: 'pointer',
          background: 'transparent', padding: 0,
          transition: 'background 0.14s, color 0.14s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      >
        <Route size={17} strokeWidth={2} />
      </button>
    </div>
  )
}

/**
 * The trip's stages and its total distance, read off the overview the map is drawing.
 *
 * One component for both shells: the phone and the desktop place it differently but the
 * rows are the same rows, and a second copy of them is a second thing to keep in step.
 */
export function TripRouteOverviewPanel({ overview, unit, selectedDayId, onSelectDay, maxWidth = 320 }: {
  overview: Overview
  unit: DistanceUnit
  selectedDayId?: number | null
  onSelectDay?: (dayId: number) => void
  /** How wide the card may grow before day names start to ellipsize. */
  maxWidth?: number
}) {
  const { t } = useTranslation()
  if (!overview.days.length) return null

  return (
    <div
      data-testid="trip-overview-panel"
      style={{
        pointerEvents: 'auto', borderRadius: 14, overflow: 'hidden',
        background: 'var(--sidebar-bg)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        boxShadow: 'var(--sidebar-shadow, 0 4px 16px rgba(0,0,0,0.14))',
        // Sized to its rows rather than to the space available: a trip of short day
        // names left a band of empty card over the map, which on a phone is most of
        // what there is to look at.
        width: 'fit-content', maxWidth,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, padding: '10px 14px 8px' }}>
        <span className="text-content-muted" style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', textTransform: 'uppercase', letterSpacing: 0.4 }}>
          {t('map.overview.total')}
        </span>
        {/* Same tier as the label beside it: the two read as one line rather than as a
            heading with a number stuck under it. */}
        <span className="text-content" style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 600 }}>
          {formatDistance(overview.totalDistance / 1000, unit)}
          {/* Still routing: the number is a partial sum, and saying so beats a total
              that silently grows while you read it. */}
          {overview.loading && <span className="text-content-muted" style={{ fontWeight: 400 }}>{' '}…</span>}
        </span>
      </div>
      <div style={{ maxHeight: 220, overflowY: 'auto', borderTop: '1px solid var(--border-primary)' }}>
        {overview.days.map(day => {
          const label = day.title || t('dayplan.dayN', { n: day.dayNumber })
          const row = (
            <>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: day.color.line, flexShrink: 0 }} aria-hidden />
              <span className="text-content" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {label}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0 }} className="text-content-muted">
                {day.modes.map(mode => {
                  const Icon = profileIcon(mode)
                  return <Icon key={mode} size={12} strokeWidth={2} aria-hidden />
                })}
              </span>
              <span className="text-content-muted" style={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                {formatDistance(day.distance / 1000, unit)}
              </span>
            </>
          )
          const style = {
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            padding: '7px 14px', textAlign: 'left' as const,
            fontSize: 'calc(12px * var(--fs-scale-body, 1))',
            background: day.dayId === selectedDayId ? 'var(--bg-hover)' : 'transparent',
            border: 'none',
          }
          return onSelectDay ? (
            <button key={day.dayId} type="button" onClick={() => onSelectDay(day.dayId)} style={{ ...style, cursor: 'pointer' }}>
              {row}
            </button>
          ) : (
            <div key={day.dayId} style={style}>{row}</div>
          )
        })}
      </div>
    </div>
  )
}
