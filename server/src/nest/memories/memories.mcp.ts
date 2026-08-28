import {
  McpController, Tool, TOOL_ANNOTATIONS_OPEN_WORLD_READONLY,
  errorResult, ok, type McpContext,
} from '../../nest-mcp';
import { z } from 'zod';
import { DatabaseService } from '../database/database.service';
import { ImmichService } from './immich.service';
import { SynologyService } from './synology.service';

/**
 * The photo backends TREK can talk to, named rather than taken as a free
 * string. `trek_photos.provider` stores whatever it is handed, so a typo would
 * persist a row no resolver can ever match to a backend.
 */
const PROVIDER = z.enum(['immich', 'synologyphotos']);
type ProviderId = z.infer<typeof PROVIDER>;

const ISO_DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/**
 * Immich's REST route already clamps a search page to 200, so this only newly
 * binds Synology, whose route takes an unbounded `limit`. A tool answers into a
 * context window rather than into a scrolling grid, so both get the ceiling.
 */
const MAX_PAGE_SIZE = 200;

/** The two provider defaults, kept apart because the REST routes differ. */
const IMMICH_DEFAULT_SIZE = 50;
const SYNOLOGY_DEFAULT_LIMIT = 100;

/**
 * Availability gate. With every `photo_providers` row switched off the admin has
 * turned the whole integration off, and the settings page stops offering it at
 * all: nothing here has anything left to browse. Which of the two providers is
 * on is a per-call question, answered by providerRefusal().
 */
const anyPhotoProviderEnabled = (_ctx: McpContext, self: MemoriesMcp): boolean =>
  self.enabledProviderIds().length > 0;

/**
 * Memories MCP surface: finding photos in a connected Immich or Synology Photos
 * library so their asset ids can be handed to add_journey_provider_photos.
 *
 * Read-only and metadata-only by design. The routes that stream thumbnails and
 * originals stay off this surface: they are `<img>` targets that answer with
 * bytes, and a tool result carries text.
 *
 * The three tools mirror POST /search, GET /albums and GET /albums/:id/photos
 * under /api/integrations/memories/{immich,synologyphotos}. Those routes carry
 * no trip scoping to mirror: a provider library belongs to the calling user and
 * is reached with that user's own stored credentials, so the session's userId is
 * the whole of the scoping, exactly as the JwtAuthGuard-only controllers have it.
 *
 * They ride journey:read because that is the consent this surface exists to
 * serve: a model searches a library in order to attach what it finds to a
 * journey entry or gallery, which is the write half in journey.mcp.ts. There is
 * no memories scope group and adding one is a central decision, not a domain one.
 */
@McpController()
export class MemoriesMcp {
  constructor(
    private readonly immich: ImmichService,
    private readonly synology: SynologyService,
    private readonly db: DatabaseService,
  ) {}

  /**
   * Public because the `when:` gate above is a module-level function rather than
   * a method, the same reason the addon gates need a public `addons`.
   */
  enabledProviderIds(): string[] {
    return this.db.all<{ id: string }>('SELECT id FROM photo_providers WHERE enabled = 1').map((row) => row.id);
  }

  /**
   * The admin toggle the trip-side add already enforces (the `_validProvider`
   * check in UnifiedMemoriesService), reused down to its two sentences so a
   * disabled provider refuses the same way on both surfaces. The browse routes
   * themselves never checked it, so this only ever narrows what REST allows.
   */
  private providerRefusal(provider: ProviderId) {
    const row = this.db.get<{ enabled: number }>('SELECT enabled FROM photo_providers WHERE id = ?', provider);
    if (!row) return errorResult(`Provider: "${provider}" is not supported`);
    if (row.enabled !== 1) return errorResult(`Provider: "${provider}" is not enabled, contact server administrator`);
    return null;
  }

