import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AddonsModule } from '../addons/addons.module';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { FilesModule } from '../files/files.module';
import { AllowedFileTypesModule } from '../files/allowed-file-types.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { StorageModule } from '../storage/storage.module';
import { DocumentConnections } from '../../db/entities/DocumentConnections.entity';
import { DocumentProviders } from '../../db/entities/DocumentProviders.entity';
import { DocumentProviderFields } from '../../db/entities/DocumentProviderFields.entity';
import { TripDocumentLinks } from '../../db/entities/TripDocumentLinks.entity';
import { DocumentSyncItems } from '../../db/entities/DocumentSyncItems.entity';
import { TripFiles } from '../../db/entities/TripFiles.entity';
import { FileLinks } from '../../db/entities/FileLinks.entity';
import { AppSettings } from '../../db/entities/AppSettings.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { DocSyncConfigService } from './doc-sync-config.service';
import { DocSyncController } from './doc-sync.controller';
import { DocSyncWebhookController } from './doc-sync-webhook.controller';
import { DocSyncJob } from './doc-sync.job';
import { DocSyncMcp } from './doc-sync.mcp';
import { DocSyncService } from './doc-sync.service';
import { DOCUMENT_PROVIDERS, type DocumentProvider } from './document-provider';
import { DocumentProviderRegistry } from './document-provider.registry';
import { PaperlessDocumentProvider } from './providers/paperless.provider';
import { PapraDocumentProvider } from './providers/papra.provider';
import { SynologyDriveDocumentProvider } from './providers/synology-drive.provider';
import { NextcloudDocumentProvider, OpencloudDocumentProvider } from './providers/webdav.provider';
import { PaperlessClient } from './providers/paperless.client';
import { PapraClient } from './providers/papra.client';
import { SynologyDriveClient } from './providers/synology-drive.client';
import { WebdavClient } from './providers/webdav.client';

/**
 * Document sync: one provider connection per trip, both directions.
 *
 * Its own domain rather than an extension of `files/`, because that domain's
 * coverage ratchet sits at 97/95 and would now be measuring four HTTP clients
 * and a cron job; and not under `integrations/`, whose ratchet is 78/68 and
 * would be dragged down by new code landing there. The seam is clean anyway:
 * this module consumes FilesService and StorageService and nothing consumes it.
 *
 * Nextcloud and OpenCloud are two registrations of one WebDAV adapter. They are
 * separate ids because the admin toggles, the credential fields and the scope
 * concept differ (a folder with an `oc:fileid` versus a space with a
 * `driveId`), but the protocol underneath is the same and so is the code.
 *
 * `MikroOrmModule.forFeature` registers every entity this domain's
 * `@InjectRepository` constructors need (Plan 3h Task 5) — the five
 * doc-sync-owned tables (`DocumentConnections`/`DocumentProviders`/
 * `DocumentProviderFields`/`TripDocumentLinks`/`DocumentSyncItems`) plus the
 * three it reads/writes additive methods on (`TripFiles`/`FileLinks`, 3e —
 * DS4/DS15/DS16/DS19/DS29/DS32/DS36's cross-domain statements;
 * `AppSettings`, 3a — the job's self-throttle and the webhook's kill
 * switch) and `Trips` (3c — `DocSyncConfigService.assertCanManage`'s
 * trip-owner check, R2).
 */
@Module({
  imports: [
    StorageModule,
    FilesModule,
    AllowedFileTypesModule,
    PermissionsModule,
    RealtimeModule,
    SchedulingModule,
    AddonsModule,
    
    McpSharedModule,
    MikroOrmModule.forFeature([
      DocumentConnections,
      DocumentProviders,
      DocumentProviderFields,
      TripDocumentLinks,
      DocumentSyncItems,
      TripFiles,
      FileLinks,
      AppSettings,
      Trips,
    ]),
  ],
  controllers: [DocSyncController, DocSyncWebhookController],
  providers: [
    DocSyncConfigService,
    DocSyncService,
    DocSyncJob,
    DocSyncMcp,
    DocumentProviderRegistry,
    // The HTTP clients are providers of their own: each is the ONLY file that
    // talks to its instance, which makes it the one thing a test has to replace
    // to be sure a suite never opens a socket.
    PaperlessClient,
    PapraClient,
    SynologyDriveClient,
    WebdavClient,
    PaperlessDocumentProvider,
    PapraDocumentProvider,
    NextcloudDocumentProvider,
    OpencloudDocumentProvider,
    SynologyDriveDocumentProvider,
    {
      provide: DOCUMENT_PROVIDERS,
      useFactory: (
        paperless: PaperlessDocumentProvider,
        papra: PapraDocumentProvider,
        nextcloud: NextcloudDocumentProvider,
        opencloud: OpencloudDocumentProvider,
        synology: SynologyDriveDocumentProvider,
      ): readonly DocumentProvider[] => [paperless, papra, nextcloud, opencloud, synology],
      inject: [
        PaperlessDocumentProvider,
        PapraDocumentProvider,
        NextcloudDocumentProvider,
        OpencloudDocumentProvider,
        SynologyDriveDocumentProvider,
      ],
    },
  ],
  exports: [DocSyncConfigService, DocSyncService],
})
export class DocSyncModule {}
