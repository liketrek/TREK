import { ADDON_IDS } from '../../addons';
import { CollectionTours } from '../../db/entities/CollectionTours.entity';
import type { CollectionTourRow, CollectionToursRepository } from '../../db/repositories/CollectionTours.repository';
import { AddonsService } from '../addons/addons.service';
import { CollectionsService } from '../collections/collections.service';
import { DomainError } from '../common/domain-error';
import { UnitOfWork } from '../database/unit-of-work';
import { PermissionsService } from '../permissions/permissions.service';
import { TripAccessService } from '../trip-membership/trip-access.service';
import { TripMembershipService } from '../trip-membership/trip-membership.service';
import {
  keptTourCopySource,
  keptTourItem,
  keptTourLine,
  keptTourPoints,
  keptTourSnapshot,
} from './collection-tours.helpers';
import { copyStart } from './tour-copy.helpers';
import { ToursService } from './tours.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type {
  CollectionTourDetailResponse,
  CollectionTourListResponse,
  CollectionTourSaveRequest,
  CollectionTourSaveResponse,
  CollectionTourTakeOverRequest,
  CollectionTourTarget,
  TourCreateResponse,
} from '@trek/shared';

/** Who asks, as the permission check reads them. */
interface CollectionTourUser {
  id: number;
  role: string;
}

const tourNotFound = () => new DomainError(404, 'Tour not found', { code: 'tour_not_found' });

/**
 * LIB-03: whole tours kept in a collection and taken into a trip again. A
 * kept tour is an independent snapshot made through the tours' one copy
 * model; nothing keeps it in step with the tour it came from or with a tour
 * later made from it. Who may see, keep and remove one follows the
 * collection's own roles; who may take one into a trip follows that trip's
 * `place_edit`, which the caller's guard checks. Both addons have to be on.
 */
@Injectable()
export class CollectionToursService {
  constructor(
    @InjectRepository(CollectionTours) private readonly kept: CollectionToursRepository,
    private readonly collections: CollectionsService,
    private readonly tours: ToursService,
    private readonly access: TripAccessService,
    private readonly membership: TripMembershipService,
    private readonly permissions: PermissionsService,
    private readonly addons: AddonsService,
    private readonly uow: UnitOfWork,
  ) {}

  /** The tours kept in a collection the user can see, the newest first. */
  async list(userId: number, collectionId: number): Promise<CollectionTourListResponse> {
    await this.assertCollectionsOn();
    await this.collections.assertAccess(userId, collectionId);
    return { tours: (await this.kept.listForCollection(collectionId)).map(keptTourItem) };
  }

  /** One kept tour with what taking it into a trip asks about: its line, its points and the trips it could go into. */
  async detail(user: CollectionTourUser, collectionId: number, tourId: number): Promise<CollectionTourDetailResponse> {
    const row = await this.readable(user.id, collectionId, tourId);
    return {
      tour: keptTourItem(row),
      line: keptTourLine(row),
      points: keptTourPoints(row),
      trips: await this.targets(user),
    };
  }

  /**
   * Keeps a saved tour of a trip the user can open in a collection they may
   * add to, as one independent snapshot. The tour is read inside the write, so
   * a tour gone meanwhile leaves nothing behind; the trip is not changed.
   */
  async save(
    userId: number,
    collectionId: number,
    body: CollectionTourSaveRequest,
    socketId?: string,
  ): Promise<CollectionTourSaveResponse> {
    await this.assertCollectionsOn();
    await this.collections.assertCanEdit(userId, collectionId);
    if (!(await this.access.findAccessible(body.source_trip_id, userId))) throw tourNotFound();
    const [trip] = await this.kept.targetTrips([body.source_trip_id]);
    if (!trip) throw tourNotFound();
    const id = await this.uow.transactional(async () => {
      const source = await this.tours.readCopySource(body.source_trip_id, body.source_place_id);
      // A tour with neither a line nor points has nothing a later tour could be made from.
      if (!source || !copyStart(source)) throw tourNotFound();
      return await this.kept.insertSnapshot(
        keptTourSnapshot(source, { collectionId, userId, name: body.name ?? source.name, tripTitle: trip.title }),
      );
    });
    await this.collections.notifyCollectionUsers(collectionId, socketId);
    return { tour: keptTourItem(await this.found(collectionId, id)) };
  }

