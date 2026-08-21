import { placeCreateRequestSchema, placeImageUrlSchema, placeUpdateRequestSchema, placeWebsiteSchema } from '@trek/shared';
import { PluginController, PluginMethod } from '../plugins/host/rpc-kit/decorators';
import { PluginGuards } from '../plugins/host/plugin-guards.service';
import { BadParams, ForbiddenResource } from '../plugins/host/rpc-errors';
import { num, schemaMessage } from '../plugins/host/rpc-params';
import type { PluginRpcContext } from '../plugins/host/rpc-kit/types';
import { RealtimeService } from '../realtime/realtime.service';
import { JourneyDomainService } from '../journey/journey-domain.service';
import { PlacesService } from './places.service';
import type { PlaceCreateInput, PlaceUpdateInput } from './places.service';

const PLACE_EDIT_ACTION = 'place_edit';

/**
 * The @trek/shared write schemas carry no string-length caps, so the plugin path
 * mirrors the ones the REST controller adds. Without them a plugin could store a
 * field the web app refuses with a 400, e.g. a 100k-character place name.
 */
const PLACE_STR_LIMITS: Record<string, number> = { name: 200, description: 2000, address: 500, notes: 2000 };

/**
 * The two URL fields the REST controller pins in validateUrlFields. Same reason
 * they are checked there rather than in the contract: the write schemas are open
 * records, so a plugin could otherwise store a thumbnail or a homepage the web
 * app refuses — and both end up somewhere that treats them as a URL.
 */
function capUrls(input: Record<string, unknown>): void {
  const image = input.image_url;
  if (image !== undefined && image !== null && !placeImageUrlSchema.safeParse(image).success) {
    throw new BadParams('invalid place: image_url must be an uploaded path, a photo-proxy path, an inline image or an https URL');
  }
  const website = input.website;
  if (website !== undefined && website !== null && website !== '' && !placeWebsiteSchema.safeParse(website).success) {
    throw new BadParams('invalid place: website must be an http or https URL');
  }
}

/**
 * The place surface a plugin may reach (#plugins).
 *
 * Journey mirroring is best-effort on every path that triggers it, in the REST
 * controller and the MCP tool alike, so a broken journey link can never turn a
 * successful write into an RPC error.
 */
@PluginController()
export class PlacesRpc {
  constructor(
    private readonly places: PlacesService,
    private readonly journey: JourneyDomainService,
    private readonly realtime: RealtimeService,
    private readonly guards: PluginGuards,
  ) {}

  @PluginMethod('places.create', { permission: 'db:write:places' })
  create(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const tripId = num(params.tripId, 'tripId');
    const actor = this.guards.requireActor(ctx, 'place');
    const parsed = placeCreateRequestSchema.safeParse(params.input);
    if (!parsed.success) throw new BadParams(`invalid place: ${schemaMessage(parsed.error)}`);
    this.guards.capStrings(parsed.data as Record<string, unknown>, PLACE_STR_LIMITS);
    capUrls(parsed.data as Record<string, unknown>);
    this.guards.requireTripEdit(tripId, actor, PLACE_EDIT_ACTION);
    const place = this.places.create(String(tripId), parsed.data as unknown as PlaceCreateInput);
    this.realtime.broadcast(tripId, 'place:created', { place });
    this.mirrorJourneys(() => this.journey.onPlaceCreated(tripId, place.id));
    return place;
  }

  @PluginMethod('places.update', { permission: 'db:write:places' })
  async update(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const tripId = num(params.tripId, 'tripId');
    const placeId = num(params.placeId, 'placeId');
    const actor = this.guards.requireActor(ctx, 'place');
    const parsed = placeUpdateRequestSchema.safeParse(params.input);
    if (!parsed.success) throw new BadParams(`invalid place: ${schemaMessage(parsed.error)}`);
    this.guards.capStrings(parsed.data as Record<string, unknown>, PLACE_STR_LIMITS);
    capUrls(parsed.data as Record<string, unknown>);
    this.guards.requireTripEdit(tripId, actor, PLACE_EDIT_ACTION);
    // update is async (it may delete a superseded storage object): await it so the
    // null-refusal check compares against the resolved place, not an always-truthy
    // Promise, and the broadcast below carries the actual place.
    const place = await this.places.update(String(tripId), String(placeId), parsed.data as PlaceUpdateInput);
    if (place === null) throw new ForbiddenResource(`no place ${placeId} on trip ${tripId}`);
    this.realtime.broadcast(tripId, 'place:updated', { place });
    this.mirrorJourneys(() => this.journey.onPlaceUpdated(placeId));
    return place;
  }

  @PluginMethod('places.delete', { permission: 'db:write:places' })
  async delete(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const tripId = num(params.tripId, 'tripId');
    const placeId = num(params.placeId, 'placeId');
    const actor = this.guards.requireActor(ctx, 'place');
    this.guards.requireTripEdit(tripId, actor, PLACE_EDIT_ACTION);
    // Scope the id to the trip before anything else: onPlaceDeleted keys on the place
    // alone, so an id belonging to a foreign trip would detach THAT trip's journey
    // entries even though the delete below refuses it.
    if (!this.places.get(String(tripId), String(placeId))) {
      throw new ForbiddenResource(`no place ${placeId} on trip ${tripId}`);
    }
    // Ahead of the DELETE, like the REST route and the MCP tool:
    // journey_entries.source_place_id is ON DELETE SET NULL, so afterwards the hook
    // finds nothing left to detach and the entries linger as orphans.
    this.mirrorJourneys(() => this.journey.onPlaceDeleted(placeId));
    // The link is gone once the place is, so read it first (#1298).
    const expenseIds = this.places.linkedExpenseIds(tripId, [placeId]);
    // remove is async (it deletes the place's storage object): await it so the
    // refusal check sees the resolved boolean, not an always-truthy Promise.
    if (!(await this.places.remove(String(tripId), String(placeId)))) {
      throw new ForbiddenResource(`no place ${placeId} on trip ${tripId}`);
    }
    this.realtime.broadcast(tripId, 'place:deleted', { placeId });
    for (const itemId of expenseIds) this.realtime.broadcast(tripId, 'budget:deleted', { itemId });
    return { deleted: true };
  }

  /** Journey mirroring never fails a write that already succeeded. */
  private mirrorJourneys(run: () => void): void {
    try {
      run();
    } catch {
      /* non-fatal */
    }
  }
}
