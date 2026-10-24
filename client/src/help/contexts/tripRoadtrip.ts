import { defineScreen } from '../defineScreen'

/**
 * Help for road trip mode: the plan read as one drive. Turning the mode on,
 * the stops on the way and how long you stay at them, moving stops around the
 * rail, what is along the route and a night on the road, bending a leg with a
 * via point or another way round, the driving settings and the travel day,
 * refuelling before the tank runs out and how full one stop fills, booked
 * rides on the drive, putting a day onto an imported track, importing a
 * Google Maps route and showing current warnings.
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
    ['roadtrip-mode', 'route', 'guide', 5, 3, { slug: RT, anchor: 'switching-to-road-trip' }, ['read-day-plan', 'roadtrip-limits', 'roadtrip-bookings'], true],
    ['roadtrip-stops', 'mapPin', 'guide', 6, 5, { slug: RT, anchor: 'stops-on-the-way' }, ['roadtrip-corridor', 'roadtrip-reorder', 'set-stop-times'], true],
    ['roadtrip-reorder', 'arrowUpDown', 'quick', 3, 3, { slug: RT, anchor: 'switching-to-road-trip' }, ['roadtrip-stops', 'reorder-stops'], true],
    ['roadtrip-corridor', 'search', 'guide', 5, 4, { slug: RT, anchor: 'search-along-the-route' }, ['roadtrip-overnight', 'roadtrip-stops', 'roadtrip-refuel'], true],
    ['roadtrip-overnight', 'bed', 'guide', 5, 3, { slug: RT, anchor: 'booked-nights-on-the-drive' }, ['roadtrip-corridor', 'add-accommodation'], true],
    ['roadtrip-via', 'map', 'guide', 5, 3, { slug: RT, anchor: 'via-points' }, ['roadtrip-alternatives', 'roadtrip-track']],
    ['roadtrip-alternatives', 'repeat', 'quick', 4, 2, { slug: RT, anchor: 'other-ways-and-avoidance' }, ['roadtrip-via', 'roadtrip-limits']],
    ['roadtrip-limits', 'sliders', 'guide', 6, 3, LIMITS, ['roadtrip-refuel', 'roadtrip-stop-fill', 'roadtrip-day-window'], true],
    ['roadtrip-day-window', 'calendarRange', 'guide', 5, 3, { slug: RT, anchor: 'daily-travel-times-and-day-endings' }, ['roadtrip-limits', 'roadtrip-mode']],
    ['roadtrip-refuel', 'minusCircle', 'guide', 4, 3, LIMITS, ['roadtrip-stop-fill', 'roadtrip-limits', 'roadtrip-corridor'], true],
    ['roadtrip-stop-fill', 'batteryCharging', 'quick', 3, 2, LIMITS, ['roadtrip-refuel', 'roadtrip-limits']],
    ['roadtrip-bookings', 'plane', 'guide', 4, 3, { slug: RT, anchor: 'flights-trains-and-ferries-on-the-drive' }, ['add-transport', 'roadtrip-mode']],
    ['roadtrip-track', 'flag', 'guide', 4, 2, { slug: RT, anchor: 'following-a-gpx-or-kml-track' }, ['import-places-file', 'roadtrip-via'], true],
    ['roadtrip-google-import', 'link', 'guide', 4, 3, { slug: RT, anchor: 'importing-a-google-maps-route' }, ['import-places-list', 'roadtrip-reorder'], true],
    ['roadtrip-hazards', 'alert', 'quick', 3, 3, { slug: RT, anchor: 'weather-warnings-and-disaster-alerts' }, ['roadtrip-limits'], true],
  ],
})
