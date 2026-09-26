import { defineScreen } from '../defineScreen'

/**
 * Help for the day details panel of a trip's plan: the panel a day header
 * opens over the map, with the day's name and date, the weather where you
 * will be, the bookings that fall on the day and the nights booked for it.
 * A screen under `trip`; the step actions live in `e2e/help/trip-day-detail.guide.ts`.
 */

const DAYS = 'Day-Plans-and-Notes'
const STAY = 'Accommodations'
const WEATHER = 'Weather-Forecasts'
const PANEL = { slug: DAYS, anchor: 'day-detail-panel' }
const IN_PANEL = { slug: STAY, anchor: 'in-the-day-detail-panel' }

export const { context: tripDayDetailContext, guides: tripDayDetailGuides } = defineScreen({
  id: 'trip-day-detail',
  parent: 'trip',
  route: '/trips/:id?tab=plan',
  icon: 'panelRight',
  bullets: 6,
  docs: [PANEL, IN_PANEL, { slug: WEATHER }],
  guides: [
    ['day-panel', 'panelRight', 'guide', 6, 2, PANEL, ['day-weather', 'day-bookings', 'read-day-plan'], true],
    ['day-weather', 'eye', 'quick', 4, 3, { slug: WEATHER, anchor: 'what-is-shown' }, ['day-panel', 'read-day-plan']],
    ['rename-day', 'tags', 'quick', 4, 2, PANEL, ['manage-days', 'day-note'], true],
    ['add-accommodation', 'building', 'guide', 6, 3, { slug: STAY, anchor: 'creating-an-accommodation' }, ['create-place', 'edit-accommodation', 'booking-hotel'], true],
    ['edit-accommodation', 'pencil', 'guide', 5, 2, IN_PANEL, ['add-accommodation', 'day-bookings']],
    ['day-bookings', 'ticket', 'quick', 4, 2, { slug: DAYS, anchor: 'multi-day-reservations' }, ['bookings-in-plan', 'create-booking', 'add-accommodation']],
  ],
})
