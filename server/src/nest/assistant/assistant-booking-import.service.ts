import { aiRefusal } from '../ai-connections/ai-connections.constants';
import { BookingImportService } from '../booking-import/booking-import.service';
import { DemoService } from '../common/demo.service';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { TripAccessService } from '../trip-membership/trip-access.service';
import type { AttachedFileReader, FileRead } from './assistant-attached-file';
import { IMPORT_BOOKING_TOOL, MAX_WRITES_PER_STEP, READ_BOOKING_FILE_TOOL } from './assistant-tools.constants';
import type { ToolRun } from './assistant-tools.service';
import { Injectable } from '@nestjs/common';
import {
  bookingImportPreviewItemSchema,
  LLM_PHOTO_EXTENSIONS,
  type BookingImportPreviewItem,
  type BookingImportPreviewResponse,
} from '@trek/shared';

import { extname } from 'node:path';

const PHOTO_EXTENSIONS: ReadonlySet<string> = new Set(LLM_PHOTO_EXTENSIONS);

const NOT_ALLOWED = 'You are not allowed to add bookings to this trip.';
const NOT_ADDED = 'The booking could not be added.';
const ALREADY_THERE = 'This booking is already in the trip.';
const BROKEN = 'This booking can no longer be read.';

/**
 * Why a file held no booking: AI reading is not set up for imports (only the
 * extractor looked), the AI could not read it, it holds no text (a scan the
 * model cannot see), or nothing in it reads as a booking.
 */
export const BOOKING_READ_REASONS = ['ai_not_configured', 'ai_failed', 'no_text', 'nothing_found'] as const;
export type BookingReadReason = (typeof BOOKING_READ_REASONS)[number];

/** What reading a file found: at most a step's worth of bookings, and why there were none. */
interface BookingRead {
  items: BookingImportPreviewItem[];
  /** Null when the file held bookings. */
  reason: BookingReadReason | null;
}

/** The warnings of the AI fallback that say it could not read the file (llm-parse.service.ts words them). */
const AI_FAILED = [/AI parsing failed/, /could not read file/, /does not read images/];
const NO_TEXT = /no readable text found/;

/**
 * Why a preview of one file came back empty, from its warnings and its file
 * report. The import dialog shows those warnings as text; the chat names the
 * reason in its answer instead, so it reads them here once.
 */
export function emptyReason(preview: BookingImportPreviewResponse, aiAvailable: boolean): BookingReadReason {
  if (!aiAvailable) return 'ai_not_configured';
  if (preview.warnings.some((warning) => NO_TEXT.test(warning))) return 'no_text';
  if (preview.warnings.some((warning) => AI_FAILED.some((pattern) => pattern.test(warning)))) return 'ai_failed';
  return 'nothing_found';
}

/**
 * The booking import as the assistant uses it: a file attached in the chat is
 * read into bookings with the same extractor (and AI fallback) the import
 * dialog runs, and a booking the user applies is created through the same
 * confirm path, with the checks an MCP write runs: the trip, the demo block
 * and the `reservation_edit` right, taken when it is applied.
 */
@Injectable()
export class AssistantBookingImportService implements AttachedFileReader {
  readonly readTool = READ_BOOKING_FILE_TOOL;
  /** Kept for the answers older builds wrote; this one acknowledges every file instead. */
  readonly emptyCode = 'no_bookings_found' as const;
  readonly acknowledges = true;

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
   * The bookings in the file, at most a step's worth, and why there were
   * none; the AI is asked only where the extractor found none. Persists
   * nothing.
   */
  async read(userId: number, file: Express.Multer.File): Promise<BookingRead> {
    const ai = await this.bookingImport.aiAvailable(userId);
    const preview = await this.bookingImport.preview([file], ai ? 'fallback-on-empty' : 'no-ai', userId);
    // One file proposes no more bookings than one step may hold changes; the rest are left out.
    const items = preview.items.slice(0, MAX_WRITES_PER_STEP);
    return { items, reason: items.length > 0 ? null : emptyReason(preview, ai) };
  }

  /**
   * The bookings of the file as the changes the chat holds, one
   * import_booking each; a file without any says why in its read step.
   */
  async propose(userId: number, _tripId: number, file: Express.Multer.File): Promise<FileRead> {
    const { items, reason } = await this.read(userId, file);
    return {
      found: { bookings: items.map((item) => item.title), ...(reason ? { reason } : {}) },
      proposals: items.map((item) => ({ toolName: IMPORT_BOOKING_TOOL, args: item as Record<string, unknown> })),
    };
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
    const { created, failed } = await this.bookingImport.confirm(String(tripId), userId, [parsed.data], undefined);
    const reservation = created[0];
    if (!reservation) return { ok: false, value: failed[0]?.reason === 'duplicate' ? ALREADY_THERE : NOT_ADDED };
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
