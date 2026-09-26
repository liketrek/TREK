import { defineScreen } from '../defineScreen'

/**
 * Help for the Bookings tab of a trip: the places to stay, the tables, the
 * tickets and everything else that was booked, what a card says about one, how
 * one is made by hand or read out of the confirmation that arrived, and how it
 * is tied to the plan, to a document and to a cost. Flights, trains and the
 * other ways of getting about belong to the Transports tab and never show here.
 * A screen under `trip`; the step actions live in `e2e/help/trip-bookings.guide.ts`.
 */

const BOOKINGS = 'Reservations-and-Bookings'
const CREATE = { slug: BOOKINGS, anchor: 'creating-a-reservation' }
const SECTIONS = { slug: BOOKINGS, anchor: 'pending-and-confirmed' }
const CHANGE = { slug: BOOKINGS, anchor: 'editing-and-deleting' }
const IMPORT = { slug: BOOKINGS, anchor: 'import-from-booking-confirmation' }

export const { context: tripBookingsContext, guides: tripBookingsGuides } = defineScreen({
  id: 'trip-bookings',
  parent: 'trip',
  route: '/trips/:id?tab=buchungen',
  icon: 'ticket',
  bullets: 6,
  docs: [{ slug: BOOKINGS }, IMPORT, { slug: 'Accommodations' }],
  guides: [
    ['create-booking', 'plus', 'guide', 6, 3, CREATE, ['booking-hotel', 'link-booking', 'edit-booking', 'add-transport'], true],
    ['booking-hotel', 'building', 'guide', 5, 3, { slug: 'Accommodations', anchor: 'creating-an-accommodation' }, ['create-booking', 'delete-booking', 'add-accommodation'], true],
    ['link-booking', 'link', 'quick', 4, 2, CREATE, ['create-booking', 'bookings-in-plan', 'day-bookings', 'place-booking']],
    ['booking-travelers', 'users', 'quick', 4, 2, SECTIONS, ['filter-bookings', 'add-member'], true],
    ['booking-files', 'folder', 'guide', 4, 3, { slug: 'Documents-and-Files', anchor: 'linking-files-to-places-reservations-or-assignments' }, ['create-booking', 'import-booking-file', 'files-link']],
    ['booking-cost', 'coins', 'guide', 5, 3, { slug: 'Budget-Tracking', anchor: 'expenses-linked-to-a-booking-or-a-place' }, ['create-booking', 'edit-booking', 'expense-from-booking'], true],
    ['filter-bookings', 'filter', 'quick', 5, 2, SECTIONS, ['booking-travelers', 'edit-booking']],
    ['import-booking-file', 'fileInput', 'guide', 5, 3, IMPORT, ['booking-files', 'create-booking', 'import-transport-file'], true],
    ['edit-booking', 'pencil', 'quick', 4, 3, CHANGE, ['create-booking', 'delete-booking']],
    ['delete-booking', 'trash', 'quick', 3, 2, CHANGE, ['edit-booking', 'booking-hotel']],
  ],
})
