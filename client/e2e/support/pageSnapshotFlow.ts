import { expect, type Page } from '@playwright/test';

import type { SeededSnapshot } from './pageSnapshotHarness';

/** The map tile from another server that the harness puts on the sheet. */
const TILE = 'https://tile.openstreetmap.org/5/16/10.png?e2e=page-snapshot';

/**
 * The page snapshot the Studio sends the assistant, taken in a real browser
 * (journey-studio.md 3.1): the harness module is loaded into the running app
 * through the dev server, draws a seeded spread with the editor's SpreadView
 * and rasterises it with modern-screenshot. The image has to be a non-empty
 * JPEG at the size the Studio promises the server, and the map tile from
 * another server on the sheet must never have been fetched for it. Every
 * request to OpenStreetMap's tile servers is answered here, which keeps the
 * run off the network, but only the harness's own tile counts: the sheet's
 * <img> asks for it as an image, anything else would be the rasteriser
 * reaching for it. Its query string sets it apart from the tiles the app
 * itself may prefetch from the same servers. The specs block the service
 * worker, whose tile cache would answer before the route sees a request.
 */
export async function checkPageSnapshot(page: Page): Promise<void> {
  const tileFetches: string[] = [];
  await page.route(/^https:\/\/(?:[a-c]\.)?tile\.openstreetmap\.org\//, (route) => {
    const request = route.request();
    const kind = request.resourceType();
    if (request.url().startsWith(TILE) && kind !== 'image') tileFetches.push(kind);
    return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });
  });
  await page.goto('/dashboard');
  const shot = await page.evaluate(
    async ({ harness, tile }: { harness: string; tile: string }): Promise<SeededSnapshot | null> => {
      const mod = (await import(/* @vite-ignore */ harness)) as {
        snapshotSeededSpread: (tileUrl: string) => Promise<SeededSnapshot | null>;
      };
      return mod.snapshotSeededSpread(tile);
    },
    { harness: '/e2e/support/pageSnapshotHarness.ts', tile: TILE }
  );

  expect(shot, 'the spread was drawn and came out under the size limit').not.toBeNull();
  if (!shot) return;
  expect(shot.type).toBe('image/jpeg');
  expect(shot.head).toEqual([0xff, 0xd8, 0xff]);
  expect(shot.bytes).toBeGreaterThan(1_000);
  // A double spread at 1280 pixels on its long edge, and the file says so too.
  expect(shot.width).toBe(1280);
  expect(shot.height).toBe(640);
  expect(shot.decodedWidth).toBe(1280);
  expect(shot.decodedHeight).toBe(640);
  expect(shot.drawnPhotoIds).toEqual([]);
  expect(tileFetches, 'the tile from another server is left out before anything is fetched').toEqual([]);
}
