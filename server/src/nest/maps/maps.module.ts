import { Module } from '@nestjs/common';
import { MapsController } from './maps.controller';
import { MapsService } from './maps.service';
import { MapsMcp } from './maps.mcp';

/**
 * Maps / geo domain (L3 leaf module). Registered in AppModule. Exports
 * MapsService for the in-container consumers (BookingImportModule's Nominatim
 * geocoding, PlacesModule's search_place tool and list-import enrichment).
 * Nothing outside the container consumes this domain, so there is no bridge.
 */
@Module({
  controllers: [MapsController],
  providers: [MapsService, MapsMcp],
  exports: [MapsService],
})
export class MapsModule {}
