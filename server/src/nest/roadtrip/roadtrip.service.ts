import { DomainError } from '../common/domain-error';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import type { RoadtripDayTrack, RoadtripVia, TrekWsPayload, TrekWsTripEventName } from '@trek/shared';
import { RealtimeService } from '../realtime/realtime.service';
import { UnitOfWork } from '../database/unit-of-work';
import { toRowId } from '../common/row-id';
import { Days } from '../../db/entities/Days.entity';
import type { DaysRepository } from '../../db/repositories/Days.repository';
import { Places } from '../../db/entities/Places.entity';
import type { PlacesRepository } from '../../db/repositories/Places.repository';
import { RoadtripVias } from '../../db/entities/RoadtripVias.entity';
import type { RoadtripViasRepository } from '../../db/repositories/RoadtripVias.repository';
import { RoadtripDayTracks } from '../../db/entities/RoadtripDayTracks.entity';
import type { RoadtripDayTracksRepository } from '../../db/repositories/RoadtripDayTracks.repository';

/**
 * Via points: the places a day's drive is made to pass through without stopping.
 *
 * Kept apart from `day_assignments` on purpose. A stop is somewhere you go — it takes a
 * number in the chain, an arrival time and a line in the itinerary. A via only bends the
 * route. Modelling one as a place would put a numbered stop in the middle of the day for
 * a spot nobody stops at, and it would show up in the PDF, the map pins and the schedule.
 *
 * `roadtrip_vias`/`roadtrip_day_tracks` through `RoadtripViasRepository`/
 * `RoadtripDayTracksRepository` (Plan 3d Task 1); RT1 (`dayExists`) and RT13
 * (`trackExists`) delegate to `DaysRepository.existsInTrip`/
 * `PlacesRepository.isTrackInTrip`, the same trip-scoping gates the 3c
 * repositories already expose.
 */
@Injectable()
export class RoadtripService {
  constructor(
    private readonly realtime: RealtimeService,
    private readonly uow: UnitOfWork,
    @InjectRepository(Days) private readonly daysRepo: DaysRepository,
    @InjectRepository(Places) private readonly placesRepo: PlacesRepository,
    @InjectRepository(RoadtripVias) private readonly viasRepo: RoadtripViasRepository,
    @InjectRepository(RoadtripDayTracks) private readonly tracksRepo: RoadtripDayTracksRepository,
  ) {}

  /**
   * Tells the trip's other clients what the drive looks like now.
   *
   * Two people planning a road trip look at the same line on the same map, and a reshaped
   * drive moves every arrival time after it — so this is not "how one person draws their
   * route", which is what it was taken for when these routes were written silent.
   *
   * The whole day's list goes out rather than the one point that changed: a via carries no
   * identity anybody reads, the client holds them per day, and a drag is a burst of writes
   * whose only interesting state is the one that lands last.
   */
  broadcast<E extends TrekWsTripEventName>(tripId: string, event: E, payload: TrekWsPayload<E>, socketId: string | undefined): void {
    this.realtime.broadcast(tripId, event, payload, socketId);
  }

  /**
   * The gate every write below parses `dayId` through ONCE (rule 21), before
   * it reaches a repository write — never a bare `Number(dayId)`.
   *
   * Load-bearing, not decorative (Task 0 review carry, RT8): `dayId` feeding
   * `RoadtripDayTracksRepository.upsertTrack` is that table's PRIMARY KEY
   * column (`roadtrip_day_tracks.day_id`, a single-column INTEGER PK, unlike
   * `roadtrip_vias.id`'s own separate autoincrement PK) — SQLite accepts
   * `INSERT … VALUES (NULL, …)` on an INTEGER PRIMARY KEY column and
   * silently assigns the next free rowid instead of refusing, so a
   * `Number(dayId)` that resolved to `NaN`/`undefined` would not throw, it
   * would silently write to WHATEVER day that rowid happens to be — possibly
   * another trip's. Every caller of `create`/`createMany` reaches them only
   * after the controller/MCP's own `dayExists` gate already proved `dayId`
   * belongs to this trip (a raw-bind affinity check, R7), so this second
   * parse is defence in depth, not the primary guard — but it is what turns
   * "cannot happen" into "cannot happen even if the first gate is bypassed
   * or wrong", and it is what stops `NaN`/`null` from ever reaching the
   * upsert at all.
   */
  private requireDayId(dayId: string | number): number {
    const parsed = toRowId(dayId);
    if (parsed === null) throw new DomainError(404, 'Day not found');
    return parsed;
  }

  /** The day exists and belongs to this trip. 404 material, checked before every write. RT1 → `DaysRepository.existsInTrip` (raw-bind, the same affinity seam the legacy statement used). */
  async dayExists(dayId: string | number, tripId: string | number): Promise<boolean> {
    return await this.daysRepo.existsInTrip(dayId, tripId);
  }

