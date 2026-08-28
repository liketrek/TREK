import { z } from 'zod';
import {
  McpController, Tool, type McpContext,
  TOOL_ANNOTATIONS_DELETE, TOOL_ANNOTATIONS_READONLY, TOOL_ANNOTATIONS_WRITE,
  demoDenied, errorResult, ok,
} from '../../nest-mcp';
import { fileLinkRequestSchema, fileUpdateRequestSchema } from '@trek/shared';
import type { FileLinkRequest, FileUpdateRequest } from '@trek/shared';
import { noAccess, permissionDenied } from '../../mcp/tools/_shared';
import { AuthService } from '../auth/auth.service';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { FilesService, FileContentError, FILE_CONTENT_MAX } from './files.service';

const CONTENT_MAX_MB = Math.round(FILE_CONTENT_MAX / (1024 * 1024));

/**
 * Bytes worth handing over as text. Everything else goes back base64: a model
 * can pass those on to a converter, but it cannot read them, and decoding a PDF
 * as UTF-8 would spend the whole payload on replacement characters.
 */
function isTextual(mimetype: string): boolean {
  return mimetype.startsWith('text/') || mimetype === 'application/json';
}

/** The MCP wording for a refused content read; the plugin RPC has its own for the same reasons. */
function contentRefusal(err: FileContentError): string {
  if (err.reason === 'too-large') {
    return `File is too large to read here (over ${CONTENT_MAX_MB} MB). Ask the user to open it in TREK instead.`;
  }
  if (err.reason === 'not-accessible') return 'File contents are not available.';
  return 'File not found.';
}

/**
 * Trip-file MCP surface, mirroring /api/trips/:tripId/files. New rather than
 * ported: the domain had no MCP tools at all, so an assistant could see a trip's
 * bookings but not the confirmation PDF attached to one.
 *
 * Each tool reproduces its REST route's gates in the route's own order: trip
 * access first (the 404 that keeps a stranger from learning a trip exists), then
 * the file_edit right for the writes, then the row lookup scoped by :tripId. The
 * two listing tools carry no file_* right because the routes they mirror carry
 * none either; trip access is the whole gate there.
 *
 * There is no upload tool on purpose. MCP has no file transport, and an upload
 * faked through base64 would be a second, unpoliced ingestion path beside the
 * multipart route with its extension filter and per-type size caps.
 */
@McpController()
export class FilesMcp {
  constructor(
    private readonly files: FilesService,
    private readonly auth: AuthService,
    private readonly guards: McpToolGuardsService,
  ) {}

