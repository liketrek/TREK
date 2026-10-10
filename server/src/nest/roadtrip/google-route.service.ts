import { DomainError } from '../common/domain-error';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import type { GoogleRouteImport, GoogleRoutePreview } from '@trek/shared';
import { MapsService, GOOGLE_SHORT_HOSTS, isGoogleMapsHost } from '../maps/maps.service';
import { isDirectionsUrl, parseDirectionsUrl, MAX_DIR_WAYPOINTS } from '../place-import/place-import.service';
import { safeFetchFollow } from '../../utils/ssrfGuard';
import { UnitOfWork } from '../database/unit-of-work';
import { PlacesService } from '../places/places.service';
import { AssignmentsService } from '../assignments/assignments.service';
import { PermissionsService } from '../permissions/permissions.service';
import { Users } from '../../db/entities/Users.entity';
import type { UsersRepository } from '../../db/repositories/Users.repository';
import { TripAccessService } from '../trip-membership/trip-access.service';

@Injectable()
export class GoogleRouteService {
  constructor(private readonly maps: MapsService,
    private readonly places: PlacesService, private readonly assignments: AssignmentsService,
    private readonly permissions: PermissionsService,
    private readonly uow: UnitOfWork,
    private readonly tripsRepo: TripAccessService,
    @InjectRepository(Users) private readonly usersRepo: UsersRepository) {}

  async preview(raw: string): Promise<GoogleRoutePreview> {
    let url = new URL(raw);
    if (url.protocol !== 'https:' || url.username || url.password || url.port ||
      !isGoogleMapsHost(url.hostname) && !GOOGLE_SHORT_HOSTS.includes(url.hostname))
      throw new DomainError(400, 'Use a Google Maps directions link.');
    if (GOOGLE_SHORT_HOSTS.includes(url.hostname)) {
      const reply = await safeFetchFollow(url.href, { signal: AbortSignal.timeout(10000) });
      url = new URL(reply.url);
      await reply.body?.cancel();
      if (!isGoogleMapsHost(url.hostname)) throw new DomainError(400, 'Use a Google Maps directions link.');
    }
    if (url.protocol !== 'https:' || !isDirectionsUrl(url.href))
      throw new DomainError(400, 'Use a Google Maps directions link.');
    const waypoints = parseDirectionsUrl(url.href, MAX_DIR_WAYPOINTS + 1);
    if (waypoints.length < 2 || waypoints.length > MAX_DIR_WAYPOINTS)
      throw new DomainError(400, 'The link must contain between 2 and 30 readable stops.');
    const stops: GoogleRoutePreview['stops'] = [];
    for (const waypoint of waypoints) {
      let name = (waypoint.name || `${waypoint.lat}, ${waypoint.lng}`).slice(0, 200);
      if (waypoint.lat !== null && waypoint.lng !== null) {
        if (!waypoint.name) {
          try {
            const place = await this.maps.reverseGeocode(String(waypoint.lat), String(waypoint.lng), undefined, { lane: 'background', timeoutMs: 5000, locality: true });
            name = (place.name || place.address || name).slice(0, 200);
          } catch { /* Keep the supplied position when its name cannot be resolved. */ }
        }
        stops.push({ name, lat: waypoint.lat, lng: waypoint.lng });
        continue;
      }
      let position: { lat: number; lng: number } | null = null;
      if (!/^(your location|my location|dein standort|mein standort|current location)$/i.test(name)) {
        try { position = await this.maps.geocodeQuery(name); } catch { position = null; }
      }
      if (position && (!Number.isFinite(position.lat) || !Number.isFinite(position.lng) || Math.abs(position.lat) > 90 || Math.abs(position.lng) > 180)) position = null;
      stops.push({ name, lat: position?.lat ?? null, lng: position?.lng ?? null });
    }
    return { stops };
  }

  async import(tripId: number, userId: number, input: GoogleRouteImport, socketId?: string) {
    // GR0 — `TripsRepository.findAccessible` (keeps the row: `access.user_id` feeds the permission check below).
    const access = await this.tripsRepo.findAccessible(tripId, userId);
    if (!access) throw new DomainError(404, 'Trip not found');
    // GR1 — `UsersRepository.getRole`.
    const role = (await this.usersRepo.getRole(userId)) ?? 'user';
    // `every` cannot await the permission check, so the same all-of test runs as
    // an explicit loop — same actions, same order, same short-circuit.
    for (const action of ['place_edit', 'day_edit']) {
      if (!(await this.permissions.checkPermission(action, role, access.user_id, userId, access.user_id !== userId)))
        throw new DomainError(403, 'Permission denied');
    }
    if (!(await this.assignments.dayExists(String(input.dayId), String(tripId)))) throw new DomainError(404, 'Day not found');
    // `map` cannot await the now-async assignment write, so the same per-stop
    // sequence runs as an explicit loop inside the transaction.
    const imported = await this.uow.transactional(async () => {
      const rows: { place: Awaited<ReturnType<PlacesService['create']>>; assignment: Awaited<ReturnType<AssignmentsService['createAssignment']>> }[] = [];
      for (const stop of input.stops) {
        const place = await this.places.create(String(tripId), { ...stop, transport_mode: 'car', duration_minutes: 0 });
        const assignment = await this.assignments.createAssignment(input.dayId, place.id);
        rows.push({ place, assignment });
      }
      return rows;
    });
    for (const { place, assignment } of imported) {
      this.places.broadcast(String(tripId), 'place:created', { place }, socketId);
      this.assignments.broadcast(String(tripId), 'assignment:created', { assignment }, socketId);
    }
    await this.assignments.reconcile(tripId, socketId);
    return { imported: imported.length };
  }
}
