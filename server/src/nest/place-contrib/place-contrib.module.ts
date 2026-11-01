import { PlaceContribLog } from '../../db/entities/PlaceContribLog.entity';
import { PlaceContribOutbox } from '../../db/entities/PlaceContribOutbox.entity';
import { AppConfigModule } from '../app-config/app-config.module';
import { AuditModule } from '../audit/audit.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { ServiceIdentityModule } from '../service-identity/service-identity.module';
import { SettingsModule } from '../settings/settings.module';
import { StorageModule } from '../storage/storage.module';
import { PlaceContribSender } from './place-contrib-sender.service';
import { PlaceContribSettings } from './place-contrib-settings';
import { PlaceContribStorageRefsService } from './place-contrib-storage-refs.service';
import { PlaceContribClient } from './place-contrib.client';
import { PlaceContribController } from './place-contrib.controller';
import { PlaceContribJob } from './place-contrib.job';
import { PlaceContribService } from './place-contrib.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * Community enrichment of place details: the admin's decision, the queue of
 * values users typed in, the cron that sends them to the TREK Places API and
 * the transmission log. Exports PlaceContribService for the places domain,
 * whose origin tracking feeds the queue after every place write.
 */
@Module({
  imports: [
    AppConfigModule,
    AuditModule,
    SchedulingModule,
    ServiceIdentityModule,
    SettingsModule,
    StorageModule,
    MikroOrmModule.forFeature([PlaceContribOutbox, PlaceContribLog]),
  ],
  controllers: [PlaceContribController],
  providers: [
    PlaceContribService,
    PlaceContribSettings,
    PlaceContribClient,
    PlaceContribSender,
    PlaceContribJob,
    PlaceContribStorageRefsService,
  ],
  exports: [PlaceContribService],
})
export class PlaceContribModule {}
