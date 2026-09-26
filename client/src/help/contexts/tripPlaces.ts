import { defineScreen } from '../defineScreen'

/**
 * Help for the places column of a trip's plan: bringing places in (by hand,
 * from a file, from a shared list), finding them, changing and deleting them.
 * A screen under `trip`; the step actions live in `e2e/help/trip-places.guide.ts`.
 */

const PLACES = 'Places-and-Search'
const IMPORT = { slug: PLACES, anchor: 'importing-multiple-places' }

export const { context: tripPlacesContext, guides: tripPlacesGuides } = defineScreen({
  id: 'trip-places',
  parent: 'trip',
  route: '/trips/:id?tab=plan',
  icon: 'mapPin',
  bullets: 6,
  docs: [{ slug: PLACES }, IMPORT],
  guides: [
    ['create-place', 'plus', 'guide', 5, 3, { slug: PLACES, anchor: 'adding-a-place' }, ['place-to-open-day', 'edit-place'], true],
    ['place-to-open-day', 'calendarCheck', 'quick', 4, 2, { slug: PLACES, anchor: 'the-open-day-steers-the-search' }, ['create-place', 'place-onto-day']],
    ['filter-places', 'filter', 'quick', 4, 2, { slug: PLACES, anchor: 'searching-for-a-place' }, ['select-places']],
    ['edit-place', 'pencil', 'quick', 3, 2, { slug: PLACES, anchor: 'place-fields' }, ['create-place', 'delete-place']],
    ['delete-place', 'trash', 'quick', 2, 2, { slug: PLACES }, ['edit-place', 'select-places', 'undo-change']],
    ['select-places', 'checkCircle', 'quick', 4, 2, { slug: PLACES }, ['filter-places', 'delete-place'], true],
    ['import-places-file', 'fileInput', 'guide', 4, 2, IMPORT, ['import-places-list', 'filter-places'], true],
    ['import-places-list', 'upload', 'quick', 3, 2, IMPORT, ['import-places-file']],
  ],
})
