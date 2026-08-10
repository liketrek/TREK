import {
  McpController, Tool, ResourceTemplate, type McpContext,
  TOOL_ANNOTATIONS_WRITE, TOOL_ANNOTATIONS_DELETE, TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  demoDenied, ok,
} from '@trek/nest-mcp';
import { z } from 'zod';
import { AuthService } from '../auth/auth.service';
import { safeBroadcast, noAccess, hasTripPermission, permissionDenied } from '../../mcp/tools/_shared';
import { DaysService } from './days.service';

function parseId(value: string | string[]): number | null {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * Day MCP surface — ported 1:1 from the legacy registrars: the seven tools of
 * src/mcp/tools/days.ts and the trek://trips/{tripId}/days resource from src/mcp/resources.ts
 * (identical names, descriptions, schemas, annotations, error/payload shapes
 * and broadcasts). The legacy registration-time gates map to the declarative
 * trips write/read access markers (registerDayTools' whole-registrar
 * `canWrite(scopes, 'trips')` early return and the resources' canReadTrips
 * checks, resolved by trekMcpAccessPolicy — note canReadTrips also accepted
 * trips:delete / trips:share-only tokens; the declarative read marker is
 * marginally narrower for those, same trade day-notes made). No addon gate —
 * days are core.
 */
@McpController()
export class DaysMcp {
  constructor(
    private readonly days: DaysService,
    private readonly auth: AuthService,
  ) {}

  @Tool({
    name: 'update_day',
    description: 'Set the title of a day in a trip (e.g. "Arrival in Paris", "Free day").',
    inputSchema: {
      tripId: z.number().int().positive(),
      dayId: z.number().int().positive(),
      title: z.string().max(200).nullable().describe('Day title, or null to clear it'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'trips', mode: 'write' },
  })
  async updateDay(
    { tripId, dayId, title }: { tripId: number; dayId: number; title: string | null },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.days.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!hasTripPermission('day_edit', tripId, ctx.userId)) return permissionDenied();
    const current = this.days.getDay(dayId, tripId);
    if (!current) return { content: [{ type: 'text' as const, text: 'Day not found.' }], isError: true };
    const updated = this.days.update(dayId, current, { title });
    safeBroadcast(tripId, 'day:updated', { day: updated });
    return ok({ day: updated });
  }

  @Tool({
    name: 'create_day',
    description: 'Add a new day to a trip (optionally with a specific date and notes).',
    inputSchema: {
      tripId: z.number().int().positive(),
      date: z.string().optional().describe('ISO date string YYYY-MM-DD, optional for dateless trips'),
      notes: z.string().optional(),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    access: { group: 'trips', mode: 'write' },
  })
  async createDay(
    { tripId, date, notes }: { tripId: number; date?: string; notes?: string },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.days.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!hasTripPermission('day_edit', tripId, ctx.userId)) return permissionDenied();
    const day = this.days.create(tripId, date, notes);
    safeBroadcast(tripId, 'day:created', { day });
    return ok({ day });
  }

  @Tool({
    name: 'delete_day',
    description: 'Delete a day from a trip.',
    inputSchema: {
      tripId: z.number().int().positive(),
      dayId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    access: { group: 'trips', mode: 'write' },
  })
  async deleteDay({ tripId, dayId }: { tripId: number; dayId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.days.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!hasTripPermission('day_edit', tripId, ctx.userId)) return permissionDenied();
    if (!this.days.getDay(dayId, tripId)) return { content: [{ type: 'text' as const, text: 'Day not found.' }], isError: true };
    this.days.remove(dayId);
    // REST parity shape ({ dayId }) — the client reads payload.dayId, so the { id }
    // variant never removed the day from collaborator screens.
    safeBroadcast(tripId, 'day:deleted', { dayId });
    return ok({ success: true });
  }

  @ResourceTemplate({
    name: 'trip-days',
    uriTemplate: 'trek://trips/{tripId}/days',
    description: 'Days of a trip with their assigned places',
    mimeType: 'application/json',
    access: { group: 'trips', mode: 'read' },
  })
  async tripDaysResource(uri: URL, { tripId }: { tripId: string | string[] }, ctx: McpContext) {
    const id = parseId(tripId);
    if (id === null || !this.days.verifyTripAccess(id, ctx.userId)) {
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({ error: 'Trip not found or access denied' }),
        }],
      };
    }
    const { days } = this.days.list(id);
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(days, null, 2),
      }],
    };
  }
}
