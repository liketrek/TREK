import { RateLimitService } from '../auth/rate-limit.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Module } from '@nestjs/common';

/** Notifications domain (L6 leaf module). Registered in AppModule. */
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, RateLimitService],
})
export class NotificationsModule {}
