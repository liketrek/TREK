import { expect, test, type Page } from '@playwright/test';

const TRIP_ID = 777;

// The development PWA worker can satisfy /api requests before Playwright's
// route fixtures see them. Block it in this mocked-network regression spec.
test.use({ serviceWorkers: 'block' });

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
  height: number;
}

function intersects(a: Box, b: Box): boolean {
  return Math.min(a.right, b.right) > Math.max(a.left, b.left) && Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top);
}

async function mockCountdownTrip(page: Page): Promise<void> {
  const departureDate = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const endDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const trip = {
    id: TRIP_ID,
    user_id: 1,
    title: 'TestTestTestTestTestTestTestTestTestTestTestTestTestTestTestTestTestTestTestTest',
    description: null,
    start_date: departureDate,
    end_date: endDate,
    currency: 'HKD',
    cover_image: null,
    is_archived: 0,
    owner_username: 'E2E Admin',
    shared_count: 0,
    place_count: 0,
    day_count: 5,
  };

  await page.route('**/api/trips**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === `/api/trips/${TRIP_ID}/bundle`) {
      await route.fulfill({
        json: {
          trip,
          members: [],
          places: [],
          days: [{ id: 900, trip_id: TRIP_ID, date: departureDate, title: null, notes: null }],
          reservations: [
            {
              id: 901,
              trip_id: TRIP_ID,
              day_id: 900,
              title: 'HX676 with an intentionally long booking title that must truncate cleanly',
              type: 'flight',
              status: 'confirmed',
              reservation_time: `${departureDate}T23:59`,
              reservation_end_time: null,
              location: null,
              confirmation_number: null,
              notes: null,
              endpoints: [
                {
                  role: 'from',
                  sequence: 0,
                  name: 'Hong Kong International Airport',
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
      return;
    }
    if (url.pathname === '/api/trips') {
      await route.fulfill({ json: { trips: url.searchParams.has('archived') ? [] : [trip] } });
      return;
    }
    await route.fallback();
  });
}

async function desktopLayout(page: Page): Promise<{
  hero: Box;
  board: Box;
  title: Box;
  controls: Box;
  pass: Box;
  units: Box[];
  titleLines: number;
  titleClamp: string;
  titleOverflow: string;
}> {
  return page.evaluate(() => {
    const rect = (selector: string) => {
      const value = document.querySelector(selector)!.getBoundingClientRect();
      return {
        left: value.left,
        top: value.top,
        right: value.right,
        bottom: value.bottom,
        height: value.height,
      };
    };
    const title = document.querySelector('.hero-title')!;
    const titleStyle = getComputedStyle(title);
    return {
      hero: rect('.hero-trip'),
      board: rect('[data-testid="departure-countdown-board"]'),
      title: rect('.hero-title-block'),
      controls: rect('.hero-tools'),
      pass: rect('.hero-pass'),
      units: [...document.querySelectorAll('.departure-countdown-unit')].map((element) => {
        const value = element.getBoundingClientRect();
        return {
          left: value.left,
          top: value.top,
          right: value.right,
          bottom: value.bottom,
          height: value.height,
        };
      }),
      titleLines: Math.round(title.getBoundingClientRect().height / Number.parseFloat(titleStyle.lineHeight)),
      titleClamp: titleStyle.webkitLineClamp,
      titleOverflow: titleStyle.overflow,
    };
  });
}

async function desktopColors(page: Page): Promise<{
  primary: string;
  secondary: string;
  title: string;
  number: string;
  transport: string;
  label: string;
}> {
  return page.evaluate(() => {
    const dashboard = document.querySelector('.trek-dash')!;
    const primaryProbe = document.createElement('span');
    const secondaryProbe = document.createElement('span');
    primaryProbe.style.color = 'var(--ink)';
    secondaryProbe.style.color = 'var(--ink-2)';
    dashboard.append(primaryProbe, secondaryProbe);
    const result = {
      primary: getComputedStyle(primaryProbe).color,
      secondary: getComputedStyle(secondaryProbe).color,
      title: getComputedStyle(document.querySelector('.departure-countdown-title')!).color,
      number: getComputedStyle(document.querySelector('.departure-countdown-number')!).color,
      transport: getComputedStyle(document.querySelector('.departure-countdown-transport')!).color,
      label: getComputedStyle(document.querySelector('.departure-countdown-label')!).color,
    };
    primaryProbe.remove();
    secondaryProbe.remove();
    return result;
  });
}

test('desktop countdown grows with its hero and follows light and dark dashboard colors', async ({ page }) => {
  await page.setViewportSize({ width: 1375, height: 900 });
  await mockCountdownTrip(page);
  await page.goto('/dashboard');

  const board = page.getByTestId('departure-countdown-board');
  await expect(board).toBeVisible();

  for (const viewport of [
    { width: 1375, height: 900 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(board).toBeVisible();
    const metrics = await desktopLayout(page);

    expect(metrics.units).toHaveLength(4);
    expect(metrics.board.left).toBeGreaterThanOrEqual(metrics.hero.left);
    expect(metrics.board.right).toBeLessThanOrEqual(metrics.hero.right);
    expect(metrics.board.top).toBeGreaterThanOrEqual(metrics.hero.top);
    expect(metrics.board.bottom).toBeLessThanOrEqual(metrics.hero.bottom);
    expect(intersects(metrics.board, metrics.title)).toBe(false);
    expect(intersects(metrics.board, metrics.controls)).toBe(false);
    expect(intersects(metrics.board, metrics.pass)).toBe(false);
    expect(metrics.titleLines).toBeLessThanOrEqual(2);
    expect(metrics.titleClamp).toBe('2');
    expect(metrics.titleOverflow).toBe('hidden');
    for (const unit of metrics.units) {
      expect(unit.left).toBeGreaterThanOrEqual(metrics.board.left);
      expect(unit.right).toBeLessThanOrEqual(metrics.board.right);
    }
    if (viewport.width === 1375) expect(metrics.hero.height).toBeGreaterThan(520);
  }

  await page.evaluate(() => document.documentElement.classList.remove('dark'));
  const light = await desktopColors(page);
  expect(light.title).toBe(light.primary);
  expect(light.number).toBe(light.primary);
  expect(light.transport).toBe(light.secondary);
  expect(light.label).toBe(light.secondary);

  await page.evaluate(() => document.documentElement.classList.add('dark'));
  const dark = await desktopColors(page);
  expect(dark.title).toBe(dark.primary);
  expect(dark.number).toBe(dark.primary);
  expect(dark.transport).toBe(dark.secondary);
  expect(dark.label).toBe(dark.secondary);
  expect(dark.primary).not.toBe(light.primary);
});

test('mobile countdown remains fully visible with its white-on-dark overlay treatment', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockCountdownTrip(page);
  await page.goto('/dashboard');

  const board = page.getByTestId('departure-countdown-board');
  await expect(board).toBeVisible();
  await expect(board).toHaveClass(/bg-black\/25/);
  await expect(board).toHaveClass(/text-white/);

  const metrics = await page.evaluate(() => {
    const board = document.querySelector('[data-testid="departure-countdown-board"]')!;
    const card = board.closest('[role="button"]')!;
    const boardRect = board.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    return {
      board: { top: boardRect.top, right: boardRect.right, bottom: boardRect.bottom, left: boardRect.left },
      card: { top: cardRect.top, right: cardRect.right, bottom: cardRect.bottom, left: cardRect.left },
      units: board.querySelectorAll('time > span').length,
      color: getComputedStyle(board).color,
    };
  });

  expect(metrics.units).toBe(4);
  expect(metrics.board.left).toBeGreaterThanOrEqual(metrics.card.left);
  expect(metrics.board.right).toBeLessThanOrEqual(metrics.card.right);
  expect(metrics.board.top).toBeGreaterThanOrEqual(metrics.card.top);
  expect(metrics.board.bottom).toBeLessThanOrEqual(metrics.card.bottom);
  expect(metrics.color).toBe('rgb(255, 255, 255)');
});
