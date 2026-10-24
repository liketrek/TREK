import { defineScreen } from '../defineScreen';

/**
 * Help for bike tours on the Tours tab: the profile a bike tour is routed for
 * and its riding time, what the route rides on (the Surface and ways card),
 * and the trail grades of a mountain bike tour.
 * A screen under `trip-tour-planner`; the help anchor switches to it while a
 * bike tour is open in the editor. The step actions live in
 * `e2e/help/trip-tour-bike.guide.ts`.
 */

const TOURS = 'Tours';

export const { context: tripTourBikeContext, guides: tripTourBikeGuides } = defineScreen({
  id: 'trip-tour-bike',
  parent: 'trip-tour-planner',
  route: '/trips/:id?tab=tour-planner',
  icon: 'bike',
  bullets: 4,
  docs: [
    { slug: TOURS, anchor: 'bike-tour-profiles' },
    { slug: TOURS, anchor: 'bike-tour-surface-and-ways' },
  ],
  guides: [
    [
      'tour-bike-profile',
      'bike',
      'guide',
      6,
      5,
      { slug: TOURS, anchor: 'bike-tour-profiles' },
      ['tour-bike-surfaces', 'tour-draw-route'],
      true,
    ],
    [
      'tour-bike-surfaces',
      'layers',
      'guide',
      4,
      4,
      { slug: TOURS, anchor: 'bike-tour-surface-and-ways' },
      ['tour-bike-mtb-grades', 'tour-bike-profile'],
      true,
    ],
    [
      'tour-bike-mtb-grades',
      'mountain',
      'quick',
      3,
      4,
      { slug: TOURS, anchor: 'bike-tour-trail-grades' },
      ['tour-bike-surfaces', 'tour-bike-profile'],
      true,
    ],
  ],
});
