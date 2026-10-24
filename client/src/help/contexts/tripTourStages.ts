import { defineScreen } from '../defineScreen';

/**
 * Help for multi-day tours on the Tours tab: one route cut into stages, a
 * stage end on a stop, the stages in the tour summary, and putting the stages
 * on the trip's days from Tours of this trip.
 * A screen under `trip-tour-planner`; the step actions live in
 * `e2e/help/trip-tour-stages.guide.ts`.
 */

const TOURS = 'Tours';

export const { context: tripTourStagesContext, guides: tripTourStagesGuides } = defineScreen({
  id: 'trip-tour-stages',
  parent: 'trip-tour-planner',
  route: '/trips/:id?tab=tour-planner',
  icon: 'moon',
  bullets: 5,
  docs: [
    { slug: TOURS, anchor: 'multi-day-tours' },
    { slug: TOURS, anchor: 'multi-day-tours-on-the-trip-days' },
  ],
  guides: [
    ['tour-multi-day', 'moon', 'guide', 6, 4, { slug: TOURS, anchor: 'multi-day-tours' }, ['tour-stages-on-days']],
    [
      'tour-stages-on-days',
      'calendarRange',
      'guide',
      6,
      4,
      { slug: TOURS, anchor: 'multi-day-tours-on-the-trip-days' },
      ['tour-multi-day'],
      true,
    ],
  ],
});
