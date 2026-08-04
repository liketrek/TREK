import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsMcp } from './notifications.mcp';
import { NotificationsService } from './notifications.service';
import { AuthModule } from '../auth/auth.module';

/** Notifications domain (L6 leaf module). Registered in AppModule.
 *  AuthModule feeds NotificationsMcp's demo gate; NotificationsService is
 *  exported for in-container consumers (AdminController's dev test send and
 *  the plugin RPC host's PluginHostDepsFactory). */
@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsMcp],
  exports: [NotificationsService],
})
export class NotificationsModule {}
