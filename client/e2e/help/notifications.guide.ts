import { expect, test, type Locator, type Page } from '@playwright/test';
import { notificationsContext, notificationsGuides } from '../../src/help/contexts/notifications';
import type { HelpGuide } from '../../src/help/types';
import { clearNotices } from '../screenshots/shot';
import {
  BOOKING_TITLE,
  ensureNotificationFixtures,
  markUnread,
  removeNotificationFixtures,
  SHARE_TITLE,
  unreadIds,
} from './fixtures-notifications';
import { captureGuide, captureHero, dismissReleaseNotice, settle, VIEWPORT, type GuideScript } from './guide';

/**
 * Actions for the notification guides, keyed by the ids in
 * `src/help/contexts/notifications.ts`. The admin's inbox holds the seed's
 * "New Message" notifications from the Japan trip's chat plus the two
 * `fixtures-notifications.ts` adds: jonas saved a booking, mira shared her
 * Vacay calendar. A guide that reads or deletes one of those gets it back
 * unread in its cleanup, and the file ends by taking both away, so the bell
 * every later picture shows counts what the seed left.
 *
 * Delete all is ringed but never clicked: it would also empty the seed's
 * notifications, and the bell of every later screen would lose its number.
 */

const guide = (id: string): HelpGuide => {
  const g = notificationsGuides.find((x) => x.id === id);
  if (!g) throw new Error(`no registered guide "${id}"`);
  return g;
};

/**
 * The bell in the navbar. Found by its title: with unread notifications its
 * accessible name is the number on its badge, not "Notifications".
 */
const bell = (page: Page): Locator => page.getByTitle('Notifications', { exact: true }).first();
/** The panel the bell opens, found through its footer button. */
const panel = (page: Page): Locator => page.getByRole('button', { name: 'Show all notifications' }).locator('xpath=..');
/** The column of the /notifications page: header, filter pills and the list. */
const pageColumn = (page: Page): Locator => page.locator('.max-w-2xl').first();
/** One notification (InAppNotificationItem's root) by its title, in the panel or the page. */
const item = (scope: Locator, title: string): Locator =>
  scope.locator('div.relative.px-4.py-3').filter({ hasText: title }).first();
/** The user menu button at the top right: avatar, name and chevron. */
const userMenu = (page: Page): Locator =>
  page
    .getByRole('button')
    .filter({ has: page.locator('span.max-w-40') })
    .first();
/** The Settings sidebar, found by its first tab. */
const settingsSidebar = (page: Page): Locator =>
  page
    .locator('nav')
    .filter({ has: page.getByRole('button', { name: 'General' }) })
    .first();

async function openDashboard(page: Page): Promise<void> {
  await page.goto('/dashboard');
  await clearNotices(page);
  await dismissReleaseNotice(page);
  await expect(bell(page)).toBeVisible();
  await settle(page);
}

async function openNotifications(page: Page): Promise<void> {
  await page.goto('/notifications');
  await clearNotices(page);
  await dismissReleaseNotice(page);
  await expect(item(pageColumn(page), SHARE_TITLE)).toBeVisible();
  await settle(page);
}

async function openBell(page: Page): Promise<void> {
  await bell(page).click();
  await expect(item(panel(page), SHARE_TITLE)).toBeVisible();
  await settle(page);
}

/** The unread ones the mark-read guide found, to give back in its cleanup. */
let unreadBefore: number[] = [];

