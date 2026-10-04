import { Module } from '@nestjs/common';
import { AllowedFileTypesModule } from '../files/allowed-file-types.module';
import { PluginGuardsModule } from '../plugins/host/plugin-guards.module';
import { StorageModule } from '../storage/storage.module';
import { DemoModule } from '../common/demo.module';
import { JourneyDomainModule } from './journey-domain.module';
import { JourneyPhotoCaptureModule } from './journey-photo-capture.module';
import { JournalRpc } from './journal.rpc';

/**
 * The journal plugin surface, in its own container.
 *
 * JournalRpc used to sit in JourneyDomainModule, and it cannot stay there now
 * that it writes photo bytes: that needs StorageService and, for the EXIF
 * backfill, JourneyPhotoCaptureModule, which brings MemoriesModule with it.
 * JourneyDomainModule exists precisely so places, assignments and the plugin
 * host can reach a few journey functions WITHOUT dragging MemoriesModule and
 * both photo providers into their graphs (see the comment there), so the
 * dependency goes here instead and only the plugin host pays for it.
 *
 * JourneyDomainModule is re-exported so importing this one is a superset of
 * importing that one, and nothing that already depended on it has to change.
 *
 * `DemoModule` is imported explicitly (Plan 3i Task 4 fix wave's own
 * precedent, restated here — Plan 3j Task 5, SV8): `DemoService` is
 * `@Global()`, but that broadcast only reaches a module graph that actually
 * imports it somewhere — a hand-built e2e `TestingModule` that never pulls in
 * `AppModule` otherwise leaves `JournalRpc`'s `DemoService` dependency
 * unresolved. The earlier `MikroOrmModule.forFeature([Users])` entry (Plan 3g
 * Task 3, `JournalRpc`'s own `UsersRepository.getEmail` injection) is gone —
 * `DemoService.isDemoUserId` resolves `Users` through its OWN constructor
 * (an injected `EntityManager`, not `@InjectRepository`), so this module no
 * longer needs the entity registered for that call.
 */
@Module({
  imports: [JourneyDomainModule, StorageModule, AllowedFileTypesModule, JourneyPhotoCaptureModule, PluginGuardsModule, DemoModule],
  providers: [JournalRpc],
  exports: [JourneyDomainModule],
})
export class JournalRpcModule {}
