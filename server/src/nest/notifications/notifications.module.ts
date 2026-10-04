import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AdminNotificationPreferencesController, NotificationsController } from './notifications.controller';
import { NotificationsMcp } from './notifications.mcp';
import { NotificationsService } from './notifications.service';
import { NotificationPreferencesService } from './notification-preferences.service';
import { ReminderJobsService } from './reminder-jobs.service';
import { StorageHealthNotifierService } from './storage-health-notifier.service';
import { NtfyService } from './transports/ntfy.service';
import { WebhookService } from './transports/webhook.service';
import { WebPushService } from './transports/web-push.service';
import { PushController } from './push/push.controller';
import { PushSubscriptionsService } from './push/push-subscriptions.service';
import { VapidKeysService } from './push/vapid-keys.service';
import { MailerModule } from './mailer/mailer.module';
import { AuthModule } from '../auth/auth.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { StorageModule } from '../storage/storage.module';
import { Notifications } from '../../db/entities/Notifications.entity';
import { NotificationChannelPreferences } from '../../db/entities/NotificationChannelPreferences.entity';
import { AppSettings } from '../../db/entities/AppSettings.entity';
import { Settings } from '../../db/entities/Settings.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { TodoItems } from '../../db/entities/TodoItems.entity';
import { PushSubscriptions } from '../../db/entities/PushSubscriptions.entity';

/** Notifications domain (L6 leaf module). Registered in AppModule.
 *  AuthModule feeds NotificationsMcp's demo gate; MailerModule carries SMTP,
 *  which lives outside this module so AuthService can send the password-reset
 *  mail without AuthModule and NotificationsModule importing each other.
 *  StorageModule feeds StorageHealthNotifierService, which bridges replica
 *  failures into admin notifications — this direction has no cycle (Storage
 *  imports only AppConfig+Audit+Scheduling).
 *  Web Push (#894) lives in push/: VapidKeysService holds the server's key
 *  pair, PushSubscriptionsService the browsers, PushController the routes
 *  a browser signs up through; the transport is transports/web-push.service.ts.
 *  NotificationsService and NotificationPreferencesService are exported for
 *  in-container consumers (AdminController's dev test send and preferences tab,
 *  the plugin RPC surface, HostSurfaceRpc).
 *  MikroOrmModule.forFeature([Notifications, NotificationChannelPreferences,
 *  AppSettings, Settings, Trips, TodoItems]) (Plan 3f Task 3, extended by
 *  Task 4) registers NotificationsRepository/
 *  NotificationChannelPreferencesRepository/AppSettingsRepository for
 *  NotificationsService/NotificationPreferencesService's @InjectRepository
 *  constructor params, plus SettingsRepository (NtfyService/WebhookService)
 *  and TripsRepository/TodoItemsRepository (ReminderJobsService) — the
 *  TodoModule/PermissionsModule precedent. PushSubscriptions (#894) backs
 *  PushSubscriptionsService; VapidKeysService reads its key pair through the
 *  AppSettingsRepository registered above. Only this module needs the
 *  registration: WebhookService/NtfyService/ReminderJobsService/
 *  NotificationsService/NotificationPreferencesService are providers here
 *  alone, every other module injects the exported singleton (or, for
 *  MailerService, goes through MailerModule's own forFeature) rather than
 *  declaring its own. */
@Module({
  imports: [
    MikroOrmModule.forFeature([
      Notifications,
      NotificationChannelPreferences,
      AppSettings,
      Settings,
      Trips,
      TodoItems,
      PushSubscriptions,
    ]),
    AuthModule,
    MailerModule,
    SchedulingModule,
    StorageModule,
  ],
  controllers: [NotificationsController, AdminNotificationPreferencesController, PushController],
  providers: [
    NotificationsService,
    NotificationPreferencesService,
    WebhookService,
    NtfyService,
    WebPushService,
    VapidKeysService,
    PushSubscriptionsService,
    NotificationsMcp,
    ReminderJobsService,
    StorageHealthNotifierService,
  ],
  exports: [NotificationsService, NotificationPreferencesService],
})
export class NotificationsModule {}
