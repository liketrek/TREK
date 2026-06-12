import { Module } from '@nestjs/common';
import { MapsController } from './maps.controller';
import { MapsService } from './maps.service';

/** Maps / geo domain (L3 leaf module). Registered in AppModule. */
@Module({
  controllers: [MapsController],
  providers: [MapsService],
})
export class MapsModule {}
