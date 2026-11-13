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
import { RateLimitModule } from '../common/rate-limit.module';
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
import { MailIngestAdminController } from './mail-ingest-admin.controller';
import { MailIngestApplyService } from './mail-ingest-apply.service';
import { MailIngestImapClient } from './mail-ingest-imap.client';
import { MailIngestImapJob } from './mail-ingest-imap.job';
import { MailIngestInboundController } from './mail-ingest-inbound.controller';
import { MailIngestInboxService } from './mail-ingest-inbox.service';
import { MailIngestIntakeService } from './mail-ingest-intake.service';
import { MailIngestNotificationActions } from './mail-ingest-notification-actions';
import { MailIngestNotifyService } from './mail-ingest-notify.service';
import { MailIngestPauseJob } from './mail-ingest-pause.job';
import { MailIngestProcessJob } from './mail-ingest-process.job';
import { MailIngestProcessService } from './mail-ingest-process.service';
import { MailIngestReadingService } from './mail-ingest-reading.service';
import { MailIngestRelayJob } from './mail-ingest-relay.job';
import { MailIngestRelayHost } from './mail-ingest-relay.service';
import { MailIngestRetentionJob } from './mail-ingest-retention.job';
import { MailIngestSettingsService } from './mail-ingest-settings.service';
import { MailIngestStatusService } from './mail-ingest-status.service';
import { MailIngestTripController } from './mail-ingest-trip.controller';
import { MailIngestTripsService } from './mail-ingest-trips.service';
import { MailIngestWebhookService } from './mail-ingest-webhook.service';
import { MailIngestController } from './mail-ingest.controller';
import { MailIngestMcp } from './mail-ingest.mcp';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * The booking mail import: a person forwards a booking mail to an address of
 * their own, and the booking lands in the matching trip, or waits in their
 * inbox with a reason. Transports (the IMAP job, the signed webhook, the
 * TREK Cloud relay job, an .eml upload) only hand mail to
 * MailIngestIntakeService; the processing job reads it; everything a person
 * does with an entry goes through MailIngestActionsService, from REST and
 * MCP alike. MailIngestRelayHost is exported for the managed build, which
 * attaches its control-plane client to it.
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
    RateLimitModule,
    MikroOrmModule.forFeature([
      MailIngestAddresses,
      MailIngestPrefs,
      MailIngestCursor,
      MailIngestMessages,
      MailIngestCandidates,
    ]),
  ],
  controllers: [
    MailIngestController,
    MailIngestTripController,
    MailIngestAdminController,
    MailIngestInboundController,
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
    MailIngestStatusService,
    MailIngestWebhookService,
    MailIngestImapClient,
    MailIngestRelayHost,
    MailIngestMcp,
    MailIngestNotificationActions,
    MailIngestProcessJob,
    MailIngestRetentionJob,
    MailIngestImapJob,
    MailIngestRelayJob,
    MailIngestPauseJob,
  ],
  exports: [
    MailIngestSettingsService,
    MailIngestAddressService,
    MailIngestIntakeService,
    MailIngestActionsService,
    MailIngestRelayHost,
  ],
})
export class MailIngestModule {}
