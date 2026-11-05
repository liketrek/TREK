import { test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { E2E_STATE_FILE } from '../../playwright.config';
import { clearNotices, seed } from '../screenshots/shot';

/**
 * The store screenshots (`npm run store:shots`, then `npm run store:promote`).
 *
 * The same seeded demo trip the wiki pictures show, captured at the sizes App
 * Store Connect and Google Play ask for: the iPhone 6.9" and iPad 13" displays,
 * and a Play phone, 7" and 10" tablet. Below 768 px the phone shell answers, so
 * the phone pictures show the phone UI; the tablets get the desktop layout they
 * get on a real device.
 *
 * Raw captures go to e2e/.tmp/store/<device>/; scripts/store-screenshots.mjs
 * flattens them (the stores refuse an alpha channel) and copies them into
 * fastlane/. Nothing here asserts behaviour, and the run is not part of CI.
 */

const STORE_OUT_DIR = path.join(process.cwd(), 'e2e', '.tmp', 'store');

const DEVICES = [
  { name: 'iphone69', viewport: { width: 440, height: 956 }, deviceScaleFactor: 3, isMobile: true },
  { name: 'ipad13', viewport: { width: 1032, height: 1376 }, deviceScaleFactor: 2, isMobile: true },
  { name: 'play-phone', viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, isMobile: true },
  { name: 'play-7in', viewport: { width: 810, height: 1440 }, deviceScaleFactor: 2, isMobile: true },
  { name: 'play-10in', viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5, isMobile: true },
] as const;

/** The screens, in the order the listings show them. */
const SCREENS: { name: string; path: () => string }[] = [
  { name: 'dashboard', path: () => '/dashboard' },
  { name: 'plan', path: () => `/trips/${seed.tripId}?tab=plan` },
  { name: 'bookings', path: () => `/trips/${seed.tripId}?tab=buchungen` },
  { name: 'costs', path: () => `/trips/${seed.tripId}?tab=finanzplan` },
  { name: 'lists', path: () => `/trips/${seed.tripId}?tab=listen` },
  { name: 'journal', path: () => (seed.journeyId ? `/journey/${seed.journeyId}` : '/journey') },
];

/** Waits until the page has drawn what it is going to draw: fonts, images, no pending fade. */
async function settle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForTimeout(800);
}

for (const device of DEVICES) {
  test.describe(device.name, () => {
    test.use({
      storageState: E2E_STATE_FILE,
      viewport: device.viewport,
      deviceScaleFactor: device.deviceScaleFactor,
      isMobile: device.isMobile,
      hasTouch: true,
    });

    SCREENS.forEach((screen, index) => {
      test(`${index + 1} ${screen.name}`, async ({ page }) => {
        const dir = path.join(STORE_OUT_DIR, device.name);
        mkdirSync(dir, { recursive: true });
        await page.goto(screen.path());
        await clearNotices(page);
        await settle(page);
        await page.screenshot({ path: path.join(dir, `${index + 1}_${screen.name}.png`) });
      });
    });
  });
}
