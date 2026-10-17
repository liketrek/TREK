import { WeatherController } from './weather.controller';
import { WeatherMcp } from './weather.mcp';
import { WeatherRpc } from './weather.rpc';
import { WeatherService } from './weather.service';
import { WindService } from './wind.service';
import { Module } from '@nestjs/common';

/** Weather domain (pilot leaf module). Registered in AppModule. */
@Module({
  controllers: [WeatherController],
  providers: [WeatherService, WindService, WeatherMcp, WeatherRpc],
})
export class WeatherModule {}
