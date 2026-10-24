import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ResponseContract } from '../common/response-contract';
import { WindQueryDto } from './dto/wind-query.dto';
import { ApiError } from './weather.impl';
import { WeatherService } from './weather.service';
import { WindService } from './wind.service';
import { Controller, Get, HttpException, Query, UseGuards } from '@nestjs/common';
import { windForecastResponseSchema, type WeatherResult, type WindForecastResponse } from '@trek/shared';

/**
 * /api/weather — first migrated leaf module (the pilot).
 *
 * Behaviour is byte-identical to the legacy Express route (server/src/routes/
 * weather.ts): same paths, query params, status codes and `{ error }` bodies.
 *
 * Parity note: the "X is required" 400s and the 500 fallback messages are bespoke
 * strings, not the generic Zod-pipe envelope, so they are reproduced here exactly
 * rather than derived from the schema. The Zod contract/types live in
 * @trek/shared/weather and are used for typing; `lang` defaults to 'de' only when
 * the param is absent, matching the Express destructuring default.
 */
@Controller('api/weather')
@UseGuards(JwtAuthGuard)
export class WeatherController {
  constructor(
    private readonly weather: WeatherService,
    private readonly wind: WindService,
  ) {}

  /**
   * PAD-08: the wind forecast for one place and day, with gusts and direction.
   * Forecast only: a past day or one beyond the forecast's reach answers with
   * its status and no figures, and a failed request is a 502 of its own.
   */
  @Get('wind')
  @ResponseContract(windForecastResponseSchema)
  async getWind(@Query() query: WindQueryDto): Promise<WindForecastResponse> {
    return await this.wind.forecast(query);
  }

  @Get()
  async getWeather(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('date') date?: string,
    @Query('lang') lang?: string,
    /** HH:MM — lets a past date answer for that hour rather than the day (#1614). */
    @Query('time') time?: string,
  ): Promise<WeatherResult> {
    if (!lat || !lng) {
      throw new HttpException({ error: 'Latitude and longitude are required' }, 400);
    }
    try {
      return await this.weather.get(lat, lng, date, lang ?? 'de', time);
    } catch (err: unknown) {
      throw toHttp(err, 'Weather error:', 'Error fetching weather data');
    }
  }

  @Get('detailed')
  async getDetailed(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('date') date?: string,
    @Query('lang') lang?: string,
  ): Promise<WeatherResult> {
    if (!lat || !lng || !date) {
      throw new HttpException({ error: 'Latitude, longitude, and date are required' }, 400);
    }
    try {
      return await this.weather.getDetailed(lat, lng, date, lang ?? 'de');
    } catch (err: unknown) {
      throw toHttp(err, 'Detailed weather error:', 'Error fetching detailed weather data');
    }
  }
}

/** Maps a thrown error to the same status + `{ error }` body the Express route sent. */
function toHttp(err: unknown, logPrefix: string, fallback: string): HttpException {
  if (err instanceof ApiError) {
    return new HttpException({ error: err.message }, err.status);
  }
  console.error(logPrefix, err);
  return new HttpException({ error: fallback }, 500);
}
