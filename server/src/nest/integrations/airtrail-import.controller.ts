import { Body, Controller, Headers, HttpException, Param, Post, UseGuards } from '@nestjs/common';
import type { User } from '../../types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { ADDON_IDS } from '../../addons';
import { AirtrailImportDto } from './airtrail.dto';
import type { AirtrailImportResult } from '@trek/shared';
import { PermissionsService } from '../permissions/permissions.service';
import { DatabaseService } from '../database/database.service';
import { importAirtrailFlights } from '../../services/airtrail/airtrailImport';

/**
 * POST /api/trips/:tripId/reservations/import/airtrail — turn selected AirTrail
 * flights into reservations. Trip-scoped (reservation_edit) and addon-gated. The
 * flights are re-fetched server-side with the caller's own key.
 */
@Controller('api/trips/:tripId/reservations/import')
@UseGuards(AddonGuard, JwtAuthGuard)
@RequireAddon(ADDON_IDS.AIRTRAIL, 'AirTrail')
export class AirtrailImportController {
  constructor(
    private readonly permissions: PermissionsService,
    private readonly db: DatabaseService,
  ) {}

  private requireEdit(tripId: string, user: User): void {
    const trip = this.db.canAccessTrip(tripId, user.id);
    if (!trip) throw new HttpException({ error: 'Trip not found' }, 404);
    if (!this.permissions.checkPermission('reservation_edit', user.role, trip.user_id, user.id, trip.user_id !== user.id)) {
      throw new HttpException({ error: 'No permission' }, 403);
    }
  }

  @Post('airtrail')
  async importAirtrail(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Body() body: AirtrailImportDto,
    @Headers('x-socket-id') socketId?: string,
  ): Promise<AirtrailImportResult> {
    this.requireEdit(tripId, user);
    try {
      return await importAirtrailFlights(tripId, user.id, body.flightIds, socketId, body.connections ?? []);
    } catch (err: any) {
      throw new HttpException({ error: err?.message || 'AirTrail import failed' }, err?.status === 400 ? 400 : 502);
    }
  }
}
