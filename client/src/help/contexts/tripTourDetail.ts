import { defineScreen } from '../defineScreen';

/**
 * Help for the card a tour opens over the map on the Plan tab: reading it,
 * renaming it and giving its line a colour, taking it along (map app, its web
 * page, a GPX file), copying it or keeping it in a collection, the packing
 * list it points at, its files, the track it was actually done with and how
 * that compares with the plan, and where it came from. The route itself is
 * changed in the Tours tab, which has screens of its own.
 * A screen under `trip-tours`; the step actions live in `e2e/help/trip-tour-detail.guide.ts`.
 */

const TOURS = 'Tours';
const CARD = { slug: TOURS, anchor: 'tour-card' };

export const { context: tripTourDetailContext, guides: tripTourDetailGuides } = defineScreen({
  id: 'trip-tour-detail',
  parent: 'trip-tour-planner',
  route: '/trips/:id?tab=plan',
  icon: 'mountain',
  bullets: 5,
  docs: [CARD, { slug: TOURS }],
  guides: [
    ['tour-detail-read', 'eye', 'guide', 7, 5, CARD, ['tour-show-list', 'tour-take-along', 'tour-rename-colour']],
    [
      'tour-rename-colour',
      'palette',
      'quick',
      4,
      2,
      { slug: TOURS, anchor: 'tour-card-name-and-colour' },
      ['tour-detail-read', 'tour-hide-on-map'],
      true,
    ],
    [
      'tour-take-along',
      'download',
      'quick',
      3,
      4,
      { slug: TOURS, anchor: 'tour-card-taking-a-tour-along' },
      ['tour-detail-read', 'place-navigation'],
    ],
    [
      'tour-copy-keep',
      'bookmark',
      'guide',
      4,
      4,
      { slug: TOURS, anchor: 'tour-card-copies-and-collections' },
      ['tour-collection-add-to-trip', 'tour-edit-saved'],
      true,
    ],
    [
      'tour-packing-link',
      'backpack',
      'guide',
      5,
      3,
      { slug: TOURS, anchor: 'tour-card-packing-list' },
      ['tour-detail-read'],
      true,
    ],
    ['tour-files', 'folder', 'quick', 3, 2, { slug: TOURS, anchor: 'tour-card-files' }, ['place-files'], true],
    [
      'tour-activity-link',
      'link',
      'guide',
      5,
      3,
      { slug: TOURS, anchor: 'tour-card-actual-tracks' },
      ['tour-activity-compare', 'tour-import-gpx'],
      true,
    ],
    [
      'tour-activity-compare',
      'chart',
      'guide',
      4,
      2,
      { slug: TOURS, anchor: 'tour-card-actual-tracks' },
      ['tour-activity-link'],
      true,
    ],
    [
      'tour-origin-check',
      'fileDown',
      'quick',
      3,
      3,
      { slug: TOURS, anchor: 'tour-card-origin' },
      ['tour-detail-read', 'tour-import-gpx'],
    ],
  ],
});
