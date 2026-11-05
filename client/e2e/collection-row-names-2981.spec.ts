import { expect, test, type Locator } from '@playwright/test';

// #2981: labels, category and status took the whole row, so a place with two or
// three long labels showed one letter of its name or none, and the status pill
// ran out of the card. Measured in a real browser because the layout is the bug.
const PLACES = [
  { name: 'Oceanario de Lisboa', labels: ['Core shortlist', 'Heritage specialist', 'Pair with another stop'] },
  { name: 'Cove of Ursa', labels: ['Heritage specialist', 'Pair with another stop'] },
  { name: 'A Vida Portuguesa', labels: ['Flagship', 'Market', 'Core shortlist', 'Pair with another stop'] },
  { name: 'Torre de Belem', labels: [] as string[] },
];

async function expectInside(row: Locator) {
  const escapes = await row.evaluate((el) => {
    const box = el.getBoundingClientRect();
    return Array.from(el.querySelectorAll('*')).filter((child) => {
      // The strip's hidden measuring copy is meant to run past the bar.
      if (child.closest('[aria-hidden="true"]')) return false;
      const r = child.getBoundingClientRect();
      return r.width > 0 && (r.left < box.left - 0.5 || r.right > box.right + 0.5);
    }).length;
  });
  expect(escapes).toBe(0);
}

for (const viewport of [
  { width: 1920, height: 1000 },
  { width: 1400, height: 900 },
  { width: 1024, height: 800 },
]) {
  test(`place names stay readable next to long labels at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const addonsResponse = await page.request.get('/api/admin/addons');
    expect(addonsResponse.ok()).toBeTruthy();
    const { addons } = await addonsResponse.json();
    const original = addons.find((addon: { id: string }) => addon.id === 'collections');
    expect(original).toBeDefined();
    let collectionId: number | undefined;

    try {
      expect((await page.request.put('/api/admin/addons/collections', { data: { enabled: true } })).ok()).toBeTruthy();
      const created = await page.request.post('/api/addons/collections', { data: { name: `Rows ${viewport.width}` } });
      expect(created.ok()).toBeTruthy();
      const body = await created.json();
      collectionId = (body.collection ?? body).id as number;

      const labelIds = new Map<string, number>();
      for (const name of new Set(PLACES.flatMap((p) => p.labels))) {
        const res = await page.request.post('/api/addons/collections/labels', {
          data: { collection_id: collectionId, name, color: '#2563eb' },
        });
        expect(res.ok(), `label ${name}`).toBeTruthy();
        const label = await res.json();
        labelIds.set(name, (label.label ?? label).id);
      }
      for (const place of PLACES) {
        const res = await page.request.post('/api/addons/collections/places', {
          data: {
            collection_id: collectionId,
            name: place.name,
            address: 'Rua Anchieta 11, 1200-023 Lisboa, Portugal',
            lat: 38.71,
            lng: -9.14,
          },
        });
        expect(res.ok(), `place ${place.name}`).toBeTruthy();
        const saved = await res.json();
        if (!place.labels.length) continue;
        const assign = await page.request.post('/api/addons/collections/labels/assign', {
          data: { label_ids: place.labels.map((l) => labelIds.get(l)), place_ids: [(saved.place ?? saved).id] },
        });
        expect(assign.ok()).toBeTruthy();
      }

      await page.goto(`/collections/${collectionId}`);
      const rows = page.locator('.col-lrow');
      await expect(rows).toHaveCount(PLACES.length);
      for (const place of PLACES) {
        const row = rows.filter({ hasText: place.name });
        const name = row.locator('.li .t');
        await expect(name).toHaveText(place.name);
        // The whole name fits: it is not cut to an ellipsis.
        expect(await name.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
        await expectInside(row);
        // Every label is either on the row or counted by its "+N" chip.
        const shown = await row.locator('.col-lrow-label').count();
        const more = await row
          .locator('.col-lrow-more')
          .textContent()
          .catch(() => null);
        expect(shown + (more ? Number(more.replace('+', '')) : 0)).toBe(place.labels.length);
      }
      // The map's label strip stays inside the map: whole, or folded into its button.
      const topbar = page.locator('.col-map-topbar');
      if (await topbar.count()) await expectInside(topbar);
    } finally {
      if (collectionId !== undefined) {
        expect((await page.request.delete(`/api/addons/collections/${collectionId}`)).ok()).toBeTruthy();
      }
      expect(
        (await page.request.put('/api/admin/addons/collections', { data: { enabled: !!original.enabled } })).ok()
      ).toBeTruthy();
    }
  });
}
