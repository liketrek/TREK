import { defineScreen } from '../defineScreen';

/**
 * Help for a trip's Tours tab, the tour planner: the editor on the left, the
 * trip's tours on the right and the map between them. Drawing a route point
 * by point, what the tour is, moving and steering its points, round trips,
 * legs drawn by hand, the trip's places as stops, the details and the planned
 * time, saving and changing a tour, a save that meets a newer one, the summary
 * with its elevation profile, the list of the trip's tours and deleting one.
 * The type-specific cards, imports, the map's layers and multi-day stages have
 * screens of their own under this one.
 * A screen under `trip`; the step actions live in `e2e/help/trip-tour-planner.guide.ts`.
 */

const TOURS = 'Tours';
const doc = (anchor: string) => ({ slug: TOURS, anchor });

export const { context: tripTourPlannerContext, guides: tripTourPlannerGuides } = defineScreen({
  id: 'trip-tour-planner',
  // A screen of its own in the switcher, not under the trip: everything about tours
  // sits one level below it, and the switcher shows two levels at most.
  route: '/trips/:id?tab=tour-planner',
  icon: 'mountain',
  bullets: 6,
  docs: [doc('the-tours-tab'), doc('drawing-a-tour'), doc('saving-a-tour')],
  guides: [
    [
      'tour-open-workspace',
      'layout',
      'guide',
      7,
      3,
      doc('the-tours-tab'),
      ['tour-draw-route', 'tour-show-list', 'tour-map-layers'],
    ],
    // Step 5 comes as a loop as well: the points clicked onto the map one by one, the route following.
    [
      'tour-draw-route',
      'route',
      'guide',
      6,
      4,
      doc('drawing-a-tour'),
      ['tour-save', 'tour-edit-points', 'tour-hike-plan'],
      true,
      [5],
    ],
    [
      'tour-type-profile',
      'sliders',
      'guide',
      4,
      2,
      doc('tour-types'),
      ['tour-bike-profile', 'tour-hike-plan', 'tour-run-plan'],
    ],
    [
      'tour-edit-points',
      'mapPin',
      'guide',
      6,
      2,
      doc('moving-ordering-and-removing-points'),
      ['tour-shaping-points', 'tour-draw-route'],
    ],
    // Step 2 comes as a loop as well: the dot dragged off the line, the route following it.
    [
      'tour-shaping-points',
      'route',
      'guide',
      4,
      3,
      doc('shaping-points'),
      ['tour-edit-points', 'tour-leg-by-hand'],
      false,
      [2],
    ],
    [
      'tour-loop-reverse',
      'repeat',
      'quick',
      3,
      3,
      doc('round-trips-and-reversing-a-tour'),
      ['tour-hike-round', 'tour-edit-points'],
    ],
    [
      'tour-leg-by-hand',
      'pencil',
      'guide',
      4,
      2,
      doc('legs-drawn-by-hand'),
      ['tour-shaping-points', 'tour-hike-compare-ways'],
    ],
    [
      'tour-trip-places',
      'mapPin',
      'quick',
      4,
      3,
      doc('trip-places-as-stops'),
      ['tour-draw-route', 'tour-along-add-stop'],
    ],
    [
      'tour-details-times',
      'clock',
      'guide',
      4,
      3,
      doc('name-details-and-planned-time'),
      ['tour-save', 'tour-summary-profile', 'tour-day-times'],
    ],
    ['tour-save', 'checkCircle', 'quick', 4, 3, doc('saving-a-tour'), ['tour-edit-saved', 'tour-add-to-day'], true],
    [
      'tour-edit-saved',
      'pencil',
      'guide',
      4,
      3,
      doc('changing-a-saved-tour'),
      ['tour-saved-elsewhere', 'tour-view-import'],
    ],
    [
      'tour-summary-profile',
      'chart',
      'quick',
      4,
      3,
      doc('tour-summary-and-elevation-profile'),
      ['tour-details-times', 'tour-map-layers'],
    ],
    [
      'tour-list-manage',
      'listChecks',
      'guide',
      5,
      3,
      doc('tours-of-this-trip'),
      ['tour-filter-list', 'tour-add-to-day', 'tour-delete'],
      true,
    ],
    ['tour-delete', 'trash', 'quick', 2, 3, doc('deleting-a-tour'), ['tour-list-manage', 'tour-remove-from-day']],
    [
      'tour-saved-elsewhere',
      'users',
      'guide',
      4,
      2,
      doc('when-a-tour-was-saved-elsewhere'),
      ['tour-edit-saved', 'tour-save'],
    ],
  ],
});
