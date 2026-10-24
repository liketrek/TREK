import { defineScreen } from '../defineScreen'

/**
 * Help for the places column of a trip's plan: bringing places in (by search,
 * by hand, from a shared list, from a file where Tours is off, from the stays
 * Dawarich recorded), finding them, changing and deleting them.
 * A screen under `trip`; the step actions live in `e2e/help/trip-places.guide.ts`.
 */

const PLACES = 'Places-and-Search'
const IMPORT = { slug: PLACES, anchor: 'importing-multiple-places' }

export const { context: tripPlacesContext, guides: tripPlacesGuides } = defineScreen({
  id: 'trip-places',
  parent: 'trip',
  route: '/trips/:id?tab=plan',
  icon: 'mapPin',
  bullets: 8,
  docs: [{ slug: PLACES }, IMPORT],
  guides: [
    ['create-place', 'plus', 'guide', 5, 4, { slug: PLACES, anchor: 'adding-a-place' }, ['place-to-open-day', 'edit-place'], true],
    ['place-to-open-day', 'calendarCheck', 'quick', 4, 2, { slug: PLACES, anchor: 'the-open-day-steers-the-search' }, ['create-place', 'place-onto-day']],
    ['filter-places', 'filter', 'quick', 5, 2, { slug: PLACES, anchor: 'the-places-column' }, ['select-places', 'sort-places']],
    ['edit-place', 'pencil', 'quick', 3, 3, { slug: PLACES, anchor: 'place-fields' }, ['create-place', 'delete-place']],
    ['delete-place', 'trash', 'quick', 2, 2, { slug: PLACES }, ['edit-place', 'select-places', 'undo-change']],
    ['select-places', 'checkCircle', 'quick', 4, 2, { slug: PLACES, anchor: 'selecting-several-places' }, ['filter-places', 'delete-place'], true],
    ['import-places-list', 'upload', 'quick', 3, 2, IMPORT, ['import-places-file', 'create-place']],
    ['import-places-file', 'fileInput', 'guide', 4, 3, IMPORT, ['import-places-list', 'filter-places'], true],
    ['sort-places', 'filter', 'quick', 2, 2, { slug: PLACES, anchor: 'the-places-column' }, ['filter-places']],
    ['place-by-hand', 'pencil', 'guide', 5, 2, { slug: PLACES, anchor: 'phone-e-mail-and-opening-hours' }, ['create-place', 'edit-place'], true],
    ['dawarich-stays', 'footprints', 'guide', 4, 2, { slug: 'Dawarich', anchor: 'reviewing-stays-in-the-trip-planner' }, ['map-dawarich-trail', 'create-place'], true],
  ],
})
