import { defineScreen } from '../defineScreen';

/**
 * Help for hikes and runs in the Tours tab: planning a hike within the
 * difficulty you allow, reading what OpenStreetMap records along it, a round
 * hike of a wished length, other ways for one section, a via ferrata as part
 * of the route, and a run planned at your own pace with what it runs on.
 * Hike and run share the screen because both show the Trail details card.
 * A screen under `trip-tour-planner`; the step actions live in
 * `e2e/help/trip-tour-hike.guide.ts`.
 */

const TOURS = 'Tours';

export const { context: tripTourHikeContext, guides: tripTourHikeGuides } = defineScreen({
  id: 'trip-tour-hike',
  parent: 'trip-tour-planner',
  route: '/trips/:id?tab=tour-planner',
  icon: 'mountain',
  bullets: 6,
  docs: [
    { slug: TOURS, anchor: 'hikes' },
    { slug: TOURS, anchor: 'runs-and-pace' },
  ],
  guides: [
    [
      'tour-hike-plan',
      'mountain',
      'guide',
      6,
      4,
      { slug: TOURS, anchor: 'hikes' },
      ['tour-hike-trail-details', 'tour-hike-round'],
      true,
    ],
    [
      'tour-hike-trail-details',
      'footprints',
      'guide',
      5,
      3,
      { slug: TOURS, anchor: 'hike-trail-details' },
      ['tour-hike-plan', 'tour-run-ways'],
      true,
    ],
    [
      'tour-hike-round',
      'repeat',
      'guide',
      5,
      3,
      { slug: TOURS, anchor: 'round-hikes' },
      ['tour-hike-compare-ways', 'tour-hike-plan'],
      true,
    ],
    [
      'tour-hike-compare-ways',
      'shuffle',
      'guide',
      4,
      3,
      { slug: TOURS, anchor: 'other-ways-for-a-hike-section' },
      ['tour-hike-round', 'tour-hike-trail-details'],
      true,
    ],
    [
      'tour-ferrata-add',
      'flag',
      'guide',
      5,
      4,
      { slug: TOURS, anchor: 'via-ferratas-on-a-hike' },
      ['tour-hike-plan', 'tour-hike-trail-details'],
      true,
    ],
    [
      'tour-run-plan',
      'clock',
      'guide',
      5,
      4,
      { slug: TOURS, anchor: 'runs-and-pace' },
      ['tour-run-ways', 'tour-hike-plan'],
      true,
    ],
    [
      'tour-run-ways',
      'tags',
      'quick',
      3,
      2,
      { slug: TOURS, anchor: 'what-a-run-runs-on' },
      ['tour-run-plan', 'tour-hike-trail-details'],
      true,
    ],
  ],
});
