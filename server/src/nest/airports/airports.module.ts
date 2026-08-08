import { Module } from '@nestjs/common';
import { AirportsController } from './airports.controller';
import { AirportsService } from './airports.service';
import { DatabaseModule } from '../database/database.module';
import { AirportsMcp } from './airports.mcp';

/** Airports domain (L2 leaf module). Registered in AppModule.
 *  DatabaseModule is imported explicitly: the flight-endpoint backfill needs the
 *  connection, and @Global only reaches modules that are in the graph — which
 *  the airports e2e TestingModule is not. */
@Module({
  imports: [DatabaseModule],
  controllers: [AirportsController],
  providers: [AirportsService, AirportsMcp],
})
export class AirportsModule {}
