import { defineScreen } from '../defineScreen';

/**
 * Help for the in-app notifications: the bell in the navbar with its panel of
 * the newest ten, and the full list at `/notifications`. Which events arrive
 * here and on which other channel is a matter of Settings > Notifications, so
 * the last guide only leads there and the channel guides are related. The
 * notices of the mail import and of flights followed live have a guide of
 * their own, since they are the ones that ask for an answer or a look.
 * The step actions live in `e2e/help/notifications.guide.ts`.
 */

const NOTIFICATIONS = 'Notifications';
const CENTER = { slug: NOTIFICATIONS, anchor: 'in-app-notification-center' };

export const { context: notificationsContext, guides: notificationsGuides } = defineScreen({
  id: 'notifications',
  route: '/notifications',
  icon: 'bell',
  bullets: 5,
  docs: [CENTER, { slug: NOTIFICATIONS, anchor: 'notification-events' }],
  guides: [
    ['read-notifications', 'bell', 'quick', 3, 2, CENTER, ['filter-notifications', 'mark-notifications-read']],
    ['filter-notifications', 'filter', 'quick', 3, 1, CENTER, ['read-notifications', 'mark-notifications-read'], true],
    [
      'mark-notifications-read',
      'checkCircle',
      'quick',
      2,
      2,
      CENTER,
      ['filter-notifications', 'delete-notifications'],
      true,
    ],
    ['delete-notifications', 'trash', 'quick', 2, 2, CENTER, ['mark-notifications-read']],
    // After the four on the list: its fixture adds a notification of its own and
    // takes it away again, so the pictures before it count what the seed left.
    [
      'booking-mail-notifications',
      'mailCheck',
      'quick',
      3,
      3,
      { slug: NOTIFICATIONS, anchor: 'notification-events' },
      ['forward-booking-mail', 'read-notifications', 'flight-live-status'],
    ],
    [
      'notification-settings',
      'sliders',
      'quick',
      3,
      2,
      { slug: NOTIFICATIONS, anchor: 'configuring-the-matrix' },
      ['notification-channels', 'web-push-device'],
    ],
  ],
});
