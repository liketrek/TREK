import { AiTravelPlans } from '../../db/entities/AiTravelPlans.entity';
import { AI_TRAVEL_PLAN_APPLY_RESULT } from '../../db/json-columns';
import type { AiTravelPlansRepository } from '../../db/repositories/AiTravelPlans.repository';
import { dbNow } from '../../db/types';
import type { User } from '../../types';
import { encodeJson } from '../../utils/json-column';
import { AssignmentsService } from '../assignments/assignments.service';
import { UnitOfWork } from '../database/unit-of-work';
import { DaysService } from '../days/days.service';
import { type PlaceCreateInput, PlacesService } from '../places/places.service';
import { RealtimeService } from '../realtime/realtime.service';
import { TripsService } from '../trips/trips.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type {
  TravelPlanApplyRequest,
  TravelPlanApplyResult,
  TravelPlanDraft,
  TravelPlanDraftItem,
  TravelPlanRequest,
} from '@trek/shared';

/**
 * The plan row another apply claimed first. The transaction that threw this
 * rolled back every row it had written; the caller answers with the trip the
 * winner wrote, or refuses with the plan's current status.
 */
export class PlanApplyClaimLostError extends Error {
  constructor() {
    super('the plan was applied by a concurrent request');
    this.name = 'PlanApplyClaimLostError';
  }
}

/** Only the leg modes a place row spells the same way; anything else keeps the default. */
const LEG_TRANSPORT: Partial<Record<string, string>> = {
  walk: 'walking',
  drive: 'driving',
};

/** What the transaction returns; the events go out only after it commits. */
interface AppliedOutcome {
  tripId: number;
  result: TravelPlanApplyResult;
  createdDays: unknown[];
  createdPlaces: unknown[];
  createdAssignments: unknown[];
}

/**
 * The explicit apply, phase 3: writes a ready draft into a trip.
 *
 * Everything runs in one transaction, including the conditional claim of the
 * plan row (`UPDATE ... WHERE status = 'ready'`). Two concurrent applies can
 * therefore never both write: the loser's rows roll back and it answers the
 * winner's trip. Nothing is broadcast inside the transaction — the room events
 * and `trips:changed` go out after the commit, so a member who refetches sees
 * the committed rows.
 */
@Injectable()
export class PlannerApplyService {
  constructor(
    @InjectRepository(AiTravelPlans) private readonly plans: AiTravelPlansRepository,
    private readonly uow: UnitOfWork,
    private readonly trips: TripsService,
    private readonly days: DaysService,
    private readonly places: PlacesService,
    private readonly assignments: AssignmentsService,
    private readonly realtime: RealtimeService,
  ) {}

  /**
   * Writes the draft into a new trip or into an existing one.
   *
   * @throws PlanApplyClaimLostError when another apply claimed the plan first;
   *         no row from this transaction survives that throw.
   */
  async apply(input: {
    plan: AiTravelPlans;
    user: User;
    body: TravelPlanApplyRequest;
    request: TravelPlanRequest;
    draft: TravelPlanDraft;
  }): Promise<{ tripId: number }> {
    let outcome: AppliedOutcome;
    try {
      outcome = await this.uow.transactional(async () => {
        const now = dbNow();
        const tripId =
          input.body.mode === 'new_trip'
            ? (await this.trips.create(input.user.id, newTrip(input.body, input.request, input.draft))).tripId
            : (input.body.tripId as number);

        // The trip's own days, by date: a draft day that already exists is
        // written into, a missing one is appended instead of duplicated.
        const byDate = await this.days.idsByDate(tripId);
        const dayIds: number[] = [];
        const createdDayIds: number[] = [];
        const createdPlaceIds: number[] = [];
        const createdAssignmentIds: number[] = [];
        const createdDays: unknown[] = [];
        const createdPlaces: unknown[] = [];
        const createdAssignments: unknown[] = [];

        // `for await` is deliberate: every day and every stop is written only
        // after the one before it has its row, so the stops keep draft order.
        for await (const draftDay of input.draft.days) {
          let dayId = byDate.get(draftDay.date);
          if (dayId === undefined) {
            const day = await this.days.create(tripId, draftDay.date);
            dayId = day.id;
            byDate.set(draftDay.date, dayId);
            createdDayIds.push(dayId);
            createdDays.push(day);
          }
          if (!dayIds.includes(dayId)) dayIds.push(dayId);

          // Appended in draft order: `createAssignment` itself puts each row
          // after the day's last one, so an existing plan keeps its order.
          for await (const item of draftDay.items) {
            const place = await this.places.create(String(tripId), placeInput(item));
            const assignment = await this.assignments.createAssignment(dayId, place.id);
            // The row was just inserted in this transaction, so a null here is unreadable data, not an absent one.
            if (!assignment) throw new Error(`applied day ${draftDay.date}: the new assignment is not readable`);
            createdPlaceIds.push(place.id);
            createdAssignmentIds.push(assignment.id);
            createdPlaces.push(place);
            createdAssignments.push(assignment);
          }
        }

        const result: TravelPlanApplyResult = {
          mode: input.body.mode,
          tripId,
          dayIds,
          createdDayIds,
          createdPlaceIds,
          createdAssignmentIds,
          appliedAt: now,
        };
        // The claim: only a plan still `ready` in the database may be applied.
        // A second apply loses here even if it read the plan as ready a moment ago.
        const claimed = await this.plans.nativeUpdate(
          { id: input.plan.id, owner: input.user.id, status: 'ready' },
          {
            status: 'applied',
            applied_trip_id: tripId,
            target_trip_id: input.body.mode === 'existing_trip' ? tripId : null,
            apply_result_json: encodeJson(AI_TRAVEL_PLAN_APPLY_RESULT, result),
            updated_at: now,
          },
        );
        if (claimed === 0) throw new PlanApplyClaimLostError();
        return { tripId, result, createdDays, createdPlaces, createdAssignments };
      });
    } catch (err) {
      if (err instanceof PlanApplyClaimLostError) return await this.winner(input.plan, input.user.id);
      throw err;
    }

    this.announce(input, outcome);
    return { tripId: outcome.tripId };
  }

