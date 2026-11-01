import { expect, test, type Locator } from '@playwright/test';

// A visible DOM node can still be clipped by a panel. Check the whole bar
// before interacting: Playwright's automatic scroll-into-view could mask it.
async function expectBarInsidePanel(bar: Locator, panel: Locator) {
  await expect(bar).toBeInViewport({ ratio: 1 });
  await expect
    .poll(async () => {
      const bounds = await bar.boundingBox();
      const parent = await panel.boundingBox();
      return (
        !!bounds &&
        !!parent &&
        bounds.y >= parent.y &&
        bounds.y + bounds.height <= parent.y + parent.height + 1 &&
        bounds.x >= parent.x &&
        bounds.x + bounds.width <= parent.x + parent.width + 1
      );
    })
    .toBe(true);
}

for (const layout of [
  { name: 'desktop', viewport: { width: 1440, height: 900 }, hasTouch: false },
  { name: 'tablet', viewport: { width: 834, height: 1112 }, hasTouch: true },
  { name: 'short desktop', viewport: { width: 1280, height: 600 }, hasTouch: false },
]) {
  test.describe(layout.name, () => {
    test.use({
      viewport: layout.viewport,
      hasTouch: layout.hasTouch,
    });

    for (const tours of [false, true]) {
      for (const count of [10, 27, 190]) {
        test(`${count} places, Tours ${tours ? 'on' : 'off'}: selection bar stays reachable`, async ({ page }) => {
          test.setTimeout(90_000);
          const activate = (button: Locator) => (layout.hasTouch ? button.tap() : button.click());
          const addonsResponse = await page.request.get('/api/admin/addons');
          expect(addonsResponse.ok()).toBeTruthy();
          const { addons } = await addonsResponse.json();
          const originalTours = addons.find((addon: { id: string }) => addon.id === 'tours');
          expect(originalTours).toBeDefined();
          let tripId: number | undefined;

          try {
            expect((await page.request.put('/api/admin/addons/tours', { data: { enabled: tours } })).ok()).toBeTruthy();
            const tripResponse = await page.request.post('/api/trips', {
              data: {
                title: `Selection bar ${layout.name} ${count}`,
                start_date: '2027-01-01',
                end_date: '2027-01-02',
              },
            });
            expect(tripResponse.ok()).toBeTruthy();
            tripId = (await tripResponse.json()).trip.id;
            for (let i = 1; i <= count; i++) {
              const response = await page.request.post(`/api/trips/${tripId}/places`, {
                data: { name: `Selection place ${i}`, lat: 48.85, lng: 2.35 },
              });
              expect(response.ok(), `seed place ${i}`).toBeTruthy();
            }

            await page.goto(`/trips/${tripId}`);
            if (layout.name === 'tablet') await page.locator('button[aria-label="Places"]').click();
            const sidebar = page
              .locator('[data-touch-drag]')
              .filter({ has: page.getByRole('button', { name: 'Select', exact: true }) });
            const panel = sidebar.locator('..');
            const rows = sidebar.getByRole('option');
            await expect(rows).toHaveCount(count);
            await expect(panel.getByRole('tab', { name: 'Tours', exact: true })).toHaveCount(tours ? 1 : 0);
            await activate(sidebar.getByRole('button', { name: 'Select', exact: true }));
            const bar = sidebar.getByRole('status').locator('../..');
            await expectBarInsidePanel(bar, panel);

            const list = sidebar.locator('.trek-stagger');
            const before = await bar.boundingBox();
            // Only the list scrolls; the bar must remain at the panel's foot.
            await list.evaluate((el) => {
              el.scrollTop = el.scrollHeight;
            });
            if (count >= 27) await expect.poll(() => list.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
            await expectBarInsidePanel(bar, panel);
            expect((await bar.boundingBox())?.y).toBe(before?.y);
            await activate(sidebar.getByRole('button', { name: 'Select all', exact: true }));
            await expect(sidebar.getByRole('status')).toHaveText(String(count));
            await activate(sidebar.getByRole('button', { name: 'Done', exact: true }));
            await expect(sidebar.getByRole('status')).toHaveCount(0);

            await activate(sidebar.getByRole('button', { name: 'Select', exact: true }));
            await list.evaluate((el) => {
              el.scrollTop = 0;
            });
            await expectBarInsidePanel(bar, panel);
            await activate(sidebar.getByRole('button', { name: 'Select all', exact: true }));
            await activate(sidebar.getByRole('button', { name: 'Delete selected', exact: true }));
            await activate(page.getByRole('button', { name: 'Delete', exact: true }));
            await expect(rows).toHaveCount(0);
          } finally {
            if (tripId !== undefined) expect((await page.request.delete(`/api/trips/${tripId}`)).ok()).toBeTruthy();
            expect(
              (await page.request.put('/api/admin/addons/tours', { data: { enabled: !!originalTours.enabled } })).ok()
            ).toBeTruthy();
          }
        });
      }
    }
  });
}
