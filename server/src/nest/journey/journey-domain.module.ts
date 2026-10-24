import { JourneyContributors } from '../../db/entities/JourneyContributors.entity';
import { JourneyEntries } from '../../db/entities/JourneyEntries.entity';
import { JourneyEntryPhotos } from '../../db/entities/JourneyEntryPhotos.entity';
import { JourneyEntryStays } from '../../db/entities/JourneyEntryStays.entity';
import { JourneyPhotos } from '../../db/entities/JourneyPhotos.entity';
import { JourneyRecordedDays } from '../../db/entities/JourneyRecordedDays.entity';
import { JourneyRecordingPrep } from '../../db/entities/JourneyRecordingPrep.entity';
import { JourneyShareTokens } from '../../db/entities/JourneyShareTokens.entity';
import { JourneyTrips } from '../../db/entities/JourneyTrips.entity';
import { Journeys } from '../../db/entities/Journeys.entity';
import { Places } from '../../db/entities/Places.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { PluginGuardsModule } from '../../nest-rpc/plugin-guards.module';
import { TrekPhotosModule } from '../photos/trek-photos.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { SettingsModule } from '../settings/settings.module';
import { JourneyDomainService } from './journey-domain.service';
import { JourneyEntryStaysService } from './journey-entry-stays.service';
import { JourneyMapService } from './journey-map.service';
import { JourneyRecordedDaysService } from './journey-recorded-days.service';
import { JourneyRecordingPrepService } from './journey-recording-prep.service';
import { JourneyShareService } from './journey-share.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * Leaf module holding the journey domain itself, without the controllers.
 *
 * Places, assignments and the plugin host each need a handful of journey
 * functions; importing the full JourneyModule for that would drag MemoriesModule
 * (and with it both photo providers) into their graphs. This carries the two
 * services and nothing else - same shape as TrekPhotosModule.
 *
 * JournalRpc moved out to JournalRpcModule when it started writing photo bytes:
 * that needs StorageService and MemoriesModule, and pulling those in here would
 * undo the whole point of this module.
 *
 * RealtimeModule is imported explicitly even though it is @Global, so a
 * single-domain e2e TestingModule can still resolve the broadcast.
 *
 * SettingsModule is the one addition to that shape: the public journey payload
 * carries the owner's CARTO tile key, and resolving that (per-user value, admin
 * instance default, managed-instance key, all decrypted) is SettingsService's
 * job rather than a second copy of its SQL here.
 *
 * `MikroOrmModule.forFeature([Journeys, JourneyContributors, JourneyTrips,
 * JourneyEntries, Trips, JourneyPhotos, JourneyEntryPhotos, Places])`
 * registers `JourneysRepository`/`JourneyContributorsRepository`/
 * `JourneyTripsRepository`/`JourneyEntriesRepository`/`TripsRepository` for
 * `JourneyDomainService`'s `@InjectRepository` constructor params (Plan 3g
 * Task 1, Part A — the FIRST `forFeature` array this module declares; no
 * other module injects a `Journey*Repository` directly, every downstream
 * consumer reaches this cluster only through `JourneyDomainService`/
 * `JourneyShareService`, per the program's own boot-gate note for this
 * task). `Trips` is included the same way `days.module.ts`/
 * `memories.module.ts` each register it locally for their own
 * `@InjectRepository(Trips)` param — every module that constructs a service
 * needing a repository lists that entity in its own `forFeature`.
 * `JourneyPhotos`/`JourneyEntryPhotos`/`Places` are Plan 3g Task 2's own
 * additions: `JourneyDomainService`'s Part B (journey stats, entries CRUD,
 * the full photos surface, contributors CRUD, suggestions) needed
 * `JourneyPhotosRepository`/`JourneyEntryPhotosRepository` (JG19/JG87-116,
 * finishing JG15/JG19 too) and `PlacesRepository` (JG44's `findRaw`) — a
 * genuine new-constructor-parameter case the task brief's own contingency
 * covers (flagged in `task-2-report.md`).
 * `JourneyShareTokens` is Plan 3g Task 3's own addition: `JourneyShareService`
 * (also provided here) now injects `JourneyShareTokensRepository` directly
 * for JS1-JS15, plus reuses the already-registered `JourneysRepository` for
 * JS8/JS12 — no other module needed touching since both were already in
 * this array or this module's own provider graph.
 * `JourneyRecordedDays` (JRN-01) is the days of recorded route a journey
 * keeps; `JourneyRecordedDaysService` reads and writes them here, so the map
 * needs nothing of the integration they were taken over from.
 * `JourneyEntryStays` (JRN-02) is the recorded stays an entry was taken over
 * from, held by `JourneyEntryStaysService` for the same reason.
 * `JourneyRecordingPrep` (JRN-03) is how far preparing a journey's recorded
 * days got for each person; `JourneyRecordingPrepService` keeps it and tells
 * the Dawarich sync which journeys to read.
 * `JourneyMapService` (JRN-04) reads what the journey map shows besides its
 * entries and photos, for the journey's people and for its share link, from
 * the tables already registered here.
 */
@Module({
  imports: [
    RealtimeModule,
    TrekPhotosModule,
    PluginGuardsModule,
    SettingsModule,
    MikroOrmModule.forFeature([
      Journeys,
      JourneyContributors,
      JourneyTrips,
      JourneyEntries,
      Trips,
      JourneyPhotos,
      JourneyEntryPhotos,
      Places,
      JourneyShareTokens,
      JourneyRecordedDays,
      JourneyEntryStays,
      JourneyRecordingPrep,
    ]),
  ],
  providers: [
    JourneyDomainService,
    JourneyShareService,
    JourneyRecordedDaysService,
    JourneyEntryStaysService,
    JourneyRecordingPrepService,
    JourneyMapService,
  ],
  exports: [
    JourneyDomainService,
    JourneyShareService,
    JourneyRecordedDaysService,
    JourneyEntryStaysService,
    JourneyRecordingPrepService,
    JourneyMapService,
  ],
})
export class JourneyDomainModule {}
