import type { RouteVia } from '../../types'

export interface MapHoverInfo {
  name?: string | null
  address?: string | null
  category_name?: string | null
  category_icon?: string | null
  category_color?: string | null
  /** Everyone's average, where the surface keeps ratings. On the collections map it
   *  is the one thing a round photo cannot tell you: which of these you liked. */
  rating_avg?: number | null
  routeVia?: RouteVia
}
