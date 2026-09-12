import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { DatabaseService } from '../../database/database.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { pluginsEnabled } from '../kill-switch';
import { PluginHooks } from '../plugin-hooks.service';
import { PluginRouteDto } from '../plugins.dto';
import { normalize, declaredProfiles, readWaypoints, PROFILE_RE, type PluginRouteOut } from './plugin-route-normalize';
export type { PluginRouteOut } from './plugin-route-normalize';

/**
 * POST /api/plugin-routes/:pluginId/:profileId — ask ONE routeProvider plugin to
 * route the given waypoints under one of its declared profiles (an EV profile with
 * charging stops, a scenic profile, …). Unlike the fan-out hooks this is targeted:
 * the planner's route toggle names a specific plugin profile, so exactly that
 * provider is invoked.
 *
 * The route result is data the client renders exactly like an OSRM response:
 * geometry + per-leg distance/duration + optional via points (charging stops).
 * Everything is normalized here — coordinates range-checked, the leg list forced
 * to exactly waypoints-1 entries (anything else means the plugin routed a
 * different request than asked), text emoji-stripped + capped, counts budgeted.
 * A failure returns { route: null } so the client falls back to straight lines,
 * mirroring how an OSRM outage degrades.
 *
 * Routing may call an external solver through the plugin's declared egress, so
 * the invoke timeout is 20 s — well above the 5 s of the render-blocking hooks;
 * the client shows the straight-line route until the result lands.
 */
@Controller('api/plugin-routes')
@UseGuards(JwtAuthGuard)
export class PluginRoutesController {
  constructor(
    private readonly hooks: PluginHooks,
    private readonly dbs: DatabaseService,
  ) {}

  @Post(':pluginId/:profileId')
  async route(
    @Param('pluginId') pluginId: string,
    @Param('profileId') profileId: string,
    @Body() body: PluginRouteDto,
    @Req() req: Request & { user?: { id: number } },
  ): Promise<{ route: PluginRouteOut | null }> {
    if (!pluginsEnabled()) return { route: null };
    const userId = req.user?.id;
    const tripId = Number(body?.tripId);
    if (userId == null || !Number.isFinite(tripId) || !this.dbs.canAccessTrip(tripId, userId)) return { route: null };
    if (!PROFILE_RE.test(profileId)) return { route: null };
    const waypoints = readWaypoints(body?.waypoints);
    if (!waypoints) return { route: null };
    const dayIdNum = Number(body?.dayId);
    const dayId = Number.isInteger(dayIdNum) ? dayIdNum : null;

    // Provider gate (implements the hook AND holds the grant) + the profile must be
    // one the manifest declared — re-validated from the DB row like the plugins feed,
    // so a hand-edited capabilities blob can't invent profiles.
    if (!this.hooks.providersOf('routeProvider').includes(pluginId)) return { route: null };
    if (!declaredProfiles(this.dbs.connection, pluginId).includes(profileId)) return { route: null };

    try {
      const raw = await this.hooks.route(pluginId, { tripId, dayId, profile: profileId, waypoints }, userId);
      return { route: normalize(pluginId, profileId, waypoints.length, raw) };
    } catch {
      return { route: null }; // slow / failing provider — client falls back to straight lines
    }
  }
}
