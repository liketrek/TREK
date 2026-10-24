import { ADDON_IDS } from '../../addons';
import { canRead, canReadTrips, canWrite } from '../../mcp/scopes';
import { noAccess, permissionDenied } from '../../mcp/tools/_shared';
import {
  McpController,
  Tool,
  TOOL_ANNOTATIONS_DELETE,
  TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  TOOL_ANNOTATIONS_READONLY,
  errorResult,
  ok,
  type McpContext,
} from '../../nest-mcp';
import { addonGate, type HasAddons } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { TripAccessService } from '../trip-membership/trip-access.service';
import { CollectionToursService } from './collection-tours.service';
import { NotFoundException } from '@nestjs/common';
import {
  collectionTourSaveRequestSchema,
  collectionTourTakeOverRequestSchema,
  idSchema,
  type CollectionTourSaveRequest,
  type CollectionTourTakeOverRequest,
} from '@trek/shared';

const save = collectionTourSaveRequestSchema.shape;
const takeOver = collectionTourTakeOverRequestSchema.shape;

const toursOn = addonGate(ADDON_IDS.TOURS);
const collectionsOn = addonGate(ADDON_IDS.COLLECTIONS);

/** A kept tour is a tour that lives in a collection, so both addons have to be on. */
async function keptToursOn(ctx: McpContext, self: HasAddons): Promise<boolean> {
  return (await toursOn(ctx, self)) && (await collectionsOn(ctx, self));
}

/**
 * LIB-03: the whole tours a collection keeps, over the same service and the
 * same checks as REST. Reading and removing follow the collection's roles;
 * keeping one also needs the trip it comes from to be open to the user, and
 * taking one into a trip needs 'place_edit' on that trip.
 */
@McpController()
export class CollectionToursMcp {
  constructor(
    private readonly kept: CollectionToursService,
    private readonly access: TripAccessService,
    private readonly guards: McpToolGuardsService,
    // Read by the addon gate of every tool here.
    readonly addons: AddonsService,
  ) {}

  @Tool({
    name: 'list_collection_tours',
    description:
      'List the whole tours kept in a collection (a saved-places list), the newest first: name, type, distance in km, ascent and descent in metres, the planned times, how many control points it keeps, whether it has a line, the trip and tour it was saved from and who saved it. Each is an independent snapshot; later changes to the tour it came from do not reach it. Values a tour does not have stay null.',
    inputSchema: { collection_id: idSchema.describe('The collection to read') },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: keptToursOn,
    access: { group: 'collections', mode: 'read' },
  })
  async listCollectionTours(input: { collection_id: number }, ctx: McpContext) {
    return ok(await this.kept.list(ctx.userId, input.collection_id));
  }

  @Tool({
    name: 'get_collection_tour',
    description:
      'One tour kept in a collection, with what taking it into a trip asks about: its facts, its line thinned to at most 400 points, its control points in order with their roles (start, via, end), names and whether they only shape the route, and every trip the user can open with can_add saying whether they may add a tour to it.',
    inputSchema: {
      collection_id: idSchema.describe('The collection the tour is kept in'),
      collection_tour_id: idSchema.describe('The kept tour, as list_collection_tours gives it'),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: keptToursOn,
    access: (ctx) => canRead(ctx.scopes, 'collections') && canReadTrips(ctx.scopes),
  })
  async getCollectionTour(input: { collection_id: number; collection_tour_id: number }, ctx: McpContext) {
    const role = (await this.guards.isAdminUser(ctx.userId)) ? 'admin' : 'user';
    return ok(await this.kept.detail({ id: ctx.userId, role }, input.collection_id, input.collection_tour_id));
  }

  @Tool({
    name: 'save_tour_to_collection',
    description:
      'Keep a saved tour of a trip in a collection the user may add to, as an independent snapshot: its line, type, measures, settings and control points in order with their roles, and the trip and tour it came from. Its days, its links to places of the trip and the obstacle decisions taken there stay in the trip. Later changes to the tour do not reach the kept one, and the trip is not changed. Give name to keep it under another name.',
    inputSchema: {
      collection_id: idSchema.describe('The collection to keep the tour in'),
      source_trip_id: save.source_trip_id,
      source_place_id: save.source_place_id,
      name: save.name,
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: keptToursOn,
    access: (ctx) => canWrite(ctx.scopes, 'collections') && canReadTrips(ctx.scopes),
  })
  async saveTourToCollection(input: { collection_id: number } & CollectionTourSaveRequest, ctx: McpContext) {
    const { collection_id, ...body } = input;
    return ok(await this.kept.save(ctx.userId, collection_id, body));
  }

  @Tool({
    name: 'take_over_collection_tour',
    description:
      'Make a new, independent tour of a trip from a tour kept in a collection. include_waypoints must be said: true brings its control points along in their order with their roles, false keeps only its line as saved and adds no points (a kept tour without a line needs its points). It gets no days and no new places, remembers the trip and tour it was first saved from, and neither the collection nor the tour it came from changes. Needs place_edit on the trip.',
    inputSchema: {
      tripId: idSchema.describe('The trip to add the tour to'),
      collection_id: takeOver.collection_id,
      collection_tour_id: takeOver.collection_tour_id,
      include_waypoints: takeOver.include_waypoints,
      name: takeOver.name,
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: keptToursOn,
    access: (ctx) => canWrite(ctx.scopes, 'trips') && canRead(ctx.scopes, 'collections'),
  })
  async takeOverCollectionTour(input: { tripId: number } & CollectionTourTakeOverRequest, ctx: McpContext) {
    const { tripId, ...body } = input;
    if (!(await this.access.findAccessible(tripId, ctx.userId))) return noAccess();
    if (!(await this.guards.hasTripPermission('place_edit', tripId, ctx.userId))) return permissionDenied();
    try {
      return ok(await this.kept.takeOver(String(tripId), ctx.userId, body));
    } catch (err: unknown) {
      // The copy model refuses a tour with nothing to copy the way LIB-02's take-over does.
      if (err instanceof NotFoundException) return errorResult('Tour not found.');
      throw err;
    }
  }

  @Tool({
    name: 'delete_collection_tour',
    description:
      'Remove a tour kept in a collection. Only the collection’s owner or an admin of it may. Tours already made from it in trips stay as they are.',
    inputSchema: {
      collection_id: idSchema.describe('The collection the tour is kept in'),
      collection_tour_id: idSchema.describe('The kept tour to remove'),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    when: keptToursOn,
    access: { group: 'collections', mode: 'write' },
  })
  async deleteCollectionTour(input: { collection_id: number; collection_tour_id: number }, ctx: McpContext) {
    await this.kept.remove(ctx.userId, input.collection_id, input.collection_tour_id);
    return ok({ success: true });
  }
}
