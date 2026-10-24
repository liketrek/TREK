import { defineScreen } from '../defineScreen';

/**
 * Help for the city walk in the Tours tab: planning a walk from stop to stop
 * with how long you stay at each, sights along the way, the arrivals and
 * opening hours on the walk's day, a walk read from a Google Maps link, and
 * checking the stops off on the day from the Plan tab.
 * A screen under `trip-tour-planner`; the help anchor switches to it while a
 * city walk is open in the editor. The step actions live in
 * `e2e/help/trip-tour-walk.guide.ts`.
 */

const TOURS = 'Tours';

export const { context: tripTourWalkContext, guides: tripTourWalkGuides } = defineScreen({
  id: 'trip-tour-walk',
  parent: 'trip-tour-planner',
  route: '/trips/:id?tab=tour-planner',
  icon: 'footprints',
  bullets: 5,
  docs: [
    { slug: TOURS, anchor: 'city-walks' },
    { slug: TOURS, anchor: 'city-walk-ferry-crossings' },
  ],
  guides: [
    [
      'tour-walk-plan',
      'footprints',
      'guide',
      6,
      3,
      { slug: TOURS, anchor: 'city-walk-stops-and-stays' },
      ['tour-walk-day-times', 'tour-walk-sights'],
      true,
    ],
    [
      'tour-walk-sights',
      'sparkles',
      'guide',
      5,
      3,
      { slug: TOURS, anchor: 'city-walk-sights-along-the-way' },
      ['tour-walk-plan'],
      true,
    ],
    [
      'tour-walk-day-times',
      'clock',
      'guide',
      4,
      4,
      { slug: TOURS, anchor: 'city-walk-times-and-opening-hours' },
      ['tour-walk-check-off', 'tour-walk-plan'],
    ],
    [
      'tour-walk-google-import',
      'link',
      'guide',
      4,
      3,
      { slug: TOURS, anchor: 'city-walk-from-google-maps' },
      ['tour-walk-plan'],
      true,
    ],
    [
      'tour-walk-check-off',
      'checkCircle',
      'guide',
      4,
      3,
      { slug: TOURS, anchor: 'checking-off-a-city-walk' },
      ['tour-walk-day-times'],
      true,
    ],
  ],
});
