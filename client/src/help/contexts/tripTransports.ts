import { defineScreen } from '../defineScreen'

/**
 * Help for the Transports tab of a trip and for the transports themselves: the
 * rides that carry the traveller between the stops, flights, trains, buses,
 * cars, taxis, bicycles, cruises, ferries and cable cars, plus the automated
 * public-transit connections the Transitous search plans and the lines all of
 * them draw on the map. A screen under `trip`; the step actions live in
 * `e2e/help/trip-transports.guide.ts`.
 */

const TRANSPORT = 'Transport-Flights-Trains-Cars'
const MAP = 'Map-Features'
const OVERLAY = { slug: MAP, anchor: 'reservation-and-transport-overlay' }
const BOOKINGS = 'Reservations-and-Bookings'
const IMPORT = { slug: BOOKINGS, anchor: 'import-from-booking-confirmation' }
const OPENING = { slug: TRANSPORT, anchor: 'opening-a-transport' }

export const { context: tripTransportsContext, guides: tripTransportsGuides } = defineScreen({
  id: 'trip-transports',
  parent: 'trip',
  route: '/trips/:id?tab=transports',
  icon: 'train',
  bullets: 6,
  docs: [{ slug: TRANSPORT }, OVERLAY],
  guides: [
    ['transports-list', 'eye', 'guide', 5, 2, { slug: TRANSPORT, anchor: 'the-transports-tab' }, ['transport-details', 'export-transports-csv', 'edit-transport', 'booking-views', 'filter-bookings', 'import-transport-file', 'airtrail-import']],
    ['add-transport', 'plus', 'guide', 6, 3, { slug: TRANSPORT, anchor: 'common-fields' }, ['car-stops', 'plan-transit', 'edit-transport', 'transports-list'], true],
    ['car-stops', 'car', 'guide', 6, 2, { slug: TRANSPORT, anchor: 'cars-buses-and-everything-else' }, ['add-transport', 'edit-transport', 'transport-on-map']],
    ['import-transport-file', 'fileInput', 'guide', 5, 2, IMPORT, ['add-transport', 'import-booking-file', 'transports-list'], true],
    ['plan-transit', 'train', 'guide', 6, 3, { slug: TRANSPORT, anchor: 'public-transit-search' }, ['change-transit-route', 'leg-travel-mode', 'add-transport'], true],
    ['change-transit-route', 'repeat', 'quick', 4, 2, { slug: TRANSPORT, anchor: 'public-transit-search' }, ['plan-transit', 'transport-details', 'edit-transport']],
    ['leg-travel-mode', 'route', 'quick', 4, 3, { slug: MAP, anchor: 'travel-times-between-stops' }, ['plan-transit', 'day-route', 'read-day-plan']],
    ['transport-details', 'ticket', 'guide', 5, 2, OPENING, ['edit-transport', 'transport-on-map', 'transports-list'], true],
    ['edit-transport', 'pencil', 'quick', 4, 2, OPENING, ['transport-details', 'add-transport', 'transports-list', 'bookings-in-plan']],
    ['transport-on-map', 'map', 'guide', 5, 3, OVERLAY, ['transport-details', 'transports-list', 'day-route'], true],
    ['export-transports-csv', 'fileSpreadsheet', 'quick', 2, 2, { slug: BOOKINGS, anchor: 'exporting-as-csv' }, ['transports-list', 'filter-bookings']],
    // Last: the guide connects an AirTrail in its start and takes the connection
    // away in its cleanup, so the hero and the guides before it keep a toolbar
    // without the AirTrail button.
    ['airtrail-import', 'plane', 'guide', 6, 3, { slug: BOOKINGS, anchor: 'import-from-airtrail' }, ['transports-list', 'add-transport', 'edit-transport'], true],
  ],
})
