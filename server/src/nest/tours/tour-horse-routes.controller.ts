import { ADDON_IDS } from '../../addons';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { badRequest } from '../common/domain-error';
import { ResponseContract } from '../common/response-contract';
import { TripAccessGuard } from '../permissions/trip-access.guard';
import { TourHorseRoutesService } from './tour-horse-routes.service';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  FERRATA_BBOX_INVALID_MESSAGE,
  FERRATA_BBOX_TOO_LARGE_MESSAGE,
  horseRoutesQuerySchema,
  horseRoutesResponseSchema,
  type HorseRoutesQuery,
  type HorseRoutesResponse,
} from '@trek/shared';

/**
 * The query through the shared contract, answered with one of two messages:
 * a box that is too large is a different fix for the client (zoom in) than
 * one that is malformed.
 */
export function parseHorseRoutesQuery(raw: Record<string, unknown>): HorseRoutesQuery {
  const parsed = horseRoutesQuerySchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  const tooLarge = parsed.error.issues.some((issue) => issue.message === FERRATA_BBOX_TOO_LARGE_MESSAGE);
  throw badRequest(tooLarge ? FERRATA_BBOX_TOO_LARGE_MESSAGE : FERRATA_BBOX_INVALID_MESSAGE);
}

/**
 * HOR-01 GET /api/trips/:tripId/tours/horse-routes?bbox=south,west,north,east:
 * the signposted horse routes OpenStreetMap knows inside a map view, cut into
 * the sections a horse tour can take. A read, so anyone who sees the trip may
 * ask; the box is the caller's view and nothing about the trip goes out.
 * Declared before the tours' `:placeId` routes, which would read the path as
 * a tour.
 */
@Controller('api/trips/:tripId/tours')
@UseGuards(AddonGuard, JwtAuthGuard, TripAccessGuard)
@RequireAddon(ADDON_IDS.TOURS, 'Tours')
export class TourHorseRoutesController {
  constructor(private readonly horseRoutes: TourHorseRoutesService) {}

  @Get('horse-routes')
  @ResponseContract(horseRoutesResponseSchema)
  async list(@Query() raw: Record<string, unknown>): Promise<HorseRoutesResponse> {
    return await this.horseRoutes.list(parseHorseRoutesQuery(raw).bbox);
  }
}
