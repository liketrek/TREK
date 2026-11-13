import { MailIngestAddresses } from '../../db/entities/MailIngestAddresses.entity';
import { MailIngestCandidates } from '../../db/entities/MailIngestCandidates.entity';
import { MailIngestCursor } from '../../db/entities/MailIngestCursor.entity';
import { MailIngestMessages } from '../../db/entities/MailIngestMessages.entity';
import { MailIngestPrefs } from '../../db/entities/MailIngestPrefs.entity';
import { AddonsModule } from '../addons/addons.module';
import { AirportsModule } from '../airports/airports.module';
import { AppConfigModule } from '../app-config/app-config.module';
import { BookingImportModule } from '../booking-import/booking-import.module';
import { BudgetModule } from '../budget/budget.module';
import { DemoModule } from '../common/demo.module';
import { FilesModule } from '../files/files.module';
import { LlmParseModule } from '../llm-parse/llm-parse.module';
import { MapsModule } from '../maps/maps.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PlacesModule } from '../places/places.module';
import { ReservationsModule } from '../reservations/reservations.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { SettingsModule } from '../settings/settings.module';
import { MailIngestActionsService } from './mail-ingest-actions.service';
import { MailIngestAddressService } from './mail-ingest-address.service';
import { MailIngestApplyService } from './mail-ingest-apply.service';
import { MailIngestInboxService } from './mail-ingest-inbox.service';
import { MailIngestIntakeService } from './mail-ingest-intake.service';
import { MailIngestNotificationActions } from './mail-ingest-notification-actions';
import { MailIngestNotifyService } from './mail-ingest-notify.service';
import { MailIngestProcessJob } from './mail-ingest-process.job';
import { MailIngestProcessService } from './mail-ingest-process.service';
import { MailIngestReadingService } from './mail-ingest-reading.service';
import { MailIngestRetentionJob } from './mail-ingest-retention.job';
import { MailIngestSettingsService } from './mail-ingest-settings.service';
import { MailIngestTripsService } from './mail-ingest-trips.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * The booking mail import: a person forwards a booking mail to an address of
 * their own, and the booking lands in the matching trip, or waits in their
 * inbox with a reason. Transports (IMAP, the signed webhook, the TREK Cloud
 * relay, an .eml upload) only hand mail to MailIngestIntakeService; the
 * processing job reads it; everything a person does with an entry goes
 * through MailIngestActionsService.
 */
@Module({
  imports: [
    AppConfigModule,
    DemoModule,
    SettingsModule,
    AddonsModule,
    PermissionsModule,
    ReservationsModule,
    PlacesModule,
    BudgetModule,
    FilesModule,
    MapsModule,
    AirportsModule,
    NotificationsModule,
    BookingImportModule,
    LlmParseModule,
    SchedulingModule,
    MikroOrmModule.forFeature([
      MailIngestAddresses,
      MailIngestPrefs,
      MailIngestCursor,
      MailIngestMessages,
      MailIngestCandidates,
    ]),
  ],
  providers: [
    MailIngestSettingsService,
    MailIngestTripsService,
    MailIngestAddressService,
    MailIngestIntakeService,
    MailIngestReadingService,
    MailIngestApplyService,
    MailIngestNotifyService,
    MailIngestProcessService,
    MailIngestActionsService,
    MailIngestInboxService,
    MailIngestNotificationActions,
    MailIngestProcessJob,
    MailIngestRetentionJob,
  ],
  exports: [MailIngestSettingsService, MailIngestAddressService, MailIngestIntakeService, MailIngestActionsService],
})
export class MailIngestModule {}
