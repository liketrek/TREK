import { aiRefusal } from '../ai-connections/ai-connections.constants';
import { BookingImportService } from '../booking-import/booking-import.service';
import { DemoService } from '../common/demo.service';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { TripAccessService } from '../trip-membership/trip-access.service';
import { MAX_WRITES_PER_STEP } from './assistant-tools.constants';
import type { ToolRun } from './assistant-tools.service';
import { Injectable } from '@nestjs/common';
import { bookingImportPreviewItemSchema, LLM_PHOTO_EXTENSIONS, type BookingImportPreviewItem } from '@trek/shared';

import { extname } from 'node:path';

const PHOTO_EXTENSIONS: ReadonlySet<string> = new Set(LLM_PHOTO_EXTENSIONS);

const NOT_ALLOWED = 'You are not allowed to add bookings to this trip.';
const NOT_ADDED = 'The booking could not be added.';
const BROKEN = 'This booking can no longer be read.';

/**
 * The booking import as the assistant uses it: a file attached in the chat is
 * read into bookings with the same extractor (and AI fallback) the import
 * dialog runs, and a booking the user applies is created through the same
 * confirm path, with the checks an MCP write runs: the trip, the demo block
 * and the `reservation_edit` right, taken when it is applied.
 */
@Injectable()
export class AssistantBookingImportService {
  constructor(
    private readonly bookingImport: BookingImportService,
    private readonly trips: TripAccessService,
    private readonly guards: McpToolGuardsService,
    private readonly demo: DemoService,
  ) {}

  /**
   * Refuses a file nobody here can read: no extractor and no AI parsing, or a
   * photo while the AI model reads no images (the extractor never reads one).
   */
  async ensureReadable(userId: number, file: Express.Multer.File): Promise<void> {
    const ai = await this.bookingImport.aiAvailable(userId);
    if (!ai && !this.bookingImport.isAvailable()) {
      throw aiRefusal('import_unavailable', 'Reading booking files is not available on this server');
    }
    const photo = PHOTO_EXTENSIONS.has(extname(file.originalname).toLowerCase());
    if (photo && !(ai && (await this.bookingImport.readsImages(userId)))) {
      throw aiRefusal('import_unavailable', 'The configured AI model does not read photos');
    }
  }

  /**
   * The bookings in the file, at most a step's worth; the AI is asked only
   * where the extractor found none. Persists nothing.
   */
  async read(userId: number, file: Express.Multer.File): Promise<BookingImportPreviewItem[]> {
    const mode = (await this.bookingImport.aiAvailable(userId)) ? 'fallback-on-empty' : 'no-ai';
    const preview = await this.bookingImport.preview([file], mode, userId);
    // One file proposes no more bookings than one step may hold changes; the rest are left out.
    return preview.items.slice(0, MAX_WRITES_PER_STEP);
  }

  /**
   * Creates the booking the user applied, from the arguments the server stored
   * when it proposed it. The answer is shaped like a tool's: the created
   * reservation, or the reason it was not created.
   */
  async apply(userId: number, tripId: number, args: Record<string, unknown>): Promise<ToolRun> {
    const parsed = bookingImportPreviewItemSchema.safeParse(args);
    if (!parsed.success) return { ok: false, value: BROKEN };
    if (await this.demo.isDemoUserId(userId)) return { ok: false, value: NOT_ALLOWED };
    if (!(await this.trips.findAccessible(tripId, userId))) return { ok: false, value: NOT_ALLOWED };
    if (!(await this.guards.hasTripPermission('reservation_edit', tripId, userId))) {
      return { ok: false, value: NOT_ALLOWED };
    }
    // No socket to spare from the echo: the user's own planner learns of the
    // booking like every other member's.
    const { created } = await this.bookingImport.confirm(String(tripId), [parsed.data], undefined);
    const reservation = created[0];
    if (!reservation) return { ok: false, value: NOT_ADDED };
    return {
      ok: true,
      value: {
        reservation: {
          id: reservation.id,
          title: reservation.title,
          type: reservation.type,
          day_id: reservation.day_id ?? null,
        },
      },
    };
  }
}
