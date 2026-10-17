import { AppSettings } from '../../../db/entities/AppSettings.entity';
import { Settings } from '../../../db/entities/Settings.entity';
import { Users } from '../../../db/entities/Users.entity';
import { MailerService } from './mailer.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * Outgoing SMTP. A leaf module on purpose: AuthModule imports it for the
 * password-reset mail, and NotificationsModule imports it for the email
 * channel. Since NotificationsModule already imports AuthModule (the demo gate
 * in NotificationsMcp), the mailer living in the notifications domain would
 * close a hard cycle — this module is what keeps it a DAG without a forwardRef.
 *
 * `MikroOrmModule.forFeature([Users, Settings, AppSettings])` (Plan 3f Task
 * 4) registers `UsersRepository`/`SettingsRepository`/`AppSettingsRepository`
 * for `MailerService`'s `@InjectRepository`-free constructor-injected
 * repositories — this module is the ONLY place `MailerService` is a
 * provider (`AuthModule`/`NotificationsModule` both just import this module
 * and reuse the exported singleton), so no other module needs the
 * registration.
 */
@Module({
  imports: [MikroOrmModule.forFeature([Users, Settings, AppSettings])],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule {}
