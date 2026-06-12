import { Module } from '@nestjs/common';
import { SystemNoticesController } from './system-notices.controller';
import { SystemNoticesService } from './system-notices.service';

/** System-notices domain (L2 leaf module). Registered in AppModule. */
@Module({
  controllers: [SystemNoticesController],
  providers: [SystemNoticesService],
})
export class SystemNoticesModule {}
