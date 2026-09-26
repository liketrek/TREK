import { defineScreen } from '../defineScreen'

/**
 * Help for a trip (`/trips/:id`). The trip is a family of screens: this one is
 * the frame (the tabs, the three columns of the plan, the people in the trip),
 * the columns, the overlays and the other tabs each get their own screen under
 * it, anchored by the page for whatever is open. The step actions that produce
 * the pictures live in `e2e/help/trip.guide.ts`.
 */

const SHARING = 'Trip-Members-and-Sharing'
const PLANNER = 'Trip-Planner-Overview'

export const { context: tripContext, guides: tripGuides } = defineScreen({
  id: 'trip',
  route: '/trips/:id?tab=plan',
  icon: 'route',
  bullets: 6,
  docs: [{ slug: PLANNER }, { slug: SHARING }],
  guides: [
    ['add-member', 'userPlus', 'quick', 3, 2, { slug: SHARING, anchor: 'inviting-members' }, ['trip-invite-link', 'add-guest'], true],
    ['trip-invite-link', 'link', 'quick', 3, 2, { slug: SHARING, anchor: 'trip-invite-link' }, ['add-member', 'invite-links']],
    ['add-guest', 'userRound', 'quick', 2, 2, { slug: SHARING, anchor: 'guest-members' }, ['add-member'], true],
    ['public-link', 'share', 'quick', 3, 2, { slug: SHARING, anchor: 'public-share-link' }, ['add-member']],
    ['transfer-ownership', 'crown', 'quick', 2, 2, { slug: SHARING, anchor: 'transferring-ownership' }, ['add-member']],
    ['collapse-columns', 'panelLeft', 'quick', 3, 2, { slug: PLANNER, anchor: 'layout' }, []],
    ['undo-change', 'undo', 'quick', 1, 2, { slug: PLANNER, anchor: 'undo' }, []],
  ],
})
