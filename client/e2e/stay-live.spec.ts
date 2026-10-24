import type { APIRequestContext, Browser, Page } from '@playwright/test';
import { devices, expect, test } from '@playwright/test';
import { E2E_STATE_FILE } from '../playwright.config';

// A stay booked somewhere else shows in the open planner without a reload. The
// assistant books through its tools, and a stay it booked showed in the planner
// only after a reload: the server told every tab, the client dropped the news.
// Here a second session (a browser context of its own, so the open planner's
// socket is not the one that asked) books the stay over the API, and the planner
// has to show it on its own, on the desktop and on the phone.

/** A trip with three dated days, and their ids in order. */
async function seedTrip(api: APIRequestContext, title: string) {
  const created = await api.post('/api/trips', {
    data: { title, start_date: '2099-07-01', end_date: '2099-07-03' },
  });
  expect(created.ok(), 'seed trip').toBeTruthy();
  const body = await created.json();
  const tripId: number = body.trip?.id ?? body.id;
  const days = await (await api.get(`/api/trips/${tripId}/days`)).json();
  const dayIds: number[] = (days.days ?? days).map((day: { id: number }) => day.id);
  expect(dayIds.length, 'the trip has its three days').toBe(3);
  return { tripId, dayIds };
}

/** Opens the planner and waits until its socket joined the trip's room, so no event can slip past it. */
async function openPlanner(page: Page, tripId: number) {
  const joined = new Promise<void>((resolve) => {
    page.on('websocket', (ws) => {
      ws.on('framereceived', (frame) => {
        if (String(frame.payload).includes('"joined"')) resolve();
      });
    });
  });
  await page.goto(`/trips/${tripId}`);
  await joined;
}

/** Books a hotel from the first to the second day, from a session of its own. */
async function bookElsewhere(browser: Browser, tripId: number, dayIds: number[], hotel: string) {
  const other = await browser.newContext({ storageState: E2E_STATE_FILE });
  try {
    const place = await other.request.post(`/api/trips/${tripId}/places`, {
      data: { name: hotel, lat: 52.5306, lng: 13.3846 },
    });
    expect(place.ok(), 'the hotel place').toBeTruthy();
    const placeBody = await place.json();
    const stay = await other.request.post(`/api/trips/${tripId}/accommodations`, {
      data: { place_id: placeBody.place?.id ?? placeBody.id, start_day_id: dayIds[0], end_day_id: dayIds[1] },
    });
    expect(stay.ok(), 'the stay').toBeTruthy();
  } finally {
    await other.close();
  }
}

test('desktop: a stay booked in another session shows in the day plan without a reload', async ({ page, browser }) => {
  const hotel = `Mercure Hotel ${Date.now()}`;
  const { tripId, dayIds } = await seedTrip(page.request, `Stay live ${Date.now()}`);
  await openPlanner(page, tripId);
  await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 20_000 });

  await bookElsewhere(browser, tripId, dayIds, hotel);

  // The day head names the hotel of the night, read from the planner's stays.
  await expect(page.locator('[data-dp="day-pill"]', { hasText: hotel }).first()).toBeVisible({ timeout: 10_000 });
});

test('phone: a stay booked in another session shows on the day plan without a reload', async ({ browser }) => {
  const pixel = devices['Pixel 7'];
  const phone = await browser.newContext({
    viewport: pixel.viewport,
    userAgent: pixel.userAgent,
    deviceScaleFactor: pixel.deviceScaleFactor,
    isMobile: pixel.isMobile,
    hasTouch: pixel.hasTouch,
    storageState: E2E_STATE_FILE,
  });
  try {
    const page = await phone.newPage();
    const hotel = `Mercure Hotel ${Date.now()}`;
    const { tripId, dayIds } = await seedTrip(page.request, `Stay live phone ${Date.now()}`);
    await openPlanner(page, tripId);
    await expect(page.locator('button[aria-current="true"]')).toBeVisible({ timeout: 30_000 });

    await bookElsewhere(browser, tripId, dayIds, hotel);

    // The first day's plan carries a chip for the hotel checked into that night.
    await expect(page.locator('button', { hasText: hotel }).first()).toBeVisible({ timeout: 10_000 });
  } finally {
    await phone.close();
  }
});
