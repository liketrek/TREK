import { MailIngestCandidates } from '../../db/entities/MailIngestCandidates.entity';
import type {
  MailIngestCandidatesRepository,
  MailIngestPersonRow,
  MailIngestTripRow,
} from '../../db/repositories/MailIngestCandidates.repository';
import { PermissionsService } from '../permissions/permissions.service';
import type { TripOption } from './mail-ingest-checks';
import { MAX_TRIP_CANDIDATES, TRIP_LOOKBACK_DAYS } from './mail-ingest.constants';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

/** Open trips read before the permission filter, so trips a person may not edit cannot crowd out the rest. */
const TRIPS_READ = 60;
/** The destinations a trip names to the AI. */
const DESTINATIONS_PER_TRIP = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The trips a booking from a mail may go to: those the person may add
 * bookings to (`reservation_edit`), not archived, that ended at most 30 days
 * ago or have no dates, at most 20 of them. The list is the mail import's
 * whole world: the AI picks from it, the checks weigh it, and nothing outside
 * it is ever written to.
 */
@Injectable()
export class MailIngestTripsService {
  constructor(
    @InjectRepository(MailIngestCandidates) private readonly reads: MailIngestCandidatesRepository,
    private readonly permissions: PermissionsService,
  ) {}

  async person(userId: number): Promise<MailIngestPersonRow | null> {
    return this.reads.findPerson(userId);
  }

  /**
   * The trips the person may add a booking to, those whose dates hold one of
   * `hintDates` first (the dates the mail names), then by start, newest first.
   */
  async editableTrips(person: MailIngestPersonRow, now: Date, hintDates: readonly string[]): Promise<TripOption[]> {
    const cutoff = new Date(now.getTime() - TRIP_LOOKBACK_DAYS * DAY_MS).toISOString().slice(0, 10);
    const rows = await this.reads.listOpenTrips(person.id, cutoff, TRIPS_READ);
    const allowed = await Promise.all(rows.map((row) => this.mayEdit(person, row)));
    const ranked = rows
      .filter((_, i) => allowed[i])
      .map((row, order) => ({ row, order, hit: hintDates.some((date) => covers(row, date)) }))
      .sort((a, b) => Number(b.hit) - Number(a.hit) || a.order - b.order)
      .slice(0, MAX_TRIP_CANDIDATES)
      .map(({ row }) => row);
    return this.withDaysAndPlaces(ranked);
  }

  /** One trip the person may add a booking to, whatever its dates; null when they may not. */
  async editableTrip(person: MailIngestPersonRow, tripId: number): Promise<TripOption | null> {
    const row = await this.reads.findOpenTrip(person.id, tripId);
    if (!row || !(await this.mayEdit(person, row))) return null;
    return (await this.withDaysAndPlaces([row]))[0];
  }

  /** The names a trip is known by, for the AI's list: its places' names, the first few. */
  destinationsOf(trip: TripOption): string[] {
    return [...new Set(trip.places.map((place) => place.name))].slice(0, DESTINATIONS_PER_TRIP);
  }

  private async mayEdit(person: MailIngestPersonRow, trip: MailIngestTripRow): Promise<boolean> {
    const isMember = trip.user_id !== person.id;
    return this.permissions.checkPermission('reservation_edit', person.role, trip.user_id, person.id, isMember);
  }

  private async withDaysAndPlaces(rows: readonly MailIngestTripRow[]): Promise<TripOption[]> {
    const ids = rows.map((row) => row.id);
    const days = await this.reads.listDatedDays(ids);
    const places = await this.reads.listPlacesWithPosition(ids);
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      start_date: row.start_date,
      end_date: row.end_date,
      ownerId: row.user_id,
      currency: (row.currency || 'EUR').toUpperCase(),
      days: new Map(days.filter((day) => day.trip_id === row.id).map((day) => [day.date, day.id])),
      places: places.filter((place) => place.trip_id === row.id),
    }));
  }
}

function covers(trip: MailIngestTripRow, date: string): boolean {
  return !!trip.start_date && !!trip.end_date && trip.start_date <= date && date <= trip.end_date;
}
