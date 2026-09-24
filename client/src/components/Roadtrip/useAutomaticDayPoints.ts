import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from '../../i18n/TranslationContext'
import type { RouteVia } from '../../types'
import type { RoadtripRoutes } from './useRoadtripRoutes'

export function useAutomaticDayPoints(routes: RoadtripRoutes, collapsed: Set<number>) {
  const { t } = useTranslation()
  const [selection, setSelection] = useState<{ days: RoadtripRoutes['days']; points: [number, number][] } | null>(null)
  const focusPoint = useCallback((lat: number, lng: number) => {
    setSelection({ days: routes.days, points: [[lat, lng]] })
  }, [routes.days])
  const markers = useMemo<RouteVia[]>(() => {
    const places = new Set(routes.days.flatMap(day => day.stops.filter(stop => !stop.automaticNight).map(stop => `${stop.lat},${stop.lng}`)))
    const nights = routes.days.flatMap(day => day.stops.filter(stop => stop.automaticNight?.phase === 'end').map(stop => ({ day: day.dayNumber, ...stop.automaticNight! })))
    const ends = routes.days.filter(d => !collapsed.has(d.dayId)).flatMap(day => day.stops.flatMap((stop, i) =>
      stop.automaticNight?.phase === 'end' ? [{
        lat: stop.lat, lng: stop.lng, tone: 'default' as const, hoverCard: true,
        nightPause: { day: day.dayNumber, atPlace: places.has(`${stop.lat},${stop.lng}`),
          position: stop.automaticNight.position, manual: stop.automaticNight.manual,
          minPosition: nights.filter(n => n.day < day.dayNumber).slice(-1)[0]?.position,
          maxPosition: nights.find(n => n.day > day.dayNumber && n.manual)?.position },
        label: t('roadtrip.window.pointLabel', { day: day.dayNumber, time: day.schedule.entries[i]?.arrival ?? '' }),
      }] : [],
    ))
    return [...routes.vias, ...ends]
  }, [routes.days, routes.vias, collapsed, t])
  return { markers, focusPoint, focusPoints: selection?.days === routes.days ? selection.points : null }
}
