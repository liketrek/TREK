import { defineScreen } from '../defineScreen'

/**
 * Help for the days column of a trip's plan: the day cards, the stops on them,
 * their order and times, notes, the day's route, and everything that leaves
 * the plan (PDF, calendar, GPX). Bookings and transports show up here too, so
 * one guide reads them and points at the screens that create them.
 * A screen under `trip`; the step actions live in `e2e/help/trip-days.guide.ts`.
 */

const DAYS = 'Day-Plans-and-Notes'
const MAP = 'Map-Features'

export const { context: tripDaysContext, guides: tripDaysGuides } = defineScreen({
  id: 'trip-days',
  parent: 'trip',
  route: '/trips/:id?tab=plan',
  icon: 'calendarDays',
  bullets: 7,
  docs: [{ slug: DAYS }, { slug: MAP }],
  guides: [
    ['read-day-plan', 'eye', 'guide', 5, 2, { slug: DAYS, anchor: 'day-timeline' }, ['bookings-in-plan', 'day-route']],
    ['place-onto-day', 'calendarCheck', 'guide', 4, 3, { slug: DAYS, anchor: 'assigning-places-to-a-day' }, ['place-to-open-day', 'reorder-stops', 'undo-change'], true],
    ['reorder-stops', 'repeat', 'quick', 4, 2, { slug: DAYS, anchor: 'assigning-places-to-a-day' }, ['place-onto-day', 'set-stop-times', 'lock-stop']],
    ['set-stop-times', 'clock', 'quick', 3, 3, { slug: DAYS, anchor: 'day-timeline' }, ['reorder-stops', 'edit-place']],
    ['remove-from-day', 'minusCircle', 'quick', 2, 2, { slug: DAYS, anchor: 'assigning-places-to-a-day' }, ['delete-place', 'leave-stop-off-route', 'undo-change']],
    ['leave-stop-off-route', 'routeOff', 'quick', 3, 2, { slug: DAYS, anchor: 'leaving-a-stop-out-of-the-route' }, ['day-route', 'remove-from-day']],
    ['lock-stop', 'lock', 'quick', 2, 2, { slug: DAYS, anchor: 'toolbar-actions' }, ['day-route', 'reorder-stops']],
    ['day-note', 'pencil', 'quick', 4, 2, { slug: DAYS, anchor: 'day-notes' }, ['read-day-plan'], true],
    ['day-route', 'route', 'guide', 5, 4, { slug: MAP, anchor: 'route-lines' }, ['lock-stop', 'leave-stop-off-route', 'read-day-plan']],
    ['manage-days', 'calendarDays', 'quick', 5, 2, { slug: DAYS, anchor: 'the-day-plan-sidebar' }, ['edit-trip']],
    ['bookings-in-plan', 'ticket', 'guide', 5, 2, { slug: DAYS, anchor: 'multi-day-reservations' }, ['move-booking-day', 'read-day-plan']],
    ['move-booking-day', 'moveRight', 'quick', 3, 2, { slug: DAYS, anchor: 'assigning-places-to-a-day' }, ['bookings-in-plan', 'reorder-stops']],
    ['export-plan', 'download', 'quick', 4, 3, { slug: MAP, anchor: 'exporting-a-trip-as-gpx' }, ['calendar-feed']],
    ['clear-day', 'minusCircle', 'quick', 2, 2, { slug: DAYS, anchor: 'clearing-a-day' }, ['remove-from-day', 'manage-days'], true],
  ],
})
