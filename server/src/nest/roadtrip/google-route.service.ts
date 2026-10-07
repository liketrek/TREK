import { Trips } from '../../db/entities/Trips.entity';
import { Users } from '../../db/entities/Users.entity';
import type { TripsRepository } from '../../db/repositories/Trips.repository';
import type { UsersRepository } from '../../db/repositories/Users.repository';
import { safeFetchFollow } from '../../utils/ssrfGuard';
import { AssignmentsService } from '../assignments/assignments.service';
import { UnitOfWork } from '../database/unit-of-work';
import { MapsService, GOOGLE_SHORT_HOSTS, isGoogleMapsHost } from '../maps/maps.service';
import { PermissionsService } from '../permissions/permissions.service';
import { isDirectionsUrl, parseDirectionsUrl, MAX_DIR_WAYPOINTS } from '../places/maps-dir.helpers';
import { PlacesService } from '../places/places.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { HttpException, Injectable } from '@nestjs/common';
import type { GoogleRouteImport, GoogleRoutePreview } from '@trek/shared';

@Injectable()
export class GoogleRouteService {
  constructor(
    private readonly maps: MapsService,
    private readonly places: PlacesService,
    private readonly assignments: AssignmentsService,
    private readonly permissions: PermissionsService,
    private readonly uow: UnitOfWork,
    @InjectRepository(Trips) private readonly tripsRepo: TripsRepository,
    @InjectRepository(Users) private readonly usersRepo: UsersRepository,
  ) {}

  async preview(raw: string): Promise<GoogleRoutePreview> {
    let url = new URL(raw);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.port ||
      (!isGoogleMapsHost(url.hostname) && !GOOGLE_SHORT_HOSTS.includes(url.hostname))
    )
      throw new HttpException({ error: 'Use a Google Maps directions link.' }, 400);
    if (GOOGLE_SHORT_HOSTS.includes(url.hostname)) {
      const reply = await safeFetchFollow(url.href, { signal: AbortSignal.timeout(10000) });
      url = new URL(reply.url);
      await reply.body?.cancel();
      if (!isGoogleMapsHost(url.hostname))
        throw new HttpException({ error: 'Use a Google Maps directions link.' }, 400);
    }
    if (url.protocol !== 'https:' || !isDirectionsUrl(url.href))
      throw new HttpException({ error: 'Use a Google Maps directions link.' }, 400);
    const waypoints = parseDirectionsUrl(url.href, MAX_DIR_WAYPOINTS + 1);
    if (waypoints.length < 2 || waypoints.length > MAX_DIR_WAYPOINTS)
      throw new HttpException({ error: 'The link must contain between 2 and 30 readable stops.' }, 400);
    const stops: GoogleRoutePreview['stops'] = [];
    for (const waypoint of waypoints) {
      let name = (waypoint.name || `${waypoint.lat}, ${waypoint.lng}`).slice(0, 200);
      if (waypoint.lat !== null && waypoint.lng !== null) {
        if (!waypoint.name) {
          try {
            const place = await this.maps.reverseGeocode(String(waypoint.lat), String(waypoint.lng), undefined, {
              lane: 'background',
              timeoutMs: 5000,
              locality: true,
            });
            name = (place.name || place.address || name).slice(0, 200);
          } catch {
            /* Keep the supplied position when its name cannot be resolved. */
          }
        }
        stops.push({ name, lat: waypoint.lat, lng: waypoint.lng });
        continue;
      }
      let position: { lat: number; lng: number } | null = null;
      if (!/^(your location|my location|dein standort|mein standort|current location)$/i.test(name)) {
        try {
          position = await this.maps.geocodeQuery(name);
        } catch {
          position = null;
        }
      }
      if (
        position &&
        (!Number.isFinite(position.lat) ||
          !Number.isFinite(position.lng) ||
          Math.abs(position.lat) > 90 ||
          Math.abs(position.lng) > 180)
      )
        position = null;
      stops.push({ name, lat: position?.lat ?? null, lng: position?.lng ?? null });
    }
    return { stops };
  }

  async import(tripId: number, userId: number, input: GoogleRouteImport, socketId?: string) {
    // GR0 — `TripsRepository.findAccessible` (keeps the row: `access.user_id` feeds the permission check below).
    const access = await this.tripsRepo.findAccessible(tripId, userId);
    if (!access) throw new HttpException({ error: 'Trip not found' }, 404);
    // GR1 — `UsersRepository.getRole`.
    const role = (await this.usersRepo.getRole(userId)) ?? 'user';
    // `every` cannot await the permission check, so the same all-of test runs as
    // an explicit loop — same actions, same order, same short-circuit.
    for (const action of ['place_edit', 'day_edit']) {
      if (!(await this.permissions.checkPermission(action, role, access.user_id, userId, access.user_id !== userId)))
        throw new HttpException({ error: 'Permission denied' }, 403);
    }
    if (!(await this.assignments.dayExists(String(input.dayId), String(tripId))))
      throw new HttpException({ error: 'Day not found' }, 404);
    // `map` cannot await the now-async assignment write, so the same per-stop
    // sequence runs as an explicit loop inside the transaction.
    const imported = await this.uow.transactional(async () => {
      const rows: {
        place: Awaited<ReturnType<PlacesService['create']>>;
        assignment: Awaited<ReturnType<AssignmentsService['createAssignment']>>;
      }[] = [];
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
