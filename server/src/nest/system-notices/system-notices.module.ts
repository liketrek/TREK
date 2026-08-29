import { AddonsModule } from '../addons/addons.module';
import { AppConfigModule } from '../app-config/app-config.module';
import { SystemNoticesController } from './system-notices.controller';
import { SystemNoticesService } from './system-notices.service';
import { Module } from '@nestjs/common';

/** System-notices domain. Registered in AppModule. */
@Module({
  imports: [AppConfigModule, AddonsModule],
  controllers: [SystemNoticesController],
  providers: [SystemNoticesService],
})
export class SystemNoticesModule {}
