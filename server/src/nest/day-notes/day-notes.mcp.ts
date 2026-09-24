import {
  McpController, Tool, ResourceTemplate, type McpContext,
  TOOL_ANNOTATIONS_WRITE, TOOL_ANNOTATIONS_DELETE, TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  demoDenied, ok,
} from '../../nest-mcp';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { z } from 'zod';
import { NOTE_COLORS, type NoteColor } from '@trek/shared';
import { AuthService } from '../auth/auth.service';
import { noAccess, permissionDenied } from '../../mcp/tools/_shared';
import { DayNotesService } from './day-notes.service';

/**
 * The palette itself rather than the REST contract's `z.string().max(9)`.
 * normalizeNoteColor() stores anything off-palette as "no colour", so a loose
 * string would let a caller send #ff0000, get a success back and never learn the
 * colour was dropped. An enum is also how the tool tells a model what it may pick.
 */
const noteColorSchema = z.enum(NOTE_COLORS);

function parseId(value: string | string[]): number | null {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * Day-note MCP surface — ported 1:1 from the legacy registrars: the three
 * tools from the DAY NOTES block of src/mcp/tools/days.ts and the
 * trek://trips/{tripId}/days/{dayId}/notes resource from src/mcp/resources.ts
 * (identical names, descriptions, schemas, annotations, error/payload shapes
 * and broadcasts). The legacy registration-time gates map to the declarative
 * trips write/read access markers (registerDayTools' whole-registrar
 * `canWrite(scopes, 'trips')` early return and the resource's canReadTrips
 * check, resolved by trekMcpAccessPolicy). No addon gate — day notes are core.
 *
 * The write tools have since gained `color` and `sort_order`, which the REST
 * contract carried all along: without them an MCP note could not be coloured
 * and landed at the bottom of the day's merged timeline whatever the caller
 * meant.
 */
@McpController()
export class DayNotesMcp {
  constructor(
    private readonly notes: DayNotesService,
    private readonly auth: AuthService,
    private readonly guards: McpToolGuardsService,
  ) {}

  @Tool({
    name: 'create_day_note',
    description: 'Add a note to a specific day in a trip.',
    inputSchema: {
      tripId: z.number().int().positive(),
      dayId: z.number().int().positive(),
      text: z.string().min(1).max(500),
      time: z.string().max(250).optional().describe('Time label (e.g. "09:00" or "Morning")'),
      icon: z.string().max(64).optional().describe('Emoji icon for the note'),
      color: noteColorSchema.nullable().optional().describe('Card colour from the note palette; null or omitted leaves the neutral card'),
      sort_order: z.number().optional().describe('Position in the day, lowest first, interleaved with the places of that day. Omit to append at the bottom'),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    access: { group: 'trips', mode: 'write' },
  })
  async createDayNote(
    { tripId, dayId, text, time, icon, color, sort_order }: {
      tripId: number; dayId: number; text: string; time?: string; icon?: string; color?: NoteColor | null; sort_order?: number;
    },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.notes.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('day_edit', tripId, ctx.userId)) return permissionDenied();
    if (!this.notes.dayExists(dayId, tripId)) return { content: [{ type: 'text' as const, text: 'Day not found.' }], isError: true };
    const note = this.notes.create(dayId, tripId, text, time, icon, sort_order, color);
    this.guards.safeBroadcast(tripId, 'dayNote:created', { dayId, note });
    return ok({ note });
  }

  @Tool({
    name: 'update_day_note',
    description: 'Edit an existing note on a specific day.',
    inputSchema: {
      tripId: z.number().int().positive(),
      dayId: z.number().int().positive(),
      noteId: z.number().int().positive(),
      text: z.string().min(1).max(500).optional(),
      time: z.string().max(250).nullable().optional().describe('Time label (e.g. "09:00" or "Morning"), or null to clear'),
      icon: z.string().max(64).optional().describe('Emoji icon for the note'),
      color: noteColorSchema.nullable().optional().describe('Card colour from the note palette, or null to go back to the neutral card'),
      sort_order: z.number().optional().describe('New position in the day, lowest first, interleaved with the places of that day'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'trips', mode: 'write' },
  })
  async updateDayNote(
    { tripId, dayId, noteId, text, time, icon, color, sort_order }: {
      tripId: number; dayId: number; noteId: number; text?: string; time?: string | null; icon?: string; color?: NoteColor | null; sort_order?: number;
    },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.notes.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('day_edit', tripId, ctx.userId)) return permissionDenied();
    const existing = this.notes.getNote(noteId, dayId, tripId);
    if (!existing) return { content: [{ type: 'text' as const, text: 'Note not found.' }], isError: true };
    const note = this.notes.update(noteId, existing, { text, time: time !== undefined ? time : undefined, icon, color, sort_order });
    this.guards.safeBroadcast(tripId, 'dayNote:updated', { dayId, note });
    return ok({ note });
  }

  @Tool({
    name: 'delete_day_note',
    description: 'Delete a note from a specific day.',
    inputSchema: {
      tripId: z.number().int().positive(),
      dayId: z.number().int().positive(),
      noteId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    access: { group: 'trips', mode: 'write' },
  })
  async deleteDayNote({ tripId, dayId, noteId }: { tripId: number; dayId: number; noteId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.notes.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('day_edit', tripId, ctx.userId)) return permissionDenied();
    const note = this.notes.getNote(noteId, dayId, tripId);
    if (!note) return { content: [{ type: 'text' as const, text: 'Note not found.' }], isError: true };
    this.notes.remove(noteId);
    this.guards.safeBroadcast(tripId, 'dayNote:deleted', { noteId, dayId });
    return ok({ success: true });
  }

  @ResourceTemplate({
    name: 'day-notes',
    uriTemplate: 'trek://trips/{tripId}/days/{dayId}/notes',
    description: 'Notes for a specific day in a trip',
    mimeType: 'application/json',
    access: { group: 'trips', mode: 'read' },
  })
  async dayNotesResource(uri: URL, { tripId, dayId }: { tripId: string | string[]; dayId: string | string[] }, ctx: McpContext) {
    const tId = parseId(tripId);
    const dId = parseId(dayId);
    if (tId === null || dId === null || !this.notes.verifyTripAccess(tId, ctx.userId)) {
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({ error: 'Trip not found or access denied' }),
        }],
      };
    }
    const notes = this.notes.list(dId, tId);
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(notes, null, 2),
      }],
    };
  }
}
