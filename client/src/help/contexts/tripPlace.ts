import { defineScreen } from '../defineScreen'

/**
 * Help for the card that floats over the map once a place is picked: reading
 * what the trip knows about a place, rating it, giving it a picture (a new one
 * or one of its files), correcting its hours and contact details, putting it
 * on the open day and off it again, who is coming, the booking pinned to the
 * stop, the map apps, and a track’s colour and length. A tour opens a card of
 * its own and is not covered here.
 * A screen under `trip`; the step actions live in `e2e/help/trip-place.guide.ts`.
 */

const PLACES = 'Places-and-Search'
const FIELDS = { slug: PLACES, anchor: 'place-fields' }
const IMAGE = { slug: PLACES, anchor: 'custom-place-image' }

export const { context: tripPlaceContext, guides: tripPlaceGuides } = defineScreen({
  id: 'trip-place',
  parent: 'trip',
  route: '/trips/:id?tab=plan',
  icon: 'landmark',
  bullets: 6,
  docs: [{ slug: PLACES }, { slug: 'Trip-Planner-Overview' }],
  guides: [
    ['read-place', 'eye', 'guide', 7, 3, FIELDS, ['rate-place', 'place-day-assign', 'place-own-hours'], true],
    ['rate-place', 'star', 'quick', 4, 3, { slug: PLACES, anchor: 'rating-a-place' }, ['read-place', 'filter-places'], true],
    ['place-image', 'image', 'guide', 4, 3, IMAGE, ['place-image-from-file', 'edit-place'], true],
    ['place-image-from-file', 'gallery', 'quick', 4, 3, IMAGE, ['place-image', 'place-files'], true],
    ['place-own-hours', 'clock', 'guide', 5, 3, { slug: PLACES, anchor: 'phone-e-mail-and-opening-hours' }, ['read-place', 'edit-place'], true],
    ['place-day-assign', 'calendarCheck', 'guide', 5, 3, { slug: 'Day-Plans-and-Notes', anchor: 'assigning-places-to-a-day' }, ['place-onto-day', 'remove-from-day', 'undo-change']],
    ['place-participants', 'users', 'quick', 4, 3, { slug: 'Trip-Members-and-Sharing', anchor: 'what-a-guest-can-be-assigned-to' }, ['add-member', 'add-guest'], true],
    ['place-booking', 'ticket', 'guide', 5, 3, { slug: 'Reservations-and-Bookings', anchor: 'reservation-card-contents' }, ['bookings-in-plan', 'link-booking'], true],
    ['place-files', 'folder', 'quick', 4, 3, { slug: 'Documents-and-Files', anchor: 'linking-files-to-places-reservations-or-assignments' }, ['place-image-from-file', 'read-place'], true],
    ['place-navigation', 'compass', 'quick', 4, 3, { slug: PLACES, anchor: 'opening-a-place-in-a-map-app' }, ['read-place']],
    ['place-to-collection', 'bookmark', 'quick', 4, 3, { slug: 'Collections', anchor: 'setting-it-from-a-trip' }, ['select-places', 'place-detail'], true],
    // import-places-file used to sit here; with Tours on (every install since v5) the
    // places column no longer offers Import file, so the link would lead nowhere.
    ['place-track', 'route', 'guide', 5, 3, { slug: 'Map-Features', anchor: 'gpx-tracks' }, ['day-route', 'read-place'], true],
  ],
})
