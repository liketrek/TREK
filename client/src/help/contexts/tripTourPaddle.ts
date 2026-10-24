import { defineScreen } from '../defineScreen';

/**
 * Help for paddle tours on the Tours tab: what a kayak, canoe or SUP tour
 * asks for (boat, water, lake style, speed), its legs on the water and the
 * ones TREK could not plan, carrying the boat round an obstacle, locks and
 * their times, the time estimate, the wind on the day, the obstacle
 * checklist with the safety note, and portages and locks marked on a
 * recorded paddle track.
 * A screen under `trip-tour-planner`; the help anchor switches to it while a
 * paddle tour is open in the editor or a recorded paddle track is in view.
 * The step actions live in `e2e/help/trip-tour-paddle.guide.ts`.
 */

const TOURS = 'Tours';
const doc = (anchor: string) => ({ slug: TOURS, anchor });

export const { context: tripTourPaddleContext, guides: tripTourPaddleGuides } = defineScreen({
  id: 'trip-tour-paddle',
  parent: 'trip-tour-planner',
  route: '/trips/:id?tab=tour-planner',
  icon: 'waves',
  bullets: 6,
  docs: [doc('paddle-tours'), doc('paddle-water-data'), doc('paddle-safety')],
  guides: [
    [
      'tour-paddle-setup',
      'sliders',
      'guide',
      7,
      4,
      doc('paddle-tour-settings'),
      ['tour-paddle-water-route', 'tour-paddle-time'],
      true,
    ],
    [
      'tour-paddle-water-route',
      'route',
      'guide',
      5,
      4,
      doc('paddle-legs-on-the-water'),
      ['tour-paddle-setup', 'tour-paddle-portage'],
    ],
    [
      'tour-paddle-portage',
      'map',
      'guide',
      5,
      3,
      doc('paddle-portages'),
      ['tour-paddle-lock', 'tour-paddle-time'],
      true,
    ],
    ['tour-paddle-lock', 'lock', 'quick', 4, 3, doc('paddle-locks'), ['tour-paddle-portage', 'tour-paddle-time'], true],
    [
      'tour-paddle-time',
      'clock',
      'guide',
      5,
      3,
      doc('paddle-time-estimate'),
      ['tour-paddle-portage', 'tour-paddle-lock'],
      true,
    ],
    [
      'tour-paddle-wind',
      'wind',
      'quick',
      4,
      4,
      doc('paddle-wind-forecast'),
      ['tour-paddle-setup', 'tour-paddle-checklist'],
      true,
    ],
    [
      'tour-paddle-checklist',
      'listChecks',
      'guide',
      5,
      5,
      doc('paddle-obstacle-checklist'),
      ['tour-paddle-portage', 'tour-paddle-wind'],
    ],
    [
      'tour-paddle-track-marks',
      'fileInput',
      'guide',
      7,
      3,
      doc('recorded-paddle-tracks'),
      ['tour-import-gpx', 'tour-paddle-time'],
      true,
    ],
  ],
});
