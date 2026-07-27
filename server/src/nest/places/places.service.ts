import { Injectable } from '@nestjs/common';
import { TRACK_COLORS } from '@trek/shared';
import { broadcast } from '../../websocket';
import { DatabaseService } from '../database/database.service';
import { checkPermission } from '../../services/permissions';
import type { User } from '../../types';
import * as svc from '../../services/placeService';
import { onPlaceCreated, onPlaceUpdated, onPlaceDeleted } from '../../services/journeyService';

type Trip = { user_id: number };

type ImportedPlace = { id: number; route_geometry?: string | null; route_color?: string | null };

/**
 * Thin Nest wrapper around the existing place service. Trip access mirrors the
 * requireTripAccess middleware (canAccessTrip); mutations use 'place_edit'. The
 * SQL, the GPX/map/list importers and the journey hooks reuse the legacy code
 * unchanged.
 */
@Injectable()
export class PlacesService {
  constructor(private readonly dbs: DatabaseService) {}

  verifyTripAccess(tripId: string, userId: number) {
    return this.dbs.canAccessTrip(Number(tripId), userId) as Trip | null | undefined;
  }

  canEdit(trip: Trip, user: User): boolean {
    return checkPermission('place_edit', user.role, trip.user_id, user.id, trip.user_id !== user.id);
  }

  broadcast(tripId: string, event: string, payload: Record<string, unknown>, socketId: string | undefined): void {
    broadcast(tripId, event, payload, socketId);
  }

  list(tripId: string, filters: { search?: string; category?: string; tag?: string }) {
    return svc.listPlaces(tripId, filters);
  }

  get(tripId: string, id: string) {
    return svc.getPlace(tripId, id);
  }

  create(tripId: string, data: Parameters<typeof svc.createPlace>[1]) {
    return svc.createPlace(tripId, data);
  }

  update(tripId: string, id: string, data: Parameters<typeof svc.updatePlace>[2], ifMatch?: string) {
    return svc.updatePlace(tripId, id, data, ifMatch);
  }

  remove(tripId: string, id: string): boolean {
    return svc.deletePlace(tripId, id);
  }

  removeMany(tripId: string, ids: number[]): number[] {
    return svc.deletePlacesMany(tripId, ids);
  }

  updateMany(tripId: string, ids: number[], data: Parameters<typeof svc.updatePlacesMany>[2]) {
    return svc.updatePlacesMany(tripId, ids, data);
  }

  importGpx(
    tripId: string,
    buffer: Buffer,
    opts: { importWaypoints: boolean; importRoutes: boolean; importTracks: boolean; defaultName?: string },
  ) {
    return this.colorizeImportedTracks(tripId, svc.importGpx(tripId, buffer, opts));
  }

  async importMapFile(tripId: string, buffer: Buffer, filename: string, opts: svc.KmlImportOptions) {
    return this.colorizeImportedTracks(tripId, await svc.importMapFile(tripId, buffer, filename, opts));
  }

  /**
   * Hand every freshly imported track its own colour (#776).
   *
   * The importers never assign a category, so without this every track in a
   * trip renders in the same #3b82f6 — which is the actual complaint behind
   * the request: several walks in one area are impossible to tell apart.
   *
   * Picks the palette entries the trip is not already using rather than
   * counting rows: counting collides as soon as somebody recolours a track by
   * hand or deletes one, which is exactly when distinguishability matters.
   * Once all ten are taken it wraps around — ten walks in one trip is already
   * past what a colour alone can separate.
   *
   * Only rows that carry geometry are touched, and only ones that have no
   * colour yet; plain waypoints and existing places stay untouched.
   */
  private colorizeImportedTracks<T extends { places: ImportedPlace[] } | null>(tripId: string, result: T): T {
    const tracks = result?.places?.filter((p) => p.route_geometry && !p.route_color) ?? [];
    if (tracks.length === 0) return result;

    // Read and write in one transaction so two concurrent imports cannot both
    // read the same set of free colours.
    this.dbs.transaction((conn) => {
      const taken = new Set(
        (conn
          .prepare('SELECT DISTINCT route_color AS c FROM places WHERE trip_id = ? AND route_color IS NOT NULL')
          .all(tripId) as { c: string }[]).map((r) => r.c),
      );
      const free = TRACK_COLORS.filter((c) => !taken.has(c));
      const stmt = conn.prepare('UPDATE places SET route_color = ? WHERE id = ?');
      tracks.forEach((track, i) => {
        // Free ones first, then wrap through the whole palette — never reuse a
        // free colour twice within the same import.
        const color = i < free.length ? free[i] : TRACK_COLORS[(i - free.length) % TRACK_COLORS.length];
        stmt.run(color, track.id);
        track.route_color = color;
      });
    });

    return result;
  }

  importGoogleList(tripId: string, url: string, opts?: Parameters<typeof svc.importGoogleList>[2]) {
    return svc.importGoogleList(tripId, url, opts);
  }

  importNaverList(tripId: string, url: string, opts?: Parameters<typeof svc.importNaverList>[2]) {
    return svc.importNaverList(tripId, url, opts);
  }

  searchImage(tripId: string, id: string, userId: number) {
    return svc.searchPlaceImage(tripId, id, userId);
  }

  rate(tripId: string, id: string, userId: number, rating: number | null) {
    return svc.ratePlace(tripId, id, userId, rating);
  }

  // Journey hooks — non-fatal, mirroring the route's try/catch wrappers.
  onCreated(tripId: string, placeId: number): void { try { onPlaceCreated(Number(tripId), placeId); } catch { /* non-fatal */ } }
  onUpdated(placeId: number): void { try { onPlaceUpdated(placeId); } catch { /* non-fatal */ } }
  onDeleted(placeId: number): void { try { onPlaceDeleted(placeId); } catch { /* non-fatal */ } }
}
