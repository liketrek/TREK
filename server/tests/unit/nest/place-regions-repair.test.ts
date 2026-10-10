import { db } from '../../../src/db/database';
import { AppSettings } from '../../../src/db/entities/AppSettings.entity';
import { PlaceRegions } from '../../../src/db/entities/PlaceRegions.entity';
import { Places } from '../../../src/db/entities/Places.entity';
import { PlaceRegionsRepository } from '../../../src/db/repositories/PlaceRegions.repository';
import { reverseGeocodeRegion } from '../../../src/nest/atlas/atlas-geo';
import { AtlasService } from '../../../src/nest/atlas/atlas.service';
import { PLACE_REGIONS_REPAIR_DONE_KEY, PlaceRegionsRepairJob } from '../../../src/nest/atlas/place-regions-repair.job';
import type { CronRegistrarService } from '../../../src/nest/scheduling/cron-registrar.service';
import {
  createTestBucketListRepo,
  createTestHiddenCountriesRepo,
  createTestHiddenRegionsRepo,
  createTestPlaceRegionsRepo,
  createTestVisitedCountriesRepo,
  createTestVisitedRegionsRepo,
} from '../../helpers/atlas-repos';
import { createTrip, createUser } from '../../helpers/factories';
import { findRow, insertRow } from '../../helpers/factories/rows';
import { resetTestDb } from '../../helpers/test-db';
import {
  createTestAppSettingsRepo,
  createTestPlacesRepo,
  createTestReservationEndpointsRepo,
  createTestTripsRepo,
  createTestUnitOfWork,
  sharedTestOrm,
} from '../../helpers/test-uow';

import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The migrated snapshot, so the #2527 trigger on places is there like on a real install.
vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  return { db: createSnapshotTestDb(), closeDb: () => {}, reinitialize: () => {} };
});

async function buildAtlas(): Promise<AtlasService> {
  return new AtlasService(
    await createTestBucketListRepo(db),
    await createTestHiddenCountriesRepo(db),
    await createTestHiddenRegionsRepo(db),
    await createTestVisitedCountriesRepo(db),
    await createTestVisitedRegionsRepo(db),
    await createTestPlaceRegionsRepo(db),
    await createTestTripsRepo(db),
    await createTestPlacesRepo(db),
    await createTestReservationEndpointsRepo(db),
    await createTestUnitOfWork(db),
    (await sharedTestOrm(db)).orm,
  );
}

// An install that upgrades to the #2527 fix still holds the place_regions rows its
// corrected places were cached with before it. The trigger only stops new ones from
// going stale, so a one time pass re-derives the old rows from the bundled borders.

const BERLIN = { lat: 52.5163, lng: 13.3777, address: 'Unter den Linden 77, 10117 Berlin, Germany' };
// Kehl sits inside France's bounding box, so a box check alone would call its FR row fine.
const KEHL = { lat: 48.5761, lng: 7.8152, address: 'Hauptstrasse 1, 77694 Kehl, Germany' };
const PARIS = { lat: 48.8566, lng: 2.3522, address: 'Rue de Rivoli, Paris, France' };
const LYON = { lat: 45.764, lng: 4.8357, address: 'Place Bellecour, Lyon, France' };
const MUNICH = { lat: 48.1374, lng: 11.5755, address: 'Marienplatz, Munich, Germany' };
// The coordinates fall in Germany's simplified polygon, the address puts it in Luxembourg.
const BOLLENDORF_PONT = {
  lat: 49.8502458,
  lng: 6.3576404,
  address: '4 Gruusswiss, Bollendorf-Pont, Distrikt Gréiwemaacher 6555, Luxembourg',
};
// Points the bundle has no region for: only Nominatim can answer them.
const NICE_HARBOUR = { lat: 43.695, lng: 7.285, address: 'Quai des Etats-Unis, Nice, France' };
const SYLT_BEACH = { lat: 54.9, lng: 8.29, address: 'Westerland, Sylt, Germany' };

type Location = { lat: number | null; lng: number | null; address: string | null };

