import { defineScreen } from '../defineScreen';

/**
 * Help for Ski & winter tours on the Tours tab: planning one along the mapped
 * runs, lifts and trails, telling the piste router how you ski, fixing a leg it
 * could not plan, reading the Piste route card, the pistes layer and its key,
 * and importing a recorded ski track with its discipline.
 * A screen under `trip-tour-planner`; the step actions live in
 * `e2e/help/trip-tour-ski.guide.ts`.
 */

const TOURS = 'Tours';

export const { context: tripTourSkiContext, guides: tripTourSkiGuides } = defineScreen({
  id: 'trip-tour-ski',
  parent: 'trip-tour-planner',
  route: '/trips/:id?tab=tour-planner',
  icon: 'mountainSnow',
  bullets: 5,
  docs: [
    { slug: TOURS, anchor: 'ski-and-winter-tours' },
    { slug: TOURS, anchor: 'ski-data-and-its-limits' },
  ],
  guides: [
    [
      'tour-ski-plan',
      'route',
      'guide',
      6,
      4,
      { slug: TOURS, anchor: 'ski-and-winter-tours' },
      ['tour-ski-options', 'tour-ski-summary'],
      true,
    ],
    [
      'tour-ski-options',
      'cableCar',
      'guide',
      5,
      3,
      { slug: TOURS, anchor: 'ski-piste-router-options' },
      ['tour-ski-plan', 'tour-ski-fix-leg'],
    ],
    [
      'tour-ski-fix-leg',
      'pencil',
      'quick',
      3,
      4,
      { slug: TOURS, anchor: 'ski-legs-that-could-not-be-planned' },
      ['tour-ski-options', 'tour-ski-plan'],
    ],
    [
      'tour-ski-summary',
      'chart',
      'quick',
      3,
      4,
      { slug: TOURS, anchor: 'ski-piste-route-summary' },
      ['tour-ski-plan', 'tour-ski-fix-leg'],
      true,
    ],
    [
      'tour-ski-pistes-layer',
      'mountainSnow',
      'quick',
      3,
      3,
      { slug: TOURS, anchor: 'ski-pistes-map-layer' },
      ['tour-ski-plan'],
    ],
    [
      'tour-ski-import',
      'upload',
      'guide',
      6,
      3,
      { slug: TOURS, anchor: 'importing-ski-tracks' },
      ['tour-ski-plan', 'tour-ski-summary'],
      true,
    ],
  ],
});
