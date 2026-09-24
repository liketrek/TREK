import { Module } from '@nestjs/common';
import { AllowedFileTypesModule } from '../files/allowed-file-types.module';
import { MemoriesModule } from '../memories/memories.module';
import { PluginGuardsModule } from '../plugins/host/plugin-guards.module';
import { StorageModule } from '../storage/storage.module';
import { JourneyDomainModule } from './journey-domain.module';
import { JournalRpc } from './journal.rpc';

/**
 * The journal plugin surface, in its own container.
 *
 * JournalRpc used to sit in JourneyDomainModule, and it cannot stay there now
 * that it writes photo bytes: that needs StorageService and, for the EXIF
 * backfill, PhotoCaptureBackfillService out of MemoriesModule. JourneyDomainModule
 * exists precisely so places, assignments and the plugin host can reach a few
 * journey functions WITHOUT dragging MemoriesModule and both photo providers into
 * their graphs (see the comment there), so the dependency goes here instead and
 * only the plugin host pays for it.
 *
 * JourneyDomainModule is re-exported so importing this one is a superset of
 * importing that one, and nothing that already depended on it has to change.
 */
@Module({
  imports: [JourneyDomainModule, StorageModule, AllowedFileTypesModule, MemoriesModule, PluginGuardsModule],
  providers: [JournalRpc],
  exports: [JourneyDomainModule],
})
export class JournalRpcModule {}