  /**
   * The undo of a `new_trip` apply: deletes the trip that apply created. Its
   * days, places, assignments and budget items go with it (the schema cascades).
   */
  async undoNewTrip(user: User, tripId: number): Promise<void> {
    await this.trips.remove(tripId, user.id, user.role);
    this.realtime.broadcast(tripId, 'trip:deleted', { id: tripId });
    this.realtime.broadcastToUser(user.id, { type: 'trips:changed' });
  }

  /** The trip the winner of a lost claim wrote, read from the committed row. */
  private async winner(plan: AiTravelPlans, ownerId: number): Promise<{ tripId: number }> {
    const fresh = await this.plans.findOwned(plan.id, ownerId);
    if (fresh?.status === 'applied' && fresh.applied_trip_id) return { tripId: fresh.applied_trip_id };
    throw new PlanApplyClaimLostError();
  }

  /**
   * Announces a committed apply. A `new_trip` apply only exists for its owner
   * so far: `trips:changed` is enough. An `existing_trip` apply reaches the
   * room with the same events the REST create routes emit, once per row.
   */
  private announce(input: { body: TravelPlanApplyRequest; user: User }, outcome: AppliedOutcome): void {
    if (input.body.mode === 'new_trip') {
      this.realtime.broadcastToUser(input.user.id, { type: 'trips:changed' });
      return;
    }
    for (const day of outcome.createdDays) this.realtime.broadcast(outcome.tripId, 'day:created', { day });
    for (const place of outcome.createdPlaces) this.realtime.broadcast(outcome.tripId, 'place:created', { place });
    for (const assignment of outcome.createdAssignments) {
      this.realtime.broadcast(outcome.tripId, 'assignment:created', { assignment });
    }
    this.realtime.broadcastToUser(input.user.id, { type: 'trips:changed' });
  }
}

/** The trip a `new_trip` apply creates: the draft's own span and summary. */
function newTrip(
  body: TravelPlanApplyRequest,
  request: TravelPlanRequest,
  draft: TravelPlanDraft,
): { title: string; description: string | null; start_date: string | null; end_date: string | null } {
  const dates = draft.days.map((day) => day.date).sort();
  const start = dates[0] ?? null;
  const end = dates[dates.length - 1] ?? null;
  const fallback = request.destination
    ? `${request.destination} ${draft.days.length} 日行程`
    : `${draft.days.length} 日行程`;
  return {
    title: (body.title ?? fallback).slice(0, 200),
    description: draft.summary || null,
    start_date: start,
    end_date: end,
  };
}

/**
 * One draft item as a place row. The draft carries only what a provider
 * returned: name, coordinates and — when the provider is named — its id
 * column. No address, price or opening hours are invented for the trip.
 */
function placeInput(item: TravelPlanDraftItem): PlaceCreateInput {
  const input: PlaceCreateInput = {
    name: item.place.name,
    lat: item.place.lat,
    lng: item.place.lng,
  };
  switch (item.place.provider) {
    case 'amap':
      input.amap_poi_id = item.place.providerId;
      break;
    case 'google':
      input.google_place_id = item.place.providerId;
      break;
    case 'openstreetmap':
    case 'osm':
      input.osm_id = item.place.providerId;
      break;
  }
  if (item.arriveAt) input.place_time = item.arriveAt;
  if (item.leaveAt) input.end_time = item.leaveAt;
  const minutes = stayMinutes(item.arriveAt, item.leaveAt);
  if (minutes !== null) input.duration_minutes = minutes;
  const transport = LEG_TRANSPORT[item.travelFromPrevious?.mode ?? 'other'];
  if (transport) input.transport_mode = transport;
  return input;
}

/** Minutes between two `HH:MM` times on one day; null unless both parse. */
function stayMinutes(arriveAt: string | null, leaveAt: string | null): number | null {
  if (!arriveAt || !leaveAt) return null;
  const start = clockMinutes(arriveAt);
  const end = clockMinutes(leaveAt);
  if (start === null || end === null || end <= start) return null;
  return end - start;
}

function clockMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}
