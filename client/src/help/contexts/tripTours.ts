import { defineScreen } from '../defineScreen';

/**
 * Help for the tours on the Plan tab: the right column switched from Places to
 * Tours. Reading the list, putting a tour on a day (the round +, a drag, the
 * stages question of a multi-day tour), its start and worked-out end in the day
 * plan, taking it off again, filtering the list, hiding lines on the map and
 * importing a GPX or KML file from here.
 * A screen under `trip`; the step actions live in `e2e/help/trip-tours.guide.ts`.
 */

const TOURS = 'Tours';

export const { context: tripToursContext, guides: tripToursGuides } = defineScreen({
  id: 'trip-tours',
  parent: 'trip-tour-planner',
  route: '/trips/:id?tab=plan',
  icon: 'mountain',
  bullets: 6,
  docs: [{ slug: TOURS }, { slug: TOURS, anchor: 'tours-on-the-plan-tab' }],
  guides: [
    [
      'tour-show-list',
      'mountain',
      'guide',
      5,
      3,
      { slug: TOURS, anchor: 'tours-on-the-plan-tab' },
      ['tour-add-to-day', 'tour-filter-list'],
    ],
    [
      'tour-add-to-day',
      'calendarCheck',
      'guide',
      5,
      4,
      { slug: TOURS, anchor: 'putting-a-tour-on-a-day' },
      ['tour-day-times', 'tour-remove-from-day', 'place-onto-day'],
      true,
    ],
    [
      'tour-day-times',
      'clock',
      'guide',
      4,
      4,
      { slug: TOURS, anchor: 'tour-times-in-the-day-plan' },
      ['tour-add-to-day', 'set-stop-times'],
      true,
    ],
    [
      'tour-remove-from-day',
      'minusCircle',
      'quick',
      3,
      2,
      { slug: TOURS, anchor: 'taking-a-tour-off-a-day' },
      ['tour-add-to-day', 'remove-from-day'],
    ],
    [
      'tour-filter-list',
      'filter',
      'quick',
      4,
      3,
      { slug: TOURS, anchor: 'filtering-the-tour-list' },
      ['tour-show-list', 'tour-hide-on-map'],
      true,
    ],
    [
      'tour-hide-on-map',
      'eye',
      'quick',
      3,
      2,
      { slug: TOURS, anchor: 'hiding-tours-on-the-map' },
      ['tour-filter-list', 'tour-show-list'],
    ],
    [
      'tour-import-plan-tab',
      'upload',
      'quick',
      3,
      2,
      { slug: TOURS, anchor: 'importing-tracks-on-the-plan-tab' },
      ['tour-show-list', 'tour-add-to-day'],
      true,
    ],
  ],
});