describe('the one time repair of place_regions rows cached before #2527', () => {
  let atlas: AtlasService;
  let job: PlaceRegionsRepairJob;
  let userId: number;
  let tripId: number;
  const fetchMock = vi.fn();

  const orm = () => sharedTestOrm(db);
  const addPlace = async (name: string, at: Location, cached?: [string, string, string]) => {
    const id = await insertRow(await orm(), Places, {
      trip: tripId,
      name,
      lat: at.lat,
      lng: at.lng,
      address: at.address,
    });
    if (cached) {
      const [country_code, region_code, region_name] = cached;
      await insertRow(await orm(), PlaceRegions, { place: id, country_code, region_code, region_name });
    }
    return id;
  };
  const cachedRow = async (id: number) => {
    const row = await findRow(await orm(), PlaceRegions, { place: id });
    return row ? { country_code: row.country_code, region_code: row.region_code } : undefined;
  };
  const markedDone = async () =>
    (await findRow(await orm(), AppSettings, { key: PLACE_REGIONS_REPAIR_DONE_KEY })) ?? undefined;
  // runOnBoot is where the real registrar opens the request context; here it just runs the pass.
  const registrar = (enabled: boolean) =>
    ({
      isEnabled: () => enabled,
      runOnBoot: async (_name: string, fn: () => Promise<void>) => fn(),
    }) as unknown as CronRegistrarService;

  beforeEach(async () => {
    resetTestDb(db);
    atlas = await buildAtlas();
    job = new PlaceRegionsRepairJob(atlas, registrar(true), await createTestAppSettingsRepo(db));
    userId = createUser(db).user.id;
    tripId = createTrip(db, userId, { title: 'Rhine', start_date: '2025-05-01', end_date: '2025-05-05' }).id;
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  afterAll(() => {
    db.close();
  });

  it('shows an upgraded install the country its corrected places are in now, without editing them again', async () => {
    // The shape from the report: moved to Germany on 4.3.2, still cached in France.
    const hotel = await addPlace('Hotel Adlon', BERLIN, ['FR', 'FR-IDF', 'Ile-de-France']);
    const rhine = await addPlace('Rhine Hotel', KEHL, ['FR', 'FR-GES', 'Grand Est']);
    expect((await atlas.stats(userId)).countries.map((c) => c.code)).toEqual(['FR']);

    await job.runOnce();

    expect(await cachedRow(hotel)).toEqual({ country_code: 'DE', region_code: 'DE-BE' });
    expect(await cachedRow(rhine)).toEqual({ country_code: 'DE', region_code: 'DE-BW' });
    expect((await atlas.stats(userId)).countries.map((c) => c.code)).toEqual(['DE']);
    expect(Object.keys((await atlas.visitedRegions(userId)).regions)).toEqual(['DE']);
    expect((await atlas.getTravelStats(userId)).countries).toEqual(['DE']);
    expect((await atlas.lastTrip(userId))?.countries).toEqual(['DE']);
    expect(await markedDone()).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('re-derives a region that moved inside the same country', async () => {
    const museum = await addPlace('Musee des Confluences', LYON, ['FR', 'FR-IDF', 'Ile-de-France']);

    expect(await atlas.repairStaleRegionCache()).toEqual({ replaced: 1, dropped: 0 });
    expect(await cachedRow(museum)).toEqual({ country_code: 'FR', region_code: 'FR-ARA' });
  });

  it('leaves good rows alone, the address fallback and rows only Nominatim could judge included', async () => {
    const paris = await addPlace('Louvre', PARIS, ['FR', 'FR-IDF', 'Ile-de-France']);
    const airbnb = await addPlace('Airbnb', BOLLENDORF_PONT, ['LU', 'LU-EC', 'Canton Echternach']);
    // The bundle calls this point Italian and has no region for it; the address backs the row.
    const harbour = await addPlace('Port Lympia', NICE_HARBOUR, ['FR', 'FR-PAC', "Provence-Alpes-Cote d'Azur"]);
    const ship = await addPlace('Cruise ship', { lat: 0.5, lng: -30, address: null }, ['BR', 'BR-PE', 'Pernambuco']);

    expect(await atlas.repairStaleRegionCache()).toEqual({ replaced: 0, dropped: 0 });
    expect(await cachedRow(paris)).toEqual({ country_code: 'FR', region_code: 'FR-IDF' });
    expect(await cachedRow(airbnb)).toEqual({ country_code: 'LU', region_code: 'LU-EC' });
    expect(await cachedRow(harbour)).toEqual({ country_code: 'FR', region_code: 'FR-PAC' });
    expect(await cachedRow(ship)).toEqual({ country_code: 'BR', region_code: 'BR-PE' });
  });

  it('drops a row the bundle cannot re-derive when coordinates and address both name another country', async () => {
    const beach = await addPlace('Beach hut', SYLT_BEACH, ['FR', 'FR-BRE', 'Bretagne']);
    const cleared = await addPlace('Somewhere', { lat: null, lng: null, address: null }, [
      'FR',
      'FR-IDF',
      'Ile-de-France',
    ]);

    expect(await atlas.repairStaleRegionCache()).toEqual({ replaced: 0, dropped: 2 });
    expect(await cachedRow(beach)).toBeUndefined();
    expect(await cachedRow(cleared)).toBeUndefined();
    // The dashboard, which reads only the cache, no longer counts France.
    expect((await atlas.getTravelStats(userId)).countries).toEqual([]);
  });

  it('does not write over a place that is edited while the pass runs', async () => {
    const hotel = await addPlace('Hotel Adlon', BERLIN, ['FR', 'FR-IDF', 'Ile-de-France']);
    const beach = await addPlace('Beach hut', SYLT_BEACH, ['FR', 'FR-BRE', 'Bretagne']);

    // Both places are edited once the pass has read their rows, before it writes.
    const read = PlaceRegionsRepository.prototype.listWithPlaceLocation;
    vi.spyOn(PlaceRegionsRepository.prototype, 'listWithPlaceLocation').mockImplementationOnce(async function (
      this: PlaceRegionsRepository,
    ) {
      const rows = await read.call(this);
      // test-sql-allow: an edit landing mid-pass has to reach the connection directly, past the pass's own ORM work.
      db.prepare('UPDATE places SET lat = ?, lng = ?, address = ? WHERE id = ?').run(
        MUNICH.lat,
        MUNICH.lng,
        MUNICH.address,
        hotel,
      );
      // test-sql-allow: an edit landing mid-pass has to reach the connection directly, past the pass's own ORM work.
      db.prepare("UPDATE places SET address = 'Westerland, Germany' WHERE id = ?").run(beach);
      // test-sql-allow: a fresh lookup landing mid-pass has to reach the connection directly, past the pass's own ORM work.
      db.prepare(
        "INSERT INTO place_regions (place_id, country_code, region_code, region_name) VALUES (?, 'DE', 'DE-SH', 'Schleswig-Holstein')",
      ).run(beach);
      return rows;
    });
    const upsert = vi.spyOn(PlaceRegionsRepository.prototype, 'upsertRegionWhileUnmoved');
    const drop = vi.spyOn(PlaceRegionsRepository.prototype, 'deleteRegionWhileUnmoved');

    expect(await atlas.repairStaleRegionCache()).toEqual({ replaced: 0, dropped: 0 });
    // The pass still meant to move the hotel to Berlin and drop the beach row; both writes were refused.
    expect(upsert).toHaveBeenCalledTimes(1);
    await expect(upsert.mock.results[0].value).resolves.toBe(false);
    expect(drop).toHaveBeenCalledTimes(1);
    await expect(drop.mock.results[0].value).resolves.toBe(false);
    // The trigger dropped the moved place's row and nothing wrote Berlin back.
    expect(await cachedRow(hotel)).toBeUndefined();
    // The row a fresh lookup wrote for the edited place stays.
    expect(await cachedRow(beach)).toEqual({ country_code: 'DE', region_code: 'DE-SH' });
  });

  it('runs once, and a second pass over the same rows changes nothing', async () => {
    // Enough rows for the pass to give way to other work along the way.
    const moved: number[] = [];
    for (let i = 0; i < 250; i++) moved.push(await addPlace(`Stop ${i}`, BERLIN, ['FR', 'FR-IDF', 'Ile-de-France']));

    await job.runOnce();
    expect((await Promise.all(moved.map(cachedRow))).every((row) => row?.region_code === 'DE-BE')).toBe(true);
    expect(await atlas.repairStaleRegionCache()).toEqual({ replaced: 0, dropped: 0 });

    // Marked as done, the next start does not read the cache again.
    const later = await addPlace('Later', BERLIN, ['FR', 'FR-IDF', 'Ile-de-France']);
    await job.runOnce();
    expect(await cachedRow(later)).toEqual({ country_code: 'FR', region_code: 'FR-IDF' });
  });

  it('is not marked as done when the pass fails, so the next start tries again', async () => {
    const hotel = await addPlace('Hotel Adlon', BERLIN, ['FR', 'FR-IDF', 'Ile-de-France']);
    vi.spyOn(atlas, 'repairStaleRegionCache').mockRejectedValueOnce(new Error('disk I/O error'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await job.runOnce();
    expect(await markedDone()).toBeUndefined();
    expect((await cachedRow(hotel))?.country_code).toBe('FR');

    await job.runOnce();
    expect(await markedDone()).toBeTruthy();
    expect((await cachedRow(hotel))?.country_code).toBe('DE');
  });

  it('starts from the boot hook, but not where the scheduler is off', async () => {
    const appSettings = await createTestAppSettingsRepo(db);
    const offJob = new PlaceRegionsRepairJob(atlas, registrar(false), appSettings);
    const onJob = new PlaceRegionsRepairJob(atlas, registrar(true), appSettings);
    const offRun = vi.spyOn(offJob, 'runOnce').mockResolvedValue();
    const onRun = vi.spyOn(onJob, 'runOnce').mockResolvedValue();

    offJob.onApplicationBootstrap();
    onJob.onApplicationBootstrap();

    expect(offRun).not.toHaveBeenCalled();
    expect(onRun).toHaveBeenCalledTimes(1);
  });
});

describe('the in-memory region cache (#2527)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('answers again when only the address of a border point changes', async () => {
    // Without an address this point falls to Nominatim, which is asked once.
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ address: { country_code: 'de', state: 'Rheinland-Pfalz', 'ISO3166-2-lvl4': 'DE-RP' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const before = await reverseGeocodeRegion(BOLLENDORF_PONT.lat, BOLLENDORF_PONT.lng, null);
    const after = await reverseGeocodeRegion(BOLLENDORF_PONT.lat, BOLLENDORF_PONT.lng, BOLLENDORF_PONT.address);
    const again = await reverseGeocodeRegion(BOLLENDORF_PONT.lat, BOLLENDORF_PONT.lng, null);

    expect(before?.country_code).toBe('DE');
    expect(after).toEqual({ country_code: 'LU', region_code: 'LU-EC', region_name: 'Canton Echternach' });
    expect(again?.country_code).toBe('DE');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
