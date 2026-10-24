import { WeatherController } from './weather.controller';
import { WeatherMcp } from './weather.mcp';
import { WeatherRpc } from './weather.rpc';
import { WeatherService } from './weather.service';
import { WindService } from './wind.service';
import { Module } from '@nestjs/common';

/**
 * Weather domain (pilot leaf module). Registered in AppModule. WeatherService
 * is exported for the hikes a traveller plans, whose day reads the detailed
 * weather at the way's highest point.
 */
@Module({
  controllers: [WeatherController],
  providers: [WeatherService, WindService, WeatherMcp, WeatherRpc],
  exports: [WeatherService],
})
export class WeatherModule {}
