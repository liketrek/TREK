/**
 * The whole application container, booted once per test file for suites that
 * drive a cross-domain surface (the MCP tools, the plugin RPC host) rather
 * than one domain.
 *
 * It is AppModule itself, over the `src/db/database` handle the suite mocks
 * with a snapshot db, so every service, controller and discovery registry is
 * the one production builds. Suites used to rebuild that graph by hand with
 * positional constructor calls, which every new dependency broke; now a
 * dependency a service gains reaches these suites through its module.
 *
 * What the container would otherwise reach outside the process is replaced,
 * the same stand-ins the hand-built graphs used:
 *   - RealtimeService: the suite's FakeRealtimeService (or a fresh one), so
 *     broadcasts are recorded instead of delivered;
 *   - the reverse geocoder behind the journey photo capture, which would ask
 *     Nominatim for every attached provider photo;
 *   - StorageService: a real local driver in a throwaway directory
 *     (makeStorageFixture), so nothing a suite uploads lands in server/uploads.
 *
 * The container is built on the first call and handed out again for the same
 * RealtimeService, so a suite that opens a harness per case boots once. Lifecycle
 * hooks run (discovery fills the MCP and plugin registries in onModuleInit);
 * the HTTP server and the websocket gateway are never bound, since no app is
 * created on top of the module.
 */
import { AppModule } from '../../src/nest/app.module';
import { JourneyDomainService } from '../../src/nest/journey/journey-domain.service';
import { JourneyPhotoCaptureService } from '../../src/nest/journey/journey-photo-capture.service';
import type { MapsService } from '../../src/nest/maps/maps.service';
import { PhotoCaptureBackfillService } from '../../src/nest/memories/photo-capture-backfill.service';
import { RealtimeService } from '../../src/nest/realtime/realtime.service';
import { StorageService } from '../../src/nest/storage/storage.service';
import { FakeRealtimeService } from './fake-realtime';
import { makeStorageFixture } from './storage-fixture';
import { MikroORM } from '@mikro-orm/core';
import { Test, type TestingModule } from '@nestjs/testing';

/** The geocoder the capture asks for a place name: nothing known, without leaving the process. */
const offlineGeocoder = {
  reverseGeocode: async () => ({ name: null, address: null }),
} as unknown as MapsService;

const booted = new Map<RealtimeService, Promise<TestingModule>>();

async function boot(realtime: RealtimeService): Promise<TestingModule> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(RealtimeService)
    .useValue(realtime)
    .overrideProvider(StorageService)
    .useValue(makeStorageFixture('').storage)
    .overrideProvider(JourneyPhotoCaptureService)
    .useFactory({
      factory: (backfill: PhotoCaptureBackfillService, journey: JourneyDomainService, orm: MikroORM) =>
        new JourneyPhotoCaptureService(backfill, journey, offlineGeocoder, orm),
      inject: [PhotoCaptureBackfillService, JourneyDomainService, MikroORM],
    })
    .compile();
  await moduleRef.init();
  return moduleRef;
}

/**
 * The booted container for this test file. Pass the suite's FakeRealtimeService
 * to assert on broadcasts; without one, the file shares a container whose fake
 * nobody reads.
 */
export function bootTestApp(realtime?: RealtimeService): Promise<TestingModule> {
  const key = realtime ?? defaultRealtime();
  const existing = booted.get(key);
  if (existing !== undefined) return existing;
  const pending = boot(key);
  booted.set(key, pending);
  return pending;
}

let sharedRealtime: FakeRealtimeService | undefined;
function defaultRealtime(): FakeRealtimeService {
  sharedRealtime ??= new FakeRealtimeService();
  return sharedRealtime;
}
