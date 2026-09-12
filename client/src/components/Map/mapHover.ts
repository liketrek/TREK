import type { RouteVia } from '../../types'

export interface MapHoverInfo {
  name?: string | null
  address?: string | null
  category_name?: string | null
  category_icon?: string | null
  category_color?: string | null
  routeVia?: RouteVia
}
