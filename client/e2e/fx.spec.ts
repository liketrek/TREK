import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import Database from 'better-sqlite3';
import path from 'node:path';

const dbFile = path.join(process.cwd(), 'e2e', '.tmp', 'e2e.db');

function seedSnapshot(base: string, rates: Record<string, number>) {
  const db = new Database(dbFile);
  const fetchedAt = new Date().toISOString();
  db.prepare(
    `
    INSERT INTO global_exchange_rate_snapshots
      (base_currency, rates_json, source_version, effective_date, fetched_at)
    VALUES (?, ?, ?, '2026-08-07', ?)
    ON CONFLICT(base_currency) DO UPDATE SET
      rates_json = excluded.rates_json,
      source_version = excluded.source_version,
      effective_date = excluded.effective_date,
      fetched_at = excluded.fetched_at
  `
  ).run(base, JSON.stringify(rates), `e2e:${base}:2026-08-07`, fetchedAt);
  db.close();
}

async function api<T>(
  request: APIRequestContext,
  method: 'get' | 'post' | 'put',
  url: string,
  data?: unknown
): Promise<T> {
  const response = await request[method](url, data === undefined ? undefined : { data });
  if (!response.ok())
    throw new Error(`${method.toUpperCase()} ${url} → ${response.status()}\n${await response.text()}`);
  return response.json() as Promise<T>;
}

async function createTripFixture(request: APIRequestContext) {
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;
  const me = await api<{ user: { id: number } }>(request, 'get', '/api/auth/me');
  const member = await api<{ user: { id: number; email: string } }>(request, 'post', '/api/admin/users', {
    username: `fx-${stamp}`,
    email: `fx-${stamp}@example.test`,
    password: 'ForeignRate123!',
    role: 'user',
  });
  const created = await api<{ trip: { id: number } }>(request, 'post', '/api/trips', {
    title: `FX E2E ${stamp}`,
    currency: 'EUR',
  });
  await api(request, 'post', `/api/trips/${created.trip.id}/members`, { identifier: member.user.email });
  return { tripId: created.trip.id, meId: me.user.id, memberId: member.user.id };
}

async function openCosts(page: Page, tripId: number) {
  await page.goto(`/trips/${tripId}`);
  await page.getByRole('button', { name: 'Costs', exact: true }).first().click();
  await expect(page.getByRole('button', { name: 'Add expense' })).toBeVisible();
}

async function chooseUsd(page: Page) {
  const modal = page.locator('.trek-modal-backdrop');
  await modal.getByText(/^EUR/).click();
  await page.getByText(/^USD/).last().click();
  return modal;
}

test.beforeEach(() => {
  seedSnapshot('EUR', { EUR: 1, USD: 1.25, JPY: 170 });
  seedSnapshot('USD', { USD: 1, EUR: 0.8, JPY: 136 });
});

