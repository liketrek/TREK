import { Controller, Get, UseGuards } from '@nestjs/common';
import { AtlasService } from './atlas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '../../types';

/**
 * GET /api/auth/travel-stats — the dashboard's passport/stats card.
 *
 * The path is deliberately unchanged and deliberately not under /api/addons/atlas:
 * the client calls it, so moving it would be a breaking change. What moved is the
 * ownership. getTravelStats reads places, trips, visited_countries and
 * place_regions and subtracts the countries hidden in Atlas, so it belongs to
 * AtlasService; keeping it on AuthService forced AuthModule to import AtlasModule,
 * and that edge is what made atlas.mcp.ts reach AuthService through auth.bridge.
 *
 * An /api/auth prefix on a controller outside auth/ is unusual enough to note:
 * it is the price of holding the public path steady while the code finds its
 * right home. Nest is fine with two controllers sharing a prefix as long as the
 * routes below it are distinct, and travel-stats exists exactly once.
 *
 * JwtAuthGuard and CurrentUser are plain class imports here, the same way
 * atlas.controller.ts already uses them. Neither pulls in a module edge.
 */
@Controller('api/auth')
@UseGuards(JwtAuthGuard)
export class TravelStatsController {
  constructor(private readonly atlas: AtlasService) {}

  @Get('travel-stats')
  travelStats(@CurrentUser() user: User) {
    return this.atlas.getTravelStats(user.id);
  }
}
