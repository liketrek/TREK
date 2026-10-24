import { defineScreen } from '../defineScreen';

/**
 * Help for horse rides on the Tours tab: a ride built from sections of the
 * signposted horse routes in the map view, a gap between two of them bridged
 * by hand, and a ride recorded on a GPS device kept as it was ridden.
 * A screen under `trip-tour-planner`; the help anchor switches to it while a
 * horse ride is open in the editor or a recorded ride is in view. The step
 * actions live in `e2e/help/trip-tour-horse.guide.ts`.
 */

const TOURS = 'Tours';
const ROUTES = { slug: TOURS, anchor: 'horse-ride-sections-of-horse-routes' };

export const { context: tripTourHorseContext, guides: tripTourHorseGuides } = defineScreen({
  id: 'trip-tour-horse',
  parent: 'trip-tour-planner',
  route: '/trips/:id?tab=tour-planner',
  icon: 'route',
  bullets: 5,
  docs: [
    ROUTES,
    { slug: TOURS, anchor: 'horse-ride-riding-access-and-time' },
    { slug: TOURS, anchor: 'horse-ride-recorded-rides' },
  ],
  guides: [
    ['tour-horse-plan', 'route', 'guide', 7, 5, ROUTES, ['tour-horse-gap', 'tour-horse-recorded'], true],
    [
      'tour-horse-gap',
      'spline',
      'quick',
      4,
      3,
      { slug: TOURS, anchor: 'horse-ride-gaps-and-manual-sections' },
      ['tour-horse-plan'],
      true,
    ],
    [
      'tour-horse-recorded',
      'upload',
      'guide',
      4,
      3,
      { slug: TOURS, anchor: 'horse-ride-recorded-rides' },
      ['tour-import-gpx', 'tour-horse-plan'],
      true,
    ],
  ],
});
