import { defineScreen } from '../defineScreen'

/**
 * Help for the map in the middle of a trip's plan: what the pins, badges and
 * bubbles mean, the places the map itself can find, and the switches along its
 * edges, satellite, the whole trip with its distances and the booking routes.
 * A screen under `trip`; the step actions live in `e2e/help/trip-map.guide.ts`.
 */

const MAP = 'Map-Features'
const SETTINGS = 'Map-Settings'
const OVERLAY = { slug: MAP, anchor: 'reservation-and-transport-overlay' }

export const { context: tripMapContext, guides: tripMapGuides } = defineScreen({
  id: 'trip-map',
  parent: 'trip',
  route: '/trips/:id?tab=plan',
  icon: 'map',
  bullets: 8,
  docs: [{ slug: MAP }, { slug: SETTINGS }],
  guides: [
    ['map-markers', 'mapPin', 'guide', 5, 3, { slug: MAP, anchor: 'place-markers' }, ['read-day-plan', 'place-detail', 'day-route']],
    ['map-nearby-places', 'search', 'guide', 6, 3, { slug: 'Places-and-Search', anchor: 'exploring-the-map-by-category' }, ['map-add-place', 'create-place'], true],
    ['map-add-place', 'plus', 'guide', 4, 2, { slug: MAP, anchor: 'right-click-middle-click-to-create-a-place' }, ['create-place', 'map-nearby-places'], true],
    ['map-satellite', 'globe', 'quick', 3, 2, { slug: MAP, anchor: 'satellite-view' }, ['map-provider', 'default-map', 'map-compass']],
    ['map-whole-trip', 'route', 'guide', 4, 3, { slug: MAP, anchor: 'the-whole-trip-at-once' }, ['day-route', 'export-plan'], true],
    ['map-booking-routes', 'ticket', 'guide', 5, 3, OVERLAY, ['bookings-in-plan', 'travel-map-prefs', 'add-transport', 'create-booking']],
    ['map-dawarich-trail', 'route', 'guide', 3, 2, { slug: 'Dawarich', anchor: 'on-the-trip-map' }, ['map-whole-trip', 'map-markers'], true],
    // Last: it switches the account to the MapLibre renderer and puts Leaflet
    // back in its cleanup, and nothing in the file runs after it if that fails.
    ['map-compass', 'compass', 'quick', 2, 2, { slug: SETTINGS, anchor: 'map-provider' }, ['map-provider', 'map-satellite']],
  ],
})