  @Tool({
    name: 'search_provider_photos',
    description: 'Search a connected photo library (Immich or Synology Photos) by capture date and return the matching asset ids with their capture time, place and coordinates. Start here when the user asks for the photos of a trip, a journey or a single day, then pass the ids on to add_journey_provider_photos. Prefer list_provider_albums when the user names an album instead of a date range. Metadata only: no image data crosses the wire, and the pictures themselves are fetched by the app, not by this tool.',
    inputSchema: {
      provider: PROVIDER.describe('Which connected library to search'),
      from: ISO_DATE.optional().describe('Earliest capture date, YYYY-MM-DD, inclusive'),
      to: ISO_DATE.optional().describe('Latest capture date, YYYY-MM-DD, inclusive'),
      page: z.number().int().min(1).optional().describe('1-based page number, defaults to 1. Page forward while hasMore is true'),
      size: z.number().int().min(1).max(MAX_PAGE_SIZE).optional().describe(`Photos per page, at most ${MAX_PAGE_SIZE}. Defaults to ${IMMICH_DEFAULT_SIZE} for Immich and ${SYNOLOGY_DEFAULT_LIMIT} for Synology Photos, as the REST routes do`),
    },
    annotations: TOOL_ANNOTATIONS_OPEN_WORLD_READONLY,
    when: anyPhotoProviderEnabled,
    access: { group: 'journey', mode: 'read' },
  })
  async searchProviderPhotos(
    { provider, from, to, page, size }: { provider: ProviderId; from?: string; to?: string; page?: number; size?: number },
    ctx: McpContext,
  ) {
    const refused = this.providerRefusal(provider);
    if (refused) return refused;

    if (provider === 'immich') {
      // Same coercion the REST route performs on the body before calling.
      const result = await this.immich.searchPhotos(ctx.userId, from, to, Math.max(1, page ?? 1), Math.min(size ?? IMMICH_DEFAULT_SIZE, MAX_PAGE_SIZE));
      if (result.error) return errorResult(result.error);
      return ok({ provider, assets: result.assets ?? [], hasMore: !!result.hasMore });
    }

    // Synology paginates by offset. Its route derives one from a 1-based page
    // and the effective limit, which is what keeps a single `page` argument
    // meaning the same thing for both providers.
    const limit = size && size > 0 ? size : SYNOLOGY_DEFAULT_LIMIT;
    const pageIndex = (page ?? 1) - 1;
    const result = await this.synology.searchSynologyPhotos(ctx.userId, from, to, pageIndex > 0 ? pageIndex * limit : 0, limit);
    if ('error' in result) return errorResult(result.error.message);
    return ok({ provider, assets: result.data.assets, total: result.data.total, hasMore: result.data.hasMore });
  }

  @Tool({
    name: 'list_provider_albums',
    description: 'List the albums of a connected photo library (Immich or Synology Photos), with each album id, name and photo count. Use this when the user names an album ("the Rome album") rather than a date range, then read its photos with list_provider_album_photos. For "photos from that week" use search_provider_photos instead.',
    inputSchema: {
      provider: PROVIDER.describe('Which connected library to list albums from'),
    },
    annotations: TOOL_ANNOTATIONS_OPEN_WORLD_READONLY,
    when: anyPhotoProviderEnabled,
    access: { group: 'journey', mode: 'read' },
  })
  async listProviderAlbums({ provider }: { provider: ProviderId }, ctx: McpContext) {
    const refused = this.providerRefusal(provider);
    if (refused) return refused;

    if (provider === 'immich') {
      const result = await this.immich.listAlbums(ctx.userId);
      if (result.error) return errorResult(result.error);
      return ok({ provider, albums: result.albums ?? [] });
    }

    const result = await this.synology.listSynologyAlbums(ctx.userId);
    if ('error' in result) return errorResult(result.error.message);
    // A Synology album that was shared with the user carries a passphrase, and
    // list_provider_album_photos cannot open it without one. The REST route
    // hands it to the picker for the same reason.
    return ok({ provider, albums: result.data.albums });
  }

  @Tool({
    name: 'list_provider_album_photos',
    description: 'List every photo in one album of a connected library, with asset ids, capture times and coordinates. Follow list_provider_albums with this once the right album is known, then hand the asset ids to add_journey_provider_photos. Metadata only, and unpaginated: a large album comes back whole.',
    inputSchema: {
      provider: PROVIDER.describe('Which connected library the album lives in'),
      album_id: z.string().min(1).describe('Album id as returned by list_provider_albums'),
      passphrase: z.string().min(1).optional().describe('Only for a Synology Photos album that was shared with the user: pass back the passphrase list_provider_albums returned for it, otherwise the album cannot be opened'),
    },
    annotations: TOOL_ANNOTATIONS_OPEN_WORLD_READONLY,
    when: anyPhotoProviderEnabled,
    access: { group: 'journey', mode: 'read' },
  })
  async listProviderAlbumPhotos(
    { provider, album_id, passphrase }: { provider: ProviderId; album_id: string; passphrase?: string },
    ctx: McpContext,
  ) {
    const refused = this.providerRefusal(provider);
    if (refused) return refused;

    if (provider === 'immich') {
      const result = await this.immich.getAlbumPhotos(ctx.userId, album_id);
      if (result.error) return errorResult(result.error);
      return ok({ provider, album_id, assets: result.assets ?? [] });
    }

    const result = await this.synology.getSynologyAlbumPhotos(ctx.userId, album_id, passphrase);
    if ('error' in result) return errorResult(result.error.message);
    return ok({ provider, album_id, assets: result.data.assets, total: result.data.total });
  }
}
