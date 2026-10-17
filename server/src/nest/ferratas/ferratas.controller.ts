import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { badRequest } from '../common/domain-error';
import { ResponseContract } from '../common/response-contract';
import { TripAccessGuard } from '../permissions/trip-access.guard';
import { FerratasService } from './ferratas.service';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  FERRATA_BBOX_INVALID_MESSAGE,
  FERRATA_BBOX_TOO_LARGE_MESSAGE,
  ferratasQuerySchema,
  ferratasResponseSchema,
  type FerratasQuery,
  type FerratasResponse,
} from '@trek/shared';

/**
 * The query through the shared contract, answered with one of two messages:
 * a box that is too large is a different fix for the client (zoom in) than
 * one that is malformed.
 */
export function parseFerratasQuery(raw: Record<string, unknown>): FerratasQuery {
  const parsed = ferratasQuerySchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  const tooLarge = parsed.error.issues.some((issue) => issue.message === FERRATA_BBOX_TOO_LARGE_MESSAGE);
  throw badRequest(tooLarge ? FERRATA_BBOX_TOO_LARGE_MESSAGE : FERRATA_BBOX_INVALID_MESSAGE);
}

/**
 * GET /api/trips/:tripId/ferratas?bbox=south,west,north,east: the via ferratas
 * OpenStreetMap knows inside the box, for the trip's map.
 *
 * Trip-scoped like the other trip reads: TripAccessGuard answers 404 for a trip
 * the caller cannot reach, and reading needs no permission beyond access. The
 * box is the caller's viewport; nothing about the trip is sent to Overpass.
 */
@Controller('api/trips/:tripId/ferratas')
@UseGuards(JwtAuthGuard, TripAccessGuard)
export class FerratasController {
  constructor(private readonly ferratas: FerratasService) {}

  @Get()
  @ResponseContract(ferratasResponseSchema)
  async list(@Query() raw: Record<string, unknown>): Promise<FerratasResponse> {
    return await this.ferratas.list(parseFerratasQuery(raw).bbox);
  }
}