  // L1 (Plan 3d Task 7 whole-plan review): `toRowId`, not `Number()` — a
  // hex/exponent-spelled id used to coerce to a real row and return its
  // vias/tracks, where the legacy raw-bind statement's affinity never
  // converts a hex string and so matched nothing. `TripAccessGuard` already
  // authorised the SAME hex-spelled id through its own `Number()` (not a
  // leak, rule-21 seam widening) — a miss here answers the legacy empty
  // shape, matching every other read path in this class.
  async listForDay(dayId: string | number): Promise<RoadtripVia[]> {
    const dayIdNum = toRowId(dayId);
    if (dayIdNum === null) return [];
    return await this.viasRepo.listForDay(dayIdNum);
  }

  /** Every via of a trip, so the client can route all days without one request per day. */
  async listForTrip(tripId: string | number): Promise<RoadtripVia[]> {
    const tripIdNum = toRowId(tripId);
    if (tripIdNum === null) return [];
    return await this.viasRepo.listForTrip(tripIdNum);
  }

  async create(dayId: string | number, input: { after_order_index: number; lat: number; lng: number; sequence?: number }): Promise<RoadtripVia> {
    const dayIdNum = this.requireDayId(dayId);
    // Appended after whatever already follows that stop, unless the caller says where.
    // RT4 (`nextSequence`) and RT5 (`insertVia`) in one transaction, so two adds on
    // one leg at once cannot read the same next sequence.
    const id = await this.uow.transactional(async () => {
      const sequence = input.sequence ?? (await this.viasRepo.nextSequence(dayIdNum, input.after_order_index));
      return await this.viasRepo.insertVia({
        day_id: dayIdNum,
        after_order_index: input.after_order_index,
        sequence,
        lat: input.lat,
        lng: input.lng,
      });
    });
    return (await this.viasRepo.findById(id))!;
  }

  /**
   * Lay a chain of vias on one day in a single transaction.
   *
   * One transaction for the same reason `reanchor` uses one: a half-written chain steers
   * the drive onto a road nobody chose, along a stretch of the way and not along the rest.
   * The sequence is the position within the leg, so points arriving in order keep it.
   *
   * `replace_legs` clears by leg rather than by day, so vias the traveller placed by hand
   * on other legs survive a track being laid on this one.
   */
  async createMany(
    dayId: string | number,
    input: {
      vias: { after_order_index: number; lat: number; lng: number }[];
      replace_legs?: number[];
      track?: { place_id: number; stray_km?: number | null } | null;
    },
  ): Promise<RoadtripVia[]> {
    const dayIdNum = this.requireDayId(dayId);
    return await this.uow.transactional(async () => {
      // Inside the same transaction as the chain it describes. A day that says it follows
      // a road whose vias never landed is worse than a day that says nothing.
      if (input.track === null) {
        await this.tracksRepo.deleteForDay(dayIdNum);
      } else if (input.track) {
        await this.tracksRepo.upsertTrack(dayIdNum, input.track.place_id, input.track.stray_km ?? null);
      }
      for (const leg of input.replace_legs ?? []) {
        await this.viasRepo.deleteLeg(dayIdNum, leg);
      }
      // Per leg, because sequence only orders the vias that follow the same stop. Read
      // once up front rather than per insert: the loop is inside the transaction, and a
      // MAX() per point over a hundred points is a hundred scans of the same rows.
      const nextSeq = new Map<number, number>();
      for (const via of input.vias) {
        let seq = nextSeq.get(via.after_order_index);
        if (seq === undefined) {
          seq = await this.viasRepo.nextSequence(dayIdNum, via.after_order_index);
        }
        await this.viasRepo.insertVia({ day_id: dayIdNum, after_order_index: via.after_order_index, sequence: seq, lat: via.lat, lng: via.lng });
        nextSeq.set(via.after_order_index, seq + 1);
      }
      return await this.viasRepo.listForDay(dayIdNum);
    });
  }

  /**
   * The tracks this trip's days follow.
   *
   * Read with the vias in one go: both are wanted on every load of road-trip mode, and a
   * second route for a handful of rows would be a second round trip for nothing.
   */
  async tracksForTrip(tripId: string | number): Promise<RoadtripDayTrack[]> {
    const tripIdNum = toRowId(tripId);
    if (tripIdNum === null) return [];
    return await this.tracksRepo.listForTrip(tripIdNum);
  }

  /** Whether a place is on this trip, and is a track rather than an ordinary place. RT13 → `PlacesRepository.isTrackInTrip`. */
  async trackExists(placeId: number, tripId: string | number): Promise<boolean> {
    const tripIdNum = toRowId(tripId);
    if (tripIdNum === null) return false;
    return await this.placesRepo.isTrackInTrip(placeId, tripIdNum);
  }

