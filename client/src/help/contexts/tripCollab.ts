import { defineScreen } from '../defineScreen'

/**
 * Help for the Collab tab of a trip: the group's chat, the shared notes and
 * links, the polls it decides with, and the list of what is coming up next.
 * A screen under `trip`; the step actions live in `e2e/help/trip-collab.guide.ts`.
 *
 * The order of the guides is the order the media run walks them in, and the
 * chat's delete step leaves a tombstone that cannot be taken back, so
 * `trip-chat` is last: no earlier picture can catch it.
 */

const RTC = 'Real-Time-Collaboration'
const CHAT = 'Collab-Chat'
const NOTES = 'Collab-Notes'
const POLLS = 'Collab-Polls'
const NEXT = 'Whats-Next-Widget'

export const { context: tripCollabContext, guides: tripCollabGuides } = defineScreen({
  id: 'trip-collab',
  parent: 'trip',
  route: '/trips/:id?tab=collab',
  icon: 'users',
  bullets: 6,
  docs: [{ slug: RTC }, { slug: CHAT }, { slug: NOTES }, { slug: POLLS }, { slug: NEXT }],
  guides: [
    ['write-note', 'pencil', 'guide', 6, 4, { slug: NOTES, anchor: 'creating-a-note' }, ['shared-links', 'trip-chat'], true],
    ['shared-links', 'link', 'guide', 4, 3, { slug: RTC, anchor: 'links' }, ['write-note'], true],
    ['create-poll', 'chart', 'guide', 6, 4, { slug: POLLS, anchor: 'creating-a-poll' }, ['vote-poll', 'close-poll'], true],
    ['vote-poll', 'thumbsUp', 'quick', 4, 2, { slug: POLLS, anchor: 'voting' }, ['create-poll', 'close-poll'], true],
    ['close-poll', 'lock', 'quick', 3, 2, { slug: POLLS, anchor: 'closing-a-poll-manually' }, ['create-poll', 'vote-poll']],
    ['whats-next', 'sparkles', 'quick', 3, 3, { slug: NEXT, anchor: 'what-it-shows' }, ['set-stop-times', 'read-day-plan']],
    ['trip-chat', 'messages', 'guide', 6, 4, { slug: CHAT, anchor: 'sending-messages' }, ['write-note', 'add-member'], true],
  ],
})
