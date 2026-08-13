import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpException,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import type { AtlasLocateResponse, RegionGeo } from '@trek/shared';
import type { User } from '../../types';
import { AtlasService, BucketItemExistsError } from './atlas.service';
import { AtlasMarkRegionDto, AtlasCreateBucketItemDto, AtlasUpdateBucketItemDto } from './atlas.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

/**
 * /api/addons/atlas — visited countries/regions, region GeoJSON, bucket list.
 *
 * Byte-identical to the legacy Express route (server/src/routes/atlas.ts): all
 * endpoints require auth; country/region codes are upper-cased; /regions is
 * always no-store while /regions/geo is cached for a day only on a non-empty
 * result; the mark POSTs answer 200 (not Nest's default 201); the bespoke 404
 * bodies are reproduced exactly. Bodies validate via @trek/shared DTOs, so a
 * missing/invalid field 400s in the ZodValidationPipe envelope (the former
 * hand-rolled 'name and country_code are required' — the todo/places trade);
 * the whitespace-only bucket name keeps its legacy 'Name is required' 400.
 * No addon gate — the legacy route has none, so adding one would break
 * clients when the addon is off. The one status the legacy route never sent is
 * the bucket-list 409: adding the same wish twice used to append a second row
 * (#1898).
 */
@Controller('api/addons/atlas')
@UseGuards(JwtAuthGuard)
export class AtlasController {
  constructor(private readonly atlas: AtlasService) {}

  @Get('stats')
  stats(@CurrentUser() user: User) {
    return this.atlas.stats(user.id);
  }

  @Get('regions')
  @Header('Cache-Control', 'no-cache, no-store')
  regions(@CurrentUser() user: User) {
    return this.atlas.visitedRegions(user.id);
  }

  /**
   * Which country and admin1 region a coordinate falls in (#1115). The Atlas search
   * used to know country names only, so finding Milan meant knowing it is in Lombardy
   * first. The client geocodes the term through /maps/search as everywhere else and
   * sends the winning coordinate here; resolution runs against the same bundled
   * polygons the visited-region colouring uses, so the answer is always a feature the
   * map can actually highlight.
   */
  @Get('locate')
  async locate(@Query('lat') lat: string, @Query('lng') lng: string): Promise<AtlasLocateResponse> {
    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum) || Math.abs(latNum) > 90 || Math.abs(lngNum) > 180) {
      throw new HttpException({ error: 'Valid lat and lng are required' }, 400);
    }
    return this.atlas.locate(latNum, lngNum);
  }

  @Get('regions/geo')
  async regionGeo(
    @Query('countries') countries: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RegionGeo> {
    const list = (countries || '').split(',').filter(Boolean);
    if (list.length === 0) {
      return { type: 'FeatureCollection', features: [] };
    }
    const geo = await this.atlas.regionGeo(list);
    // Cache only a non-empty result, matching the legacy route (the empty
    // short-circuit above sends no Cache-Control header).
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return geo;
  }

  @Get('countries/geo')
  countryGeo(@Res() res: Response): void {
    // Serve the pre-gzipped admin-0 bundle straight from disk. The browser decompresses
    // transparently, so the wire shape is identical to before, but the server never parses
    // or holds the ~145MB FeatureCollection (#1576). Content-Encoding is set explicitly, so
    // the compression middleware leaves the body untouched.
    const gz = this.atlas.countryGeoGz();
    if (!gz) {
      res.setHeader('Cache-Control', 'no-store');
      res.json({ type: 'FeatureCollection', features: [] });
      return;
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Encoding', 'gzip');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(gz);
  }

  @Get('country/:code')
  countryPlaces(@CurrentUser() user: User, @Param('code') code: string) {
    return this.atlas.countryPlaces(user.id, code.toUpperCase());
  }

  @Post('country/:code/mark')
  @HttpCode(200)
  markCountry(@CurrentUser() user: User, @Param('code') code: string): { success: boolean } {
    this.atlas.markCountry(user.id, code.toUpperCase());
    return { success: true };
  }

  @Delete('country/:code/mark')
  unmarkCountry(@CurrentUser() user: User, @Param('code') code: string): { success: boolean } {
    this.atlas.unmarkCountry(user.id, code.toUpperCase());
    return { success: true };
  }

  @Post('region/:code/mark')
  @HttpCode(200)
  markRegion(
    @CurrentUser() user: User,
    @Param('code') code: string,
    @Body() body: AtlasMarkRegionDto,
  ): { success: boolean } {
    this.atlas.markRegion(user.id, code.toUpperCase(), body.name, body.country_code.toUpperCase());
    return { success: true };
  }

  @Delete('region/:code/mark')
  unmarkRegion(@CurrentUser() user: User, @Param('code') code: string): { success: boolean } {
    this.atlas.unmarkRegion(user.id, code.toUpperCase());
    return { success: true };
  }

  @Get('bucket-list')
  bucketList(@CurrentUser() user: User) {
    return { items: this.atlas.bucketList(user.id) };
  }

  @Post('bucket-list')
  createBucketItem(@CurrentUser() user: User, @Body() body: AtlasCreateBucketItemDto): { item: unknown } {
    // The schema's min(1) admits whitespace-only names — this trim guard keeps
    // the legacy 400 for those (missing/empty names 400 in the pipe envelope).
    if (!body.name?.trim()) {
      throw new HttpException({ error: 'Name is required' }, 400);
    }
    const { name, lat, lng, country_code, notes, target_date } = body;
    try {
      return { item: this.atlas.createBucketItem(user.id, { name, lat, lng, country_code, notes, target_date }) };
    } catch (err) {
      // #1898: the same wish twice is a conflict, not a server error. Bespoke
      // { error } body like the neighbouring 400/404s.
      if (err instanceof BucketItemExistsError) {
        throw new HttpException({ error: 'Already on your bucket list' }, 409);
      }
      throw err;
    }
  }

  @Put('bucket-list/:id')
  updateBucketItem(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: AtlasUpdateBucketItemDto,
  ): { item: unknown } {
    const { name, notes, lat, lng, country_code, target_date } = body;
    let item: unknown;
    try {
      item = this.atlas.updateBucketItem(user.id, id, { name, notes, lat, lng, country_code, target_date });
    } catch (err) {
      // #1898: editing a wish onto an existing one conflicts the same way a
      // duplicate create does.
      if (err instanceof BucketItemExistsError) {
        throw new HttpException({ error: 'Already on your bucket list' }, 409);
      }
      throw err;
    }
    if (!item) {
      throw new HttpException({ error: 'Item not found' }, 404);
    }
    return { item };
  }

  @Delete('bucket-list/:id')
  deleteBucketItem(@CurrentUser() user: User, @Param('id') id: string): { success: boolean } {
    if (!this.atlas.deleteBucketItem(user.id, id)) {
      throw new HttpException({ error: 'Item not found' }, 404);
    }
    return { success: true };
  }
}