test('mobile exchange-rate action adapts without horizontal overflow', async ({ page, request }) => {
  const { tripId } = await createTripFixture(request);

  await page.setViewportSize({ width: 390, height: 844 });
  await openCosts(page, tripId);

  const action = page.getByRole('button', { name: 'Exchange rates', exact: true });
  const label = action.locator('.costs-mobile-exchange-rates-label');
  await expect(action).toBeVisible();
  await expect(label).toBeHidden();
  const compactBox = await action.boundingBox();
  expect(compactBox?.width).toBe(44);
  expect(compactBox?.height).toBe(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    await page.evaluate(() => document.documentElement.clientWidth)
  );

  await action.click();
  await expect(page.getByRole('heading', { name: 'Trip exchange rates' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    await page.evaluate(() => document.documentElement.clientWidth)
  );
  await page.getByRole('button', { name: 'Close', exact: true }).click();

  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(action).toBeVisible();
  await expect(label).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    await page.evaluate(() => document.documentElement.clientWidth)
  );

  await action.click();
  await expect(page.getByRole('heading', { name: 'Trip exchange rates' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    await page.evaluate(() => document.documentElement.clientWidth)
  );
});

test('foreign expenses and payments freeze manual and quote provenance', async ({ page, request }) => {
  const { tripId } = await createTripFixture(request);
  await openCosts(page, tripId);

  await page.getByRole('button', { name: 'Add expense' }).click();
  let modal = page.locator('.trek-modal-backdrop');
  await modal.getByPlaceholder('e.g. Dinner, souvenirs, gas…').fill('USD dinner');
  await modal.getByPlaceholder('0.00').first().fill('100');
  modal = await chooseUsd(page);
  await expect(modal.getByText(/Source: global/)).toBeVisible();
  const expenseRate = modal.getByPlaceholder('Required');
  await expect(expenseRate).toHaveValue('0.8');
  await expenseRate.fill('0.5');
  await modal.getByRole('button', { name: 'Add expense' }).last().click();

  const budget = await api<{ items: Array<Record<string, unknown>> }>(request, 'get', `/api/trips/${tripId}/budget`);
  expect(budget.items.find((item) => item.name === 'USD dinner')).toMatchObject({
    currency: 'USD',
    exchange_rate: 2,
    exchange_rate_source: 'manual',
  });

  await page.getByRole('button', { name: 'Add payment' }).click();
  modal = page.locator('.trek-modal-backdrop');
  await modal.getByPlaceholder('0.00').fill('25');
  modal = await chooseUsd(page);
  await expect(modal.getByText(/Source: global/)).toBeVisible();
  await modal.getByRole('button', { name: 'Add payment' }).last().click();

  const settlement = await api<{ settlements: Array<Record<string, unknown>> }>(
    request,
    'get',
    `/api/trips/${tripId}/budget/settlement`
  );
  expect(settlement.settlements.at(-1)).toMatchObject({
    amount: 25,
    currency: 'USD',
    exchange_rate: 1.25,
    exchange_rate_source: 'global',
  });
});

test('trip rate preview applies only the selected frozen rows', async ({ page, request }) => {
  const { tripId, meId } = await createTripFixture(request);
  const quote = await api<{ quote_id: string }>(
    request,
    'get',
    `/api/trips/${tripId}/exchange-rates/resolve?currency=USD`
  );
  await api(request, 'post', `/api/trips/${tripId}/budget`, {
    name: 'Quoted lunch',
    category: 'food',
    total_price: 100,
    currency: 'USD',
    quote_id: quote.quote_id,
    payers: [{ user_id: meId, amount: 100 }],
    member_ids: [meId],
  });
  await api(request, 'post', `/api/trips/${tripId}/budget`, {
    name: 'Manual taxi',
    category: 'transport',
    total_price: 50,
    currency: 'USD',
    exchange_rate: 1.1,
    payers: [{ user_id: meId, amount: 50 }],
    member_ids: [meId],
  });
  await openCosts(page, tripId);

  await page.getByRole('button', { name: /Exchange rates/ }).click();
  const modal = page.locator('.trek-modal-backdrop');
  const currencyButton = modal
    .locator('button')
    .filter({ hasText: /^[A-Z]{3}$/ })
    .first();
  if ((await currencyButton.textContent())?.trim() !== 'USD') {
    await currencyButton.click();
    await page.getByText('USD', { exact: true }).last().click();
  }
  await modal.getByPlaceholder('0').fill('0.75');
  await modal.getByText('Update existing items (preview required)').click();
  await modal.getByRole('button', { name: 'Preview changes' }).click();

  await expect(modal.getByText(/expense #\d+ · global/)).toBeVisible();
  await expect(modal.getByText(/expense #\d+ · manual/)).toBeVisible();
  await expect(modal.getByRole('button', { name: 'Apply to 1 item(s)' })).toBeVisible();
  await modal.getByRole('button', { name: 'Apply to 1 item(s)' }).click();

  const budget = await api<{ items: Array<Record<string, unknown>> }>(request, 'get', `/api/trips/${tripId}/budget`);
  expect(budget.items.find((item) => item.name === 'Quoted lunch')).toMatchObject({
    exchange_rate_source: 'trip',
  });
  expect(budget.items.find((item) => item.name === 'Manual taxi')).toMatchObject({
    exchange_rate: 1.1,
    exchange_rate_source: 'manual',
  });
  const rates = await api<{ rates: Array<Record<string, unknown>> }>(
    request,
    'get',
    `/api/trips/${tripId}/exchange-rates`
  );
  expect(rates.rates).toEqual(
    expect.arrayContaining([expect.objectContaining({ currency: 'USD', exchange_rate: 4 / 3 })])
  );
});

test('stale and unavailable quotes warn, and unavailable requires a manual rate', async ({ page, request }) => {
  const { tripId } = await createTripFixture(request);
  let mode: 'stale' | 'unavailable' = 'stale';
  await page.route(`**/api/trips/${tripId}/exchange-rates/resolve?currency=USD`, async (route) => {
    if (mode === 'unavailable') {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'unavailable' }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        quote_id: 'stale-ui-only',
        exchange_rate: 1.25,
        source: 'global',
        effective_date: '2026-08-01',
        stale: true,
      }),
    });
  });
  await openCosts(page, tripId);

  await page.getByRole('button', { name: 'Add payment' }).click();
  let modal = page.locator('.trek-modal-backdrop');
  await modal.getByPlaceholder('0.00').fill('10');
  modal = await chooseUsd(page);
  await expect(modal.getByText(/Stale provider snapshot/)).toBeVisible();
  await modal.getByRole('button', { name: 'Cancel' }).click();

  mode = 'unavailable';
  await page.getByRole('button', { name: 'Add payment' }).click();
  modal = page.locator('.trek-modal-backdrop');
  await modal.getByPlaceholder('0.00').fill('10');
  modal = await chooseUsd(page);
  await expect(modal.getByText(/Enter a manual rate to save/)).toBeVisible();
  const submit = modal.getByRole('button', { name: 'Add payment' }).last();
  await expect(submit).toBeDisabled();
  await modal.getByPlaceholder('Required').fill('0.8');
  await expect(modal.getByText('Manual rate')).toBeVisible();
  await expect(submit).toBeEnabled();
  await submit.click();
});

test('changing accounting currency clears defaults and reanchors frozen rows without redenominating them', async ({
  request,
}) => {
  const { tripId, meId } = await createTripFixture(request);
  await api(request, 'put', `/api/trips/${tripId}/exchange-rates/USD`, { exchange_rate: 1.25, note: 'old base' });
  const created = await api<{ item: { id: number } }>(request, 'post', `/api/trips/${tripId}/budget`, {
    name: 'Implicit euros',
    category: 'food',
    total_price: 80,
    currency: null,
    payers: [{ user_id: meId, amount: 80 }],
    member_ids: [meId],
  });

  await api(request, 'put', `/api/trips/${tripId}`, { currency: 'USD' });

  const trip = await api<{ trip: { currency: string } }>(request, 'get', `/api/trips/${tripId}`);
  expect(trip.trip.currency).toBe('USD');
  const rates = await api<{ rates: unknown[] }>(request, 'get', `/api/trips/${tripId}/exchange-rates`);
  expect(rates.rates).toEqual([]);
  const budget = await api<{ items: Array<Record<string, unknown>> }>(request, 'get', `/api/trips/${tripId}/budget`);
  expect(budget.items.find((item) => item.id === created.item.id)).toMatchObject({
    total_price: 80,
    currency: 'EUR',
    exchange_rate: 0.8,
    exchange_rate_source: 'global',
  });
  expect(budget.items.find((item) => item.id === created.item.id)?.exchange_rate_reset_at).toBeTruthy();
});