  /** Removes a kept tour from its collection; like a saved place, only its owner or an admin of it may. */
  async remove(userId: number, collectionId: number, tourId: number, socketId?: string): Promise<void> {
    await this.assertCollectionsOn();
    const role = await this.collections.roleOf(userId, collectionId);
    if (role === null) throw new DomainError(404, 'Collection not found', { code: 'collection_not_found' });
    if (role !== 'owner' && role !== 'admin') {
      throw new DomainError(403, 'Only an admin can remove tours from this list', { code: 'collection_role' });
    }
    if (!(await this.kept.deleteInCollection(collectionId, tourId))) throw tourNotFound();
    await this.collections.notifyCollectionUsers(collectionId, socketId);
  }

  /**
   * Makes a new tour of `tripId` from a kept tour of a collection the user can
   * see. The caller has checked the trip and `place_edit` on it. The points
   * come along only when asked for, in their order with their roles; left out,
   * the new tour keeps the kept line as it is and has no points. A kept tour
   * without a line cannot leave its points behind. The collection is not changed.
   */
  async takeOver(
    tripId: string,
    userId: number,
    body: CollectionTourTakeOverRequest,
    socketId?: string,
  ): Promise<TourCreateResponse> {
    const chosen = await this.readable(userId, body.collection_id, body.collection_tour_id);
    if (!body.include_waypoints && chosen.route_geometry === null) {
      throw new DomainError(409, 'This tour has no line yet, so its points have to come along', {
        code: 'kept_tour_needs_points',
        details: { code: 'kept_tour_needs_points' },
      });
    }
    return await this.tours.createFromKeptTour(
      tripId,
      // Read again inside the write: a kept tour removed meanwhile leaves no half-made tour behind.
      async () =>
        keptTourCopySource(await this.found(body.collection_id, body.collection_tour_id), body.include_waypoints),
      body.name ?? chosen.name,
      { tripTitle: chosen.source_trip_title, tourName: chosen.source_tour_name },
      socketId,
    );
  }

  /** A kept tour of a collection the user can see; the collection's own refusal when they cannot see it. */
  private async readable(userId: number, collectionId: number, tourId: number): Promise<CollectionTourRow> {
    await this.assertCollectionsOn();
    await this.collections.assertAccess(userId, collectionId);
    return await this.found(collectionId, tourId);
  }

  /** The kept tour, 404 when the collection holds no such tour. */
  private async found(collectionId: number, tourId: number): Promise<CollectionTourRow> {
    const row = await this.kept.findInCollection(collectionId, tourId);
    if (!row) throw tourNotFound();
    return row;
  }

  /** Every trip the user can open, the newest first, each saying whether they may add a tour to it. */
  private async targets(user: CollectionTourUser): Promise<CollectionTourTarget[]> {
    const ids = await this.membership.listAccessibleTripIds(user.id);
    const trips = new Map((await this.kept.targetTrips(ids)).map((trip) => [trip.id, trip]));
    const known = ids.flatMap((id) => {
      const trip = trips.get(id);
      return trip ? [trip] : [];
    });
    return await Promise.all(
      known.map(async (trip) => ({
        id: trip.id,
        title: trip.title,
        start_date: trip.start_date,
        end_date: trip.end_date,
        can_add: await this.permissions.checkPermission(
          'place_edit',
          user.role,
          trip.user_id,
          user.id,
          trip.user_id !== user.id,
        ),
      })),
    );
  }

  /** The Tours addon gates the routes; a kept tour lives in a collection, so the Collections addon has to be on too. */
  private async assertCollectionsOn(): Promise<void> {
    if (!(await this.addons.isAddonEnabled(ADDON_IDS.COLLECTIONS))) {
      throw new DomainError(404, 'Collections addon is not enabled', { code: 'addon_disabled' });
    }
  }
}
