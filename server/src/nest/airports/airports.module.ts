import { Module } from '@nestjs/common';
import { AirportsController } from './airports.controller';
import { AirportsService } from './airports.service';

/** Airports domain (L2 leaf module). Registered in AppModule. */
@Module({
  controllers: [AirportsController],
  providers: [AirportsService],
})
export class AirportsModule {}
