import { Module } from '@nestjs/common';
import { TripShareController, SharedController } from './share.controller';
import { ShareService } from './share.service';

@Module({
  controllers: [TripShareController, SharedController],
  providers: [ShareService],
})
export class ShareModule {}
