import { Module } from '@nestjs/common';
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
 *  the plugin RPC surface, HostSurfaceRpc). */
@Module({
  imports: [AuthModule, MailerModule, SchedulingModule, StorageModule],
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
