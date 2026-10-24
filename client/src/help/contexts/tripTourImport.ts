import { defineScreen } from '../defineScreen';

/**
 * Help for getting tours into a trip from outside it: a GPX, KML or KMZ file
 * through the Import preview, reading an imported track, planning an editable
 * version of it and going back to the recorded track, taking a tour over from
 * another trip, and importing a trail from your own wanderer instance.
 * A screen under `trip-tour-planner` (the Tours tab); the step actions live in
 * `e2e/help/trip-tour-import.guide.ts`.
 */

const TOURS = 'Tours';
const FILES = { slug: TOURS, anchor: 'importing-gpx-kml-and-kmz-files' };

export const { context: tripTourImportContext, guides: tripTourImportGuides } = defineScreen({
  id: 'trip-tour-import',
  parent: 'trip-tour-planner',
  route: '/trips/:id?tab=tour-planner',
  icon: 'fileDown',
  bullets: 5,
  docs: [
    FILES,
    { slug: TOURS, anchor: 'taking-a-tour-over-from-another-trip' },
    { slug: TOURS, anchor: 'importing-a-trail-from-wanderer' },
  ],
  guides: [
    ['tour-import-gpx', 'fileDown', 'guide', 5, 5, FILES, ['tour-view-import', 'tour-import-plan-tab'], true],
    [
      'tour-view-import',
      'eye',
      'quick',
      3,
      3,
      { slug: TOURS, anchor: 'viewing-an-imported-track' },
      ['tour-plan-from-import', 'tour-add-to-day'],
    ],
    [
      'tour-plan-from-import',
      'route',
      'guide',
      4,
      4,
      { slug: TOURS, anchor: 'planning-an-editable-version-of-an-import' },
      ['tour-restore-recorded', 'tour-view-import'],
      true,
    ],
    [
      'tour-restore-recorded',
      'history',
      'quick',
      3,
      2,
      { slug: TOURS, anchor: 'going-back-to-the-recorded-track' },
      ['tour-plan-from-import'],
      true,
    ],
    [
      'tour-take-over',
      'copy',
      'guide',
      6,
      3,
      { slug: TOURS, anchor: 'taking-a-tour-over-from-another-trip' },
      ['tour-add-to-day', 'tour-import-gpx'],
      true,
    ],
    [
      'tour-import-wanderer',
      'download',
      'guide',
      4,
      4,
      { slug: TOURS, anchor: 'importing-a-trail-from-wanderer' },
      ['tour-connect-wanderer', 'tour-origin-check'],
      true,
    ],
  ],
});
