import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { StorageModule } from '../storage/storage.module';
import { MailerModule } from './mailer/mailer.module';
import { NotificationPreferencesService } from './notification-preferences.service';
import { AdminNotificationPreferencesController, NotificationsController } from './notifications.controller';
import { NotificationsMcp } from './notifications.mcp';
import { NotificationsService } from './notifications.service';
import { ReminderJobsService } from './reminder-jobs.service';
import { StorageHealthNotifierService } from './storage-health-notifier.service';
import { NtfyService } from './transports/ntfy.service';
import { WebhookService } from './transports/webhook.service';
import { WebPushService } from './web-push.service';
import { Module } from '@nestjs/common';

/** Notifications domain (L6 leaf module). Registered in AppModule.
 *  AuthModule feeds NotificationsMcp's demo gate; MailerModule carries SMTP,
 *  which lives outside this module so AuthService can send the password-reset
 *  mail without AuthModule and NotificationsModule importing each other.
 *  StorageModule feeds StorageHealthNotifierService, which bridges replica
 *  failures into admin notifications — this direction has no cycle (Storage
 *  imports only AppConfig+Audit+Scheduling).
 *  NotificationsService and NotificationPreferencesService are exported for
 *  in-container consumers (AdminController's dev test send and preferences tab,
 *  the plugin RPC surface, HostSurfaceRpc). */
@Module({
  imports: [AuthModule, MailerModule, SchedulingModule, StorageModule, AuditModule],
  controllers: [NotificationsController, AdminNotificationPreferencesController],
  providers: [
    NotificationsService,
    NotificationPreferencesService,
    WebhookService,
    NtfyService,
    NotificationsMcp,
    ReminderJobsService,
    StorageHealthNotifierService,
    WebPushService,
  ],
  exports: [NotificationsService, NotificationPreferencesService, WebPushService],
})
export class NotificationsModule {}
