import { Module } from '@nestjs/common';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { WeatherMcp } from './weather.mcp';

/** Weather domain (pilot leaf module). Registered in AppModule. */
@Module({
  controllers: [WeatherController],
  providers: [WeatherService, WeatherMcp],
})
export class WeatherModule {}
