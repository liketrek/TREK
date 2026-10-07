import { PluginCapabilityAudit } from '../../db/entities/PluginCapabilityAudit.entity';
import type { PluginCapabilityAuditRepository } from '../../db/repositories/PluginCapabilityAudit.repository';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { readAuditForUser } from './host/plugin-audit';
import { pluginsEnabled } from './kill-switch';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';

import type { Request } from 'express';

/**
 * GET /api/plugin-activity — the authenticated user's OWN plugin activity log:
 * every host-mediated action a plugin took while bound to them, across all
 * plugins, newest first. This is the user-facing half of the hash-chained audit
 * (the admin sees the per-plugin view); it's what makes the deliberately broad
 * read grants accountable to the person whose data is read.
 *
 * Own path (not under /api/plugins/:id) so it can never be shadowed by the plugin
 * proxy route. Not admin-gated — every user may see what was done in their name.
 */
@Controller('api/plugin-activity')
@UseGuards(JwtAuthGuard)
export class PluginActivityController {
  constructor(@InjectRepository(PluginCapabilityAudit) private readonly audit: PluginCapabilityAuditRepository) {}

  @Get()
  async mine(
    @Req() req: Request & { user?: { id: number } },
    @Query('limit') limitRaw?: string,
  ): Promise<{ activity: unknown[] }> {
    if (!pluginsEnabled()) return { activity: [] };
    const userId = req.user?.id;
    if (userId == null) return { activity: [] };
    // Math.floor so a non-integer (e.g. ?limit=2.5) can't reach SQLite's LIMIT and 500;
    // Math.floor(NaN) stays NaN so the `|| 200` fallback still applies.
    const limit = Math.min(Math.max(Math.floor(Number(limitRaw)) || 200, 1), 500);
    return { activity: await readAuditForUser(this.audit, userId, limit) };
  }
}
