import { defineScreen } from '../defineScreen'

/**
 * Help for road trip mode: the plan read as one drive. Turning the mode on,
 * the stops on the way and how long you stay at them, what is along the route,
 * bending a leg with a via point or another way round, the driving settings
 * and the travel day, refuelling before the tank runs out, and putting a day
 * onto an imported track.
 * A screen under `trip`; the step actions live in `e2e/help/trip-roadtrip.guide.ts`.
 */

const RT = 'Road-Trip'
const LIMITS = { slug: RT, anchor: 'driving-limits-and-range' }

export const { context: tripRoadtripContext, guides: tripRoadtripGuides } = defineScreen({
  id: 'trip-roadtrip',
  parent: 'trip',
  route: '/trips/:id?tab=plan',
  icon: 'compass',
  bullets: 6,
  docs: [{ slug: RT }, { slug: RT, anchor: 'what-needs-a-connection' }],
  guides: [
    ['roadtrip-mode', 'route', 'guide', 5, 3, { slug: RT, anchor: 'switching-to-road-trip' }, ['read-day-plan', 'roadtrip-limits'], true],
    ['roadtrip-stops', 'mapPin', 'guide', 6, 3, { slug: RT, anchor: 'stops-on-the-way' }, ['roadtrip-corridor', 'set-stop-times'], true],
    ['roadtrip-corridor', 'search', 'guide', 5, 3, { slug: RT, anchor: 'search-along-the-route' }, ['roadtrip-stops', 'roadtrip-refuel'], true],
    ['roadtrip-via', 'map', 'guide', 5, 3, { slug: RT, anchor: 'via-points' }, ['roadtrip-alternatives', 'roadtrip-track']],
    ['roadtrip-alternatives', 'repeat', 'quick', 4, 2, { slug: RT, anchor: 'other-ways-and-avoidance' }, ['roadtrip-via', 'roadtrip-limits']],
    ['roadtrip-limits', 'sliders', 'guide', 6, 3, LIMITS, ['roadtrip-refuel', 'roadtrip-day-window'], true],
    ['roadtrip-day-window', 'calendarRange', 'guide', 5, 3, { slug: RT, anchor: 'daily-travel-times-and-day-endings' }, ['roadtrip-limits', 'roadtrip-mode']],
    ['roadtrip-refuel', 'minusCircle', 'guide', 4, 3, LIMITS, ['roadtrip-limits', 'roadtrip-corridor'], true],
    ['roadtrip-track', 'flag', 'guide', 4, 2, { slug: RT, anchor: 'following-a-gpx-or-kml-track' }, ['import-places-file', 'roadtrip-via'], true],
  ],
})