  @Tool({
    name: 'list_trip_files',
    description: 'List the documents on a trip: name, type, size, who uploaded it, what it is attached to, whether it is starred, and when it was moved to the trash. This is the way to find a file ID; to read what is inside one, follow up with read_trip_file. Set trash to true to list the trip\'s deleted files instead of its live ones.',
    inputSchema: {
      tripId: z.number().int().positive(),
      trash: z.boolean().optional().default(false).describe('List the trash instead of the live files'),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'files', mode: 'read' },
  })
  async listTripFiles({ tripId, trash }: { tripId: number; trash?: boolean }, ctx: McpContext) {
    if (!this.files.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    return ok({ files: this.files.listFiles(tripId, trash === true) });
  }

  @Tool({
    name: 'read_trip_file',
    description: `Read what is inside one uploaded document, e.g. a booking confirmation or a ticket. Text files come back as readable text, anything else base64-encoded, with "encoding" saying which. Files over ${CONTENT_MAX_MB} MB are refused outright, so point the user at the file in TREK rather than retrying. Reading contents is a separate permission from listing files, so this can be refused on a trip where list_trip_files works.`,
    inputSchema: {
      tripId: z.number().int().positive(),
      fileId: z.number().int().positive().describe('File ID from list_trip_files'),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    // Not files:read. Listing what a trip carries and reading the bytes of a
    // passport scan are different privileges, and the plugin host draws the same
    // line (db:read:files vs db:read:files:content).
    access: { group: 'files', mode: 'content' },
  })
  async readTripFile({ tripId, fileId }: { tripId: number; fileId: number }, ctx: McpContext) {
    if (!this.files.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    try {
      const { name, mimetype, bytes } = await this.files.readContent(tripId, fileId);
      const asText = isTextual(mimetype);
      return ok({
        file: {
          id: fileId,
          name,
          mimetype,
          size: bytes.length,
          encoding: asText ? 'utf8' : 'base64',
          content: bytes.toString(asText ? 'utf8' : 'base64'),
        },
      });
    } catch (err) {
      if (err instanceof FileContentError) return errorResult(contentRefusal(err));
      throw err;
    }
  }

  @Tool({
    name: 'update_trip_file',
    description: 'Set a file\'s description and attach it to a booking or a place. Fields left out keep their current value, null detaches. place_id and reservation_id are the file\'s primary attachment, the one the file manager shows next to it. To attach one document to several bookings or places at once, use link_trip_file instead.',
    inputSchema: {
      tripId: z.number().int().positive(),
      fileId: z.number().int().positive(),
      description: fileUpdateRequestSchema.shape.description.describe('Free-text description, or an empty string to clear it'),
      place_id: fileUpdateRequestSchema.shape.place_id.describe('Place on the same trip to attach the file to, or null to detach it'),
      reservation_id: fileUpdateRequestSchema.shape.reservation_id.describe('Booking on the same trip to attach the file to, or null to detach it'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'files', mode: 'write' },
  })
  async updateTripFile(
    { tripId, fileId, ...fields }: { tripId: number; fileId: number } & FileUpdateRequest,
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.files.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('file_edit', tripId, ctx.userId)) return permissionDenied();
    const current = this.files.getFileById(fileId, tripId);
    if (!current) return errorResult('File not found.');
    // Same enforcement as the REST route's assertLinkTargets, through the same
    // service method: a foreign reservation id would otherwise come back with its
    // title attached the next time this file is listed.
    const foreign = this.files.findForeignLinkTarget(tripId, {
      reservation_id: fields.reservation_id,
      place_id: fields.place_id,
    });
    if (foreign) return errorResult(`Linked item does not belong to this trip (${foreign}).`);
    // The rest spread carries only the keys the caller actually sent, which is what
    // updateFile's presence sentinels need: naming the fields here would hand it an
    // undefined description on a link-only call and wipe the description.
    const file = this.files.updateFile(fileId, current, fields);
    this.guards.safeBroadcast(tripId, 'file:updated', { file });
    return ok({ file });
  }

  @Tool({
    name: 'link_trip_file',
    description: 'Attach a file to one more booking, place or day assignment on the same trip, keeping every attachment it already has. Prefer update_trip_file when the document belongs to a single booking or place; use this one for a document that covers several, such as one group ticket or one rental agreement. Returns every link the file now carries.',
    inputSchema: {
      tripId: z.number().int().positive(),
      fileId: z.number().int().positive(),
      reservation_id: fileLinkRequestSchema.shape.reservation_id.describe('Booking on the same trip'),
      assignment_id: fileLinkRequestSchema.shape.assignment_id.describe('Day assignment (a place scheduled on a specific day) on the same trip'),
      place_id: fileLinkRequestSchema.shape.place_id.describe('Place on the same trip'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'files', mode: 'write' },
  })
  async linkTripFile(
    { tripId, fileId, ...targets }: { tripId: number; fileId: number } & FileLinkRequest,
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.files.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('file_edit', tripId, ctx.userId)) return permissionDenied();
    if (!this.files.getFileById(fileId, tripId)) return errorResult('File not found.');
    // The REST body allows all three to be absent and stores a link row pointing at
    // nothing. A tool caller that gets here with no target made a mistake, and saying
    // so is more useful than a success that attached the file to nothing.
    if (!targets.reservation_id && !targets.assignment_id && !targets.place_id) {
      return errorResult('Pass at least one of reservation_id, assignment_id or place_id.');
    }
    const foreign = this.files.findForeignLinkTarget(tripId, targets);
    if (foreign) return errorResult(`Linked item does not belong to this trip (${foreign}).`);
    const links = this.files.createFileLink(fileId, targets);
    return ok({ success: true, links });
  }

  @Tool({
    name: 'unlink_trip_file',
    description: 'Remove one attachment between a file and a booking, place or day assignment. The file itself stays on the trip and its other attachments are untouched. Take linkId from list_trip_file_links, it is not the booking or place ID.',
    inputSchema: {
      tripId: z.number().int().positive(),
      fileId: z.number().int().positive(),
      linkId: z.number().int().positive().describe('Link ID from list_trip_file_links'),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    access: { group: 'files', mode: 'write' },
  })
  async unlinkTripFile(
    { tripId, fileId, linkId }: { tripId: number; fileId: number; linkId: number },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.files.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('file_edit', tripId, ctx.userId)) return permissionDenied();
    // deleteFileLink scopes by (linkId, fileId) only, so the file has to be resolved
    // against :tripId first, exactly as the REST route does it. Otherwise a member of
    // any trip could drop a link row belonging to a foreign trip's file.
    if (!this.files.getFileById(fileId, tripId)) return errorResult('File not found.');
    this.files.deleteFileLink(linkId, fileId);
    return ok({ success: true });
  }

  @Tool({
    name: 'list_trip_file_links',
    description: 'List everything one file is attached to: bookings (with their title), places and day assignments, each with the linkId that unlink_trip_file needs. list_trip_files already reports the linked booking and place IDs, so reach for this one when you need the link IDs themselves.',
    inputSchema: {
      tripId: z.number().int().positive(),
      fileId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'files', mode: 'read' },
  })
  async listTripFileLinks({ tripId, fileId }: { tripId: number; fileId: number }, ctx: McpContext) {
    if (!this.files.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.files.getFileById(fileId, tripId)) return errorResult('File not found.');
    return ok({ links: this.files.getFileLinks(fileId) });
  }
}
