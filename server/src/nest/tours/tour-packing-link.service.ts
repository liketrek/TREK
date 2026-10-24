import { ADDON_IDS } from '../../addons';
import { TourPackingLinks } from '../../db/entities/TourPackingLinks.entity';
import { Tours } from '../../db/entities/Tours.entity';
import type { TourPackingLinksRepository } from '../../db/repositories/TourPackingLinks.repository';
import type { TourListRow, ToursRepository } from '../../db/repositories/Tours.repository';
import { AddonsService } from '../addons/addons.service';
import { DomainError } from '../common/domain-error';
import { toRowId } from '../common/row-id';
import { PackingService } from '../packing/packing.service';
import { ToursService } from './tours.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import {
  linkedPackingItems,
  type TourDetailResponse,
  type TourPackingLink,
  type TourPackingLinkRequest,
  type TourPackingLinkResponse,
  type TourPackingLinkState,
} from '@trek/shared';

/** A packing item as the viewer may see it, with what a link shows of it. */
interface VisiblePackingItem {
  id: number;
  name: string;
  category: string | null;
  checked: number | null;
  quantity: number;
}

/** One item of a linked list as an assistant reads it. */
interface TourPackingViewItem {
  id: number;
  name: string;
  category: string | null;
  quantity: number;
  packed: boolean;
}

/**
 * P2D-XD-01: a tour's packing link as an assistant reads it: what it points
 * at, the items of it the user may see with how many are packed, and the
 * tour's own facts as context for a suggestion. Unknown facts stay null.
 */
interface TourPackingView {
  packing_link: TourPackingLink | null;
  /** How the link reads; null while the tour points at nothing. */
  state: TourPackingLinkState | null;
  items: TourPackingViewItem[];
  packed: number;
  total: number;
  tour: {
    name: string;
    tour_type: string;
    distance_km: number | null;
    elevation_gain_m: number | null;
    elevation_loss_m: number | null;
    walking_minutes: number | null;
    planned_duration_minutes: number | null;
    difficulty: string | null;
    max_hiking_difficulty: number | null;
  };
}

/** A saved tour of the trip, by the ids a route or a tool names it with. */
interface TourInTrip {
  tripId: number;
  placeId: number;
  tour: TourListRow;
}

/**
 * P2D-XD-01: a tour points at the packing list of its trip, as a whole or at
 * one of its categories. Packing keeps the list, its items and who sees which:
 * the link is read against the items the user may see, and nothing here
 * copies, changes or deletes one. Linking needs the Packing addon on and, for a
 * category, that the user can see an item of it; removing a link leaves the
 * list as it was. REST and MCP call the same methods.
 */
@Injectable()
export class TourPackingLinkService {
  constructor(
    @InjectRepository(TourPackingLinks) private readonly links: TourPackingLinksRepository,
    @InjectRepository(Tours) private readonly toursRepo: ToursRepository,
    private readonly tours: ToursService,
    private readonly packing: PackingService,
    private readonly addons: AddonsService,
  ) {}

  /** The saved tour of this trip; 404 for a tour of another trip, a plain place or a malformed id. */
  private async tourIn(tripId: number | string, placeId: number | string): Promise<TourInTrip> {
    const tid = toRowId(tripId);
    const pid = toRowId(placeId);
    const tour = tid !== null && pid !== null ? await this.toursRepo.findInTrip(tid, pid) : undefined;
    if (!tour || tid === null || pid === null) throw new DomainError(404, 'Tour not found');
    return { tripId: tid, placeId: pid, tour };
  }

  /** Packing has to be on for a link to be made or read through. */
  private async requirePacking(): Promise<void> {
    if (!(await this.addons.isAddonEnabled(ADDON_IDS.PACKING))) {
      throw new DomainError(404, 'Packing addon is not enabled', { code: 'packing_addon_off' });
    }
  }

  /** The packing items of the trip this user may see, in the order Packing lists them. */
  private async visibleItems(tripId: number, userId: number): Promise<VisiblePackingItem[]> {
    const items: VisiblePackingItem[] = await this.packing.listItems(tripId, userId);
    return items;
  }

  /** What the tour points at; null while it points at nothing. */
  async read(tripId: number | string, placeId: number | string): Promise<TourPackingLinkResponse> {
    const { placeId: pid } = await this.tourIn(tripId, placeId);
    return { packing_link: (await this.links.findForTour(pid)) ?? null };
  }

  /**
   * Points the tour at the whole packing list or at one of its categories,
   * replacing what it pointed at. A category must hold an item this user can
   * see, so a link never names one they cannot reach. Answers the tour with
   * its new link.
   */
  async link(
    tripId: string,
    placeId: string,
    body: TourPackingLinkRequest,
    userId: number,
    socketId?: string,
  ): Promise<TourDetailResponse> {
    const tour = await this.tourIn(tripId, placeId);
    await this.requirePacking();
    if (body.category !== null) {
      const items = await this.visibleItems(tour.tripId, userId);
      if (!items.some((item) => item.category === body.category)) {
        throw new DomainError(400, 'Packing category not found', { code: 'packing_category_not_found' });
      }
    }
    await this.links.put(tour.placeId, body.category, userId);
    return await this.announce(tripId, tour.placeId, socketId);
  }

  /** Lets go of what the tour points at. The packing list and its items stay as they are. */
  async unlink(tripId: string, placeId: string, socketId?: string): Promise<TourDetailResponse> {
    const tour = await this.tourIn(tripId, placeId);
    await this.links.remove(tour.placeId);
    return await this.announce(tripId, tour.placeId, socketId);
  }

  /** Tells the trip's other clients and answers the tour with its link as it is now. */
  private async announce(tripId: string, placeId: number, socketId?: string): Promise<TourDetailResponse> {
    this.tours.broadcastToursChanged(tripId, [placeId], socketId);
    const detail = await this.tours.getTour(tripId, String(placeId));
    return { ...detail, packing_link: (await this.links.findForTour(placeId)) ?? null };
  }

  /**
   * The link as an assistant reads it: the items the user may see of what it
   * points at, and the tour's facts as context. Reading changes nothing.
   */
  async view(tripId: number, placeId: number, userId: number): Promise<TourPackingView> {
    const { tour } = await this.tourIn(tripId, placeId);
    await this.requirePacking();
    const link = (await this.links.findForTour(placeId)) ?? null;
    const context = {
      name: tour.name,
      tour_type: tour.tour_type,
      distance_km: tour.distance,
      elevation_gain_m: tour.elevation_gain,
      elevation_loss_m: tour.elevation_loss,
      walking_minutes: tour.duration,
      planned_duration_minutes: tour.planned_duration_minutes,
      difficulty: tour.difficulty,
      max_hiking_difficulty: tour.max_hiking_difficulty,
    };
    if (!link) return { packing_link: null, state: null, items: [], packed: 0, total: 0, tour: context };
    const linked = linkedPackingItems(link, await this.visibleItems(tripId, userId));
    return {
      packing_link: link,
      state: linked.state,
      items: linked.items.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        packed: Boolean(item.checked),
      })),
      packed: linked.packed,
      total: linked.items.length,
      tour: context,
    };
  }
}
