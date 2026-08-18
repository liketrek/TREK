import { expect, test, type Page } from '@playwright/test';

const TRIP_ID = 777;

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function intersects(a: Box, b: Box): boolean {
  return Math.min(a.right, b.right) > Math.max(a.left, b.left) && Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top);
}

async function assertCountdownLayout(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
  const board = page.getByTestId('departure-countdown-board');
  await expect(board).toBeVisible();
  const metrics = await page.evaluate(() => {
    const rect = (selector: string) => {
      const value = document.querySelector(selector)!.getBoundingClientRect();
      return { left: value.left, top: value.top, right: value.right, bottom: value.bottom };
    };
    const hero = rect('.hero-trip');
    const boardRect = rect('[data-testid="departure-countdown-board"]');
    const title = rect('.hero-title-block');
    const controls = rect('.hero-tools');
    const units = [...document.querySelectorAll('[data-countdown-unit]')].map((element) => {
      const value = element.getBoundingClientRect();
      return { left: value.left, top: value.top, right: value.right, bottom: value.bottom };
    });
    return {
      hero,
      board: boardRect,
      title,
      controls,
      units,
      mobile: window.matchMedia('(max-width: 720px)').matches,
    };
  });
  expect(metrics.units).toHaveLength(4);
  expect(metrics.board.left).toBeGreaterThanOrEqual(metrics.hero.left);
  expect(metrics.board.right).toBeLessThanOrEqual(metrics.hero.right);
  expect(metrics.board.top).toBeGreaterThanOrEqual(metrics.hero.top);
  expect(metrics.board.bottom).toBeLessThanOrEqual(metrics.hero.bottom);
  expect(intersects(metrics.board, metrics.title)).toBe(false);
  expect(intersects(metrics.board, metrics.controls)).toBe(false);
  for (const unit of metrics.units) {
    expect(unit.left).toBeGreaterThanOrEqual(metrics.board.left);
    expect(unit.right).toBeLessThanOrEqual(metrics.board.right);
  }
}

test('Option A departure countdown fits desktop, tablet and narrow mobile heroes', async ({ page }) => {
  const departureDate = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const endDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const trip = {
    id: TRIP_ID,
    user_id: 1,
    title: '藍男二十周年 - 這是一個刻意很長而且不能碰到倒數板的沖繩旅行名稱',
    description: null,
    start_date: null,
    end_date: endDate,
    currency: 'HKD',
    cover_image: null,
    is_archived: 0,
    owner_username: 'E2E Admin',
    shared_count: 0,
    place_count: 0,
  };

  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      json: {
        user: {
          id: 1,
          username: 'E2E Admin',
          email: 'e2e@example.com',
          role: 'admin',
          avatar_url: null,
          maps_api_key: null,
          created_at: '2026-01-01T00:00:00Z',
          mfa_enabled: false,
          must_change_password: false,
        },
      },
    })
  );
  await page.route('**/api/auth/app-config', (route) =>
    route.fulfill({
      json: {
        has_users: true,
        allow_registration: true,
        demo_mode: false,
        oidc_configured: false,
        password_login: true,
      },
    })
  );
  await page.route('**/api/settings', (route) =>
    route.fulfill({
      json: {
        settings: { language: 'en', time_format: '24h', dark_mode: false },
      },
    })
  );
  await page.route(/\/api\/trips(?:\?.*)?$/, async (route) => {
    const archived = new URL(route.request().url()).searchParams.has('archived');
    await route.fulfill({ json: { trips: archived ? [] : [trip] } });
  });
  await page.route(`**/api/trips/${TRIP_ID}/bundle`, async (route) => {
    await route.fulfill({
      json: {
        trip,
        members: [],
        places: [],
        days: [
          {
            id: 900,
            trip_id: TRIP_ID,
            date: departureDate,
            title: null,
            notes: null,
            assignments: [],
            notes_items: [],
          },
        ],
        reservations: [
          {
            id: 901,
            trip_id: TRIP_ID,
            day_id: 900,
            title: 'HX676 with an intentionally long booking title that must truncate',
            type: 'flight',
            status: 'pending',
            reservation_time: `${departureDate}T23:59`,
            reservation_end_time: null,
            location: null,
            confirmation_number: null,
            notes: null,
            endpoints: [
              {
                role: 'from',
                sequence: 0,
                name: 'Hong Kong (HKG)',
                code: 'HKG',
                lat: 22.308,
                lng: 113.9185,
                timezone: 'Asia/Hong_Kong',
                local_date: departureDate,
                local_time: '23:59',
              },
            ],
          },
        ],
      },
    });
  });

  await page.goto('/dashboard');
  await expect(page.getByTestId('departure-countdown-board')).toBeVisible();
  await expect(page.locator('.pass-cell.countdown')).toBeVisible();

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 768, height: 900 },
    { width: 390, height: 844 },
    { width: 320, height: 700 },
  ]) {
    await assertCountdownLayout(page, viewport.width, viewport.height);
  }
});
