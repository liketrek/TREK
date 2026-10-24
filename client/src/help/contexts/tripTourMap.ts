import { defineScreen } from '../defineScreen';

/**
 * Help for the map of the Tours tab: the layer pill at its bottom left (the
 * base maps a tour's type offers, the pistes and the seamarks laid over them,
 * 3D), the places found along a tour and taken in as stops, and the tour in
 * 3D with its grades and its flyover.
 * A screen under `trip-tour-planner`; the step actions live in
 * `e2e/help/trip-tour-map.guide.ts`.
 */

const TOURS = 'Tours';
const BASES = { slug: TOURS, anchor: 'tour-map-base-maps' };
const OVERLAYS = { slug: TOURS, anchor: 'tour-map-overlays' };
const ALONG = { slug: TOURS, anchor: 'tour-map-places-along-the-tour' };
const TERRAIN = { slug: TOURS, anchor: 'tour-map-3d-terrain-and-flyover' };

export const { context: tripTourMapContext, guides: tripTourMapGuides } = defineScreen({
  id: 'trip-tour-map',
  parent: 'trip-tour-planner',
  route: '/trips/:id?tab=tour-planner',
  icon: 'map',
  bullets: 5,
  docs: [{ slug: TOURS }],
  guides: [
    [
      'tour-map-layers',
      'layers',
      'quick',
      3,
      3,
      BASES,
      ['tour-map-overlays', 'tour-3d-terrain', 'tour-open-workspace'],
      true,
    ],
    ['tour-along-search', 'search', 'guide', 5, 3, ALONG, ['tour-along-add-stop', 'tour-open-workspace']],
    ['tour-along-add-stop', 'plus', 'guide', 4, 3, ALONG, ['tour-along-search', 'tour-summary-profile'], true],
    ['tour-3d-terrain', 'rotate3d', 'guide', 5, 3, TERRAIN, ['tour-3d-flyover', 'tour-map-layers']],
    // Step 1 comes as a loop as well: the camera flying along the route is the point of it.
    ['tour-3d-flyover', 'route', 'guide', 4, 3, TERRAIN, ['tour-3d-terrain', 'tour-summary-profile'], false, [1]],
    ['tour-map-overlays', 'mountainSnow', 'guide', 4, 3, OVERLAYS, ['tour-map-layers', 'tour-3d-terrain']],
  ],
});