  /** Moving a via is the whole edit; where it sits in the chain does not change. */
  async move(
    id: string | number,
    dayId: string | number,
    lat: number,
    lng: number,
    afterOrderIndex?: number,
  ): Promise<RoadtripVia | null> {
    const idNum = toRowId(id);
    const dayIdNum = toRowId(dayId);
    if (idNum === null || dayIdNum === null) return null;
    // RT14 → RT15/RT16, un-transacted (R7 — pin, don't fix): the scoping check and the
    // write that follows are two statements, not one.
    const exists = await this.viasRepo.existsInDay(idNum, dayIdNum);
    if (!exists) return null;
    // The anchor moves with the point when the caller worked out a new one. It is not a
    // property of the via but of where the via sits along the drive, so dragging one past
    // a stop changes which leg it belongs to — and leaving it behind is what made the
    // route run out to the point and back instead of bending through it.
    //
    // RT15/RT16 keep the legacy's own scoping (`WHERE id = ?`, no `AND day_id`) — pinned,
    // not fixed, per R7: the check above is what guards these writes.
    if (afterOrderIndex === undefined) {
      await this.viasRepo.moveCoordinates(idNum, lat, lng);
    } else {
      await this.viasRepo.moveCoordinatesAndAnchor(idNum, lat, lng, afterOrderIndex);
    }
    return await this.viasRepo.findById(idNum);
  }

  /**
   * Re-pin a day's vias in one go, after its stops changed shape.
   *
   * One transaction, because the numbers only mean anything as a set: applying half of a
   * shift leaves two vias claiming the same leg and a third pinned past the end of the
   * day. `AND day_id = ?` on every statement is what stops an id from another day — or
   * another trip — being renumbered through a day the caller does happen to reach.
   *
   * Silent about ids it does not find. The caller computed this list from a snapshot of
   * the day, and a via somebody else deleted in the meantime is not a failure of the
   * re-anchoring; failing the batch over it would leave the rest of the day mis-pinned.
   */
  async reanchor(
    dayId: string | number,
    input: { vias: { id: number; after_order_index: number }[]; remove?: number[] },
  ): Promise<RoadtripVia[]> {
    const dayIdNum = this.requireDayId(dayId);
    return await this.uow.transactional(async () => {
      // Read before writing: the OLD anchor is what says which of two merged
      // legs came first, and after the updates that information is gone.
      const before = new Map((await this.viasRepo.listAnchors(dayIdNum)).map((v) => [v.id, v]));

      for (const id of input.remove ?? []) {
        await this.viasRepo.deleteInDay(id, dayIdNum);
        before.delete(id);
      }
      for (const via of input.vias) {
        await this.viasRepo.setAnchor(via.id, dayIdNum, via.after_order_index);
      }

      // Renumber, because `sequence` is allocated per leg and starts at 0 in
      // each. Re-anchoring MERGES two legs whenever a stop between them goes
      // away, and their two independent series then sit side by side: leg A's
      // 0,1 next to leg B's 0,1. Everything that draws the route orders by
      // sequence, so the drive ran through A0, B0, A1, B1 — forward, back, and
      // forward again — and the wrong order was persisted, survived a reload
      // and could not be repaired except by deleting the vias.
      //
      // The old anchor is the primary key of the sort: the vias of the earlier
      // leg belong ahead of the ones from the leg that merged into it. Old
      // sequence orders within a leg, and the id settles the rest so the result
      // never depends on row order.
      const rows = await this.viasRepo.listLegs(dayIdNum);
      const byLeg = new Map<number, { id: number }[]>();
      for (const row of rows) {
        const list = byLeg.get(row.after_order_index) ?? [];
        list.push(row);
        byLeg.set(row.after_order_index, list);
      }
      for (const list of byLeg.values()) {
        list.sort((a, b) => {
          const pa = before.get(a.id);
          const pb = before.get(b.id);
          return (
            (pa?.after_order_index ?? 0) - (pb?.after_order_index ?? 0) ||
            (pa?.sequence ?? 0) - (pb?.sequence ?? 0) ||
            a.id - b.id
          );
        });
        for (const [index, row] of list.entries()) {
          await this.viasRepo.setSequence(row.id, dayIdNum, index);
        }
      }

      return await this.viasRepo.listForDay(dayIdNum);
    });
  }

  async remove(id: string | number, dayId: string | number): Promise<boolean> {
    const idNum = toRowId(id);
    const dayIdNum = toRowId(dayId);
    if (idNum === null || dayIdNum === null) return false;
    const deleted = await this.viasRepo.deleteInDayCounted(idNum, dayIdNum);
    return deleted > 0;
  }
}
