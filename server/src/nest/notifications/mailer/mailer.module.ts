import { Module } from '@nestjs/common';
import { MailerService } from './mailer.service';

/**
 * Outgoing SMTP. A leaf module on purpose: AuthModule imports it for the
 * password-reset mail, and NotificationsModule imports it for the email
 * channel. Since NotificationsModule already imports AuthModule (the demo gate
 * in NotificationsMcp), the mailer living in the notifications domain would
 * close a hard cycle — this module is what keeps it a DAG without a forwardRef.
 */
@Module({
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule {}