const SCRIPTS: Record<string, GuideScript> = {
  'read-notifications': {
    guide: guide('read-notifications'),
    start: openDashboard,
    steps: [
      { target: bell, act: openBell },
      {
        target: panel,
        // Over the newest one, so its unread tint is not covered by the pointer.
        hover: async (p) => {
          await item(panel(p), SHARE_TITLE).hover();
        },
      },
      {
        target: (p) => item(panel(p), SHARE_TITLE).getByRole('button', { name: 'View Vacay' }),
        act: async (p) => {
          await item(panel(p), SHARE_TITLE).getByRole('button', { name: 'View Vacay' }).click();
          await expect(p).toHaveURL(/\/vacay/);
          await settle(p);
        },
      },
    ],
    // Following the share marked it read; the next guide wants it unread.
    cleanup: async (p) => {
      await ensureNotificationFixtures(p.request);
    },
  },

  'filter-notifications': {
    guide: guide('filter-notifications'),
    start: openDashboard,
    steps: [
      { target: bell, act: openBell },
      {
        target: (p) => p.getByRole('button', { name: 'Show all notifications' }),
        act: async (p) => {
          await p.getByRole('button', { name: 'Show all notifications' }).click();
          await expect(p).toHaveURL(/\/notifications/);
          await expect(item(pageColumn(p), SHARE_TITLE)).toBeVisible();
          await settle(p);
        },
      },
      {
        target: (p) => pageColumn(p).getByRole('button', { name: 'Unread', exact: true }),
        act: async (p) => {
          await pageColumn(p).getByRole('button', { name: 'Unread', exact: true }).click();
          await settle(p);
        },
      },
    ],
  },

  'mark-notifications-read': {
    guide: guide('mark-notifications-read'),
    start: async (p) => {
      unreadBefore = await unreadIds(p.request);
      await openNotifications(p);
    },
    steps: [
      {
        target: (p) => item(pageColumn(p), BOOKING_TITLE).getByTitle('Mark as read'),
        act: async (p) => {
          await item(pageColumn(p), BOOKING_TITLE).getByTitle('Mark as read').click();
          await expect(item(pageColumn(p), BOOKING_TITLE).getByTitle('Mark as read')).toHaveCount(0);
          await settle(p);
        },
      },
      {
        target: (p) => pageColumn(p).getByRole('button', { name: 'Mark all read' }),
        act: async (p) => {
          await pageColumn(p).getByRole('button', { name: 'Mark all read' }).click();
          await expect(pageColumn(p).getByRole('button', { name: 'Mark all read' })).toHaveCount(0);
          await settle(p);
        },
      },
    ],
    cleanup: async (p) => {
      await markUnread(p.request, unreadBefore);
      await ensureNotificationFixtures(p.request);
    },
  },

  'delete-notifications': {
    guide: guide('delete-notifications'),
    start: openNotifications,
    steps: [
      {
        target: (p) => item(pageColumn(p), BOOKING_TITLE).getByTitle('Delete', { exact: true }),
        act: async (p) => {
          await item(pageColumn(p), BOOKING_TITLE).getByTitle('Delete', { exact: true }).click();
          await expect(pageColumn(p).locator('div.relative.px-4.py-3').filter({ hasText: BOOKING_TITLE })).toHaveCount(
            0
          );
          await settle(p);
        },
      },
      // Ringed only, see the file's comment.
      { target: (p) => pageColumn(p).getByRole('button', { name: 'Delete all' }) },
    ],
    cleanup: async (p) => {
      await ensureNotificationFixtures(p.request);
    },
  },

  'notification-settings': {
    guide: guide('notification-settings'),
    start: openNotifications,
    steps: [
      {
        target: userMenu,
        act: async (p) => {
          await userMenu(p).click();
          await expect(p.locator('.trek-menu-enter').getByRole('link', { name: 'Settings' })).toBeVisible();
          await settle(p);
        },
      },
      {
        target: (p) => p.locator('.trek-menu-enter').getByRole('link', { name: 'Settings' }),
        act: async (p) => {
          await p.locator('.trek-menu-enter').getByRole('link', { name: 'Settings' }).click();
          await expect(settingsSidebar(p)).toBeVisible({ timeout: 20_000 });
          await settle(p);
        },
      },
      {
        target: (p) => settingsSidebar(p).getByRole('button', { name: 'Notifications', exact: true }),
        act: async (p) => {
          await settingsSidebar(p).getByRole('button', { name: 'Notifications', exact: true }).click();
          await settle(p);
        },
      },
    ],
  },
};

// ── Run ───────────────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ request }) => {
  await ensureNotificationFixtures(request);
});

test.afterAll(async ({ request }) => {
  await removeNotificationFixtures(request);
});

test('every registered notifications guide has a script, and only those', async () => {
  expect(Object.keys(SCRIPTS).sort()).toEqual(notificationsContext.guides.slice().sort());
});

test('hero: notifications', async ({ page }) => {
  await page.setViewportSize(VIEWPORT);
  await captureHero(page, notificationsContext.id, openNotifications);
});

for (const id of notificationsContext.guides) {
  test(`pictures: ${id}`, async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
    await captureGuide(page, SCRIPTS[id]);
  });
}
