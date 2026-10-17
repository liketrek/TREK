import { useLocation } from 'react-router'

/**
 * A screen's route ready to follow. A trip screen's route carries `:id`, which
 * only the address of the trip the reader is on can fill in; browsed from
 * elsewhere, such a screen has no way in and the button stays away.
 */
export function useScreenRoute(route: string | undefined): string | null {
  const { pathname } = useLocation()
  if (!route) return null
  if (!route.includes(':id')) return route
  const match = /^\/trips\/(\d+)/.exec(pathname)
  return match ? route.replace(':id', match[1]) : null
}
