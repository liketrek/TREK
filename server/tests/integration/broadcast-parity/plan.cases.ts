import { DayAssignments } from '../../../src/db/entities/DayAssignments.entity';
import { RoadtripDayBoundaries } from '../../../src/db/entities/RoadtripDayBoundaries.entity';
import { TripFiles } from '../../../src/db/entities/TripFiles.entity';
import type { ListImportResult } from '../../../src/nest/places/places.helpers';
import { PlacesService } from '../../../src/nest/places/places.service';
import { StorageService } from '../../../src/nest/storage/storage.service';
import { makeDayAssignment } from '../../helpers/factories/itinerary';
import { insertRow, updateRows } from '../../helpers/factories/rows';
import type { CaseGroup, Scene } from './types';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

import { Readable } from 'node:stream';
import { vi } from 'vitest';

const CATALOG = "the admin's category catalog is global: no trip room, and the registry has no event for it";

const placesPath = (s: Scene) => `/api/trips/${s.trip.id}/places`;
const daysPath = (s: Scene) => `/api/trips/${s.trip.id}/days`;
/** The assignments of one of the scene's days. */
const dayPlanPath = (s: Scene, day: 0 | 1 | 2) => `/api/trips/${s.trip.id}/days/${s.days[day].id}/assignments`;
/** The per-assignment routes of the scene's assignment. */
const assignmentPath = (s: Scene) => `/api/trips/${s.trip.id}/assignments/${s.assignment.id}`;
const dayNotesPath = (s: Scene) => `/api/trips/${s.trip.id}/days/${s.days[0].id}/notes`;
const onAssignment = (s: Scene) => ({ tripId: s.trip.id, assignmentId: s.assignment.id });

/** One waypoint, the smallest file the importer turns into a place. */
const GPX = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<gpx version="1.1" creator="TREK parity" xmlns="http://www.topografix.com/GPX/1/1">',
  '<wpt lat="48.8583" lon="2.3375"><name>Pont des Arts</name></wpt>',
  '</gpx>',
].join('');

/**
 * A shared Google Maps list without the network: the list reader answers with
 * one place, written the way the importer writes it, so the route and the tool
 * announce a real row.
 */
function stubGoogleList(app: INestApplication): () => void {
  const places = app.get(PlacesService);
  const spy = vi
    .spyOn(places, 'importGoogleList')
    .mockImplementation(async (tripId: string): Promise<ListImportResult> => {
      const place = await places.create(tripId, { name: 'Shakespeare and Company', lat: 48.8526, lng: 2.3471 });
      return { places: [place], listName: 'Left bank', skipped: 0 };
    });
  return () => spy.mockRestore();
}

/** The scene's file becomes a picture, with its bytes in storage, so a place can take it as its image. */
async function fileIsPicture(s: Scene, app: INestApplication): Promise<void> {
  const name = `poster-${s.n}.jpg`;
  await app.get(StorageService).put('files', name, Readable.from(Buffer.from('jpg')), { contentType: 'image/jpeg' });
  await updateRows(
    app.get(MikroORM),
    TripFiles,
    { id: s.file.id },
    { filename: name, original_name: name, mime_type: 'image/jpeg', file_size: 3 },
  );
}

/** A second stop on the first day, behind the scene's assignment. */
async function secondStop(s: Scene, app: INestApplication): Promise<void> {
  await makeDayAssignment(app.get(MikroORM), s.days[0].id, s.place2.id);
}

/**
 * The first day in time order, 07:00 then 08:00, with the scene's via after
 * the first stop: moving the first stop to 09:00 sorts the day and moves the
 * via with its stop.
 */
async function timedDay(s: Scene, app: INestApplication): Promise<void> {
  const orm = app.get(MikroORM);
  await updateRows(orm, DayAssignments, { id: s.assignment.id }, { assignment_time: '07:00' });
  await makeDayAssignment(orm, s.days[0].id, s.place2.id, { assignment_time: '08:00' });
}

/** A road trip day boundary on the second day, after a stop of its own there. */
async function boundaryOnSecondDay(s: Scene, app: INestApplication): Promise<void> {
  const orm = app.get(MikroORM);
  const stop = await makeDayAssignment(orm, s.days[1].id, s.place.id);
  await insertRow(orm, RoadtripDayBoundaries, {
    trip: s.trip.id,
    day_number: 2,
    fromAssignment: stop.id,
    fraction: 0.5,
  });
}

/**
 * The planner: places, the day plan, days, day notes, categories, and the
 * collection places copied into a trip.
 */
export const plan: CaseGroup = {
  name: 'plan',
  prefix: 'BCP-PLAN',
  cases: [
    {
      tool: 'create_place',
      args: (s) => ({ tripId: s.trip.id, name: 'Sacré-Cœur', lat: 48.8867, lng: 2.3431 }),
      rest: {
        method: 'post',
        path: placesPath,
        body: () => ({ name: 'Sacré-Cœur', lat: 48.8867, lng: 2.3431 }),
      },
      expect: ['place:created'],
    },
    {
      // The assistant's way to book a hotel the trip does not have yet (handoff
      // section 8): every tab, the asking one included, gets the new place, the
      // stay with its partner booking and the check-in stop.
      tool: 'create_place_accommodation',
      args: (s) => ({
        tripId: s.trip.id,
        name: 'Mercure Hotel Berlin City',
        lat: 52.5306,
        lng: 13.3846,
        start_day_id: s.days[0].id,
        end_day_id: s.days[2].id,
        check_in: '15:00',
        check_out: '11:00',
      }),
      twin: 'POST /api/trips/:tripId/places, then POST /api/trips/:tripId/accommodations',
      // The place goes out once, already typed as lodging: the stamp the stay
      // puts on it is not sent again as place:updated.
      expect: [
        'place:created',
        'accommodation:created',
        'reservation:created',
        { event: 'assignment:created', all: true },
        { event: 'assignment:reordered', all: true },
      ],
    },
    {
      tool: 'create_and_assign_place',
      args: (s) => ({ tripId: s.trip.id, dayId: s.days[1].id, name: 'Café de Flore', lat: 48.854, lng: 2.3326 }),
      twin: 'POST /api/trips/:tripId/places, then POST /api/trips/:tripId/days/:dayId/assignments',
      expect: ['place:created', 'assignment:created'],
    },
    {
      tool: 'update_place',
      needs: ['place'],
      args: (s) => ({ tripId: s.trip.id, placeId: s.place.id, name: 'Musée du Louvre' }),
      rest: { method: 'put', path: (s) => `${placesPath(s)}/${s.place.id}`, body: () => ({ name: 'Musée du Louvre' }) },
      expect: ['place:updated'],
    },
    {
      tool: 'set_place_image_from_file',
      needs: ['place', 'file'],
      setup: fileIsPicture,
      args: (s) => ({ tripId: s.trip.id, placeId: s.place.id, fileId: s.file.id }),
      rest: {
        method: 'put',
        path: (s) => `${placesPath(s)}/${s.place.id}/image/from-file`,
        body: (s) => ({ file_id: s.file.id }),
      },
      expect: ['place:updated'],
    },
    {
      tool: 'rate_place',
      needs: ['place'],
      args: (s) => ({ tripId: s.trip.id, placeId: s.place.id, rating: 4 }),
      rest: { method: 'put', path: (s) => `${placesPath(s)}/${s.place.id}/rating`, body: () => ({ rating: 4 }) },
      expect: ['place:updated'],
    },
    {
      // The hotel of a stay: the night and its partner booking go with the place,
      // and the deleting tab hears that too, since it only removed the place.
      tool: 'delete_place',
      needs: ['stay'],
      args: (s) => ({ tripId: s.trip.id, placeId: s.stay.placeId }),
      rest: { method: 'delete', path: (s) => `${placesPath(s)}/${s.stay.placeId}` },
      expect: ['place:deleted', { event: 'reservation:deleted', all: true }],
    },
    {
      tool: 'import_places_from_url',
      args: (s) => ({ tripId: s.trip.id, url: 'https://maps.app.goo.gl/parityList', source: 'google-list' }),
      rest: {
        method: 'post',
        path: (s) => `${placesPath(s)}/import/google-list`,
        body: () => ({ url: 'https://maps.app.goo.gl/parityList' }),
      },
      stub: stubGoogleList,
      expect: ['place:created'],
    },
    {
      tool: 'import_trip_gpx',
      args: (s) => ({ tripId: s.trip.id, gpx: GPX, name: 'Paris walk', importRoutes: false, importTracks: false }),
      twin: 'POST /api/trips/:tripId/places/import/gpx, a multipart upload of the same file',
      expect: ['place:created'],
    },
    {
      tool: 'bulk_delete_places',
      needs: ['place', 'place2'],
      args: (s) => ({ tripId: s.trip.id, placeIds: [s.place.id, s.place2.id] }),
      rest: {
        method: 'post',
        path: (s) => `${placesPath(s)}/bulk-delete`,
        body: (s) => ({ ids: [s.place.id, s.place2.id] }),
      },
      expect: ['place:deleted', 'place:deleted'],
    },
    {
      // REST takes the category alone; the tool's other fields are not a difference in events.
      tool: 'bulk_update_places',
      needs: ['place', 'place2', 'category'],
      args: (s) => ({ tripId: s.trip.id, placeIds: [s.place.id, s.place2.id], category_id: s.category.id }),
      rest: {
        method: 'post',
        path: (s) => `${placesPath(s)}/bulk-update`,
        body: (s) => ({ ids: [s.place.id, s.place2.id], category_id: s.category.id }),
      },
      expect: ['place:updated', 'place:updated'],
    },
    {
      tool: 'assign_place_to_day',
      needs: ['place'],
      args: (s) => ({ tripId: s.trip.id, dayId: s.days[1].id, placeId: s.place.id }),
      rest: { method: 'post', path: (s) => dayPlanPath(s, 1), body: (s) => ({ place_id: s.place.id }) },
      expect: ['assignment:created'],
    },
    {
      tool: 'set_assignment_end_day',
      needs: ['assignment'],
      args: (s) => ({ ...onAssignment(s), end_day: true }),
      rest: { method: 'put', path: (s) => `${assignmentPath(s)}/end-day`, body: () => ({ end_day: true }) },
      expect: ['assignment:updated'],
    },
    {
      tool: 'unassign_place',
      needs: ['assignment'],
      args: (s) => ({ ...onAssignment(s), dayId: s.days[0].id }),
      rest: { method: 'delete', path: (s) => `${dayPlanPath(s, 0)}/${s.assignment.id}` },
      expect: ['assignment:deleted'],
    },
    {
      tool: 'clear_day_assignments',
      needs: ['assignment', 'place2'],
      setup: secondStop,
      args: (s) => ({ tripId: s.trip.id, dayId: s.days[0].id }),
      rest: { method: 'delete', path: (s) => dayPlanPath(s, 0) },
      expect: ['assignment:deleted', 'assignment:deleted'],
    },
    {
      // A start that moves sorts the day: the new order and the vias pinned to it
      // reach the writing tab too, which routes on them before its reload.
      tool: 'update_assignment_time',
      needs: ['assignment', 'place2', 'via'],
      setup: timedDay,
      args: (s) => ({ ...onAssignment(s), place_time: '09:00' }),
      rest: { method: 'put', path: (s) => `${assignmentPath(s)}/time`, body: () => ({ place_time: '09:00' }) },
      expect: [
        'assignment:updated',
        { event: 'assignment:reordered', all: true },
        { event: 'roadtripVia:changed', all: true },
      ],
    },
    {
      tool: 'update_assignment_notes',
      needs: ['assignment'],
      args: (s) => ({ ...onAssignment(s), notes: 'Tickets at the side door' }),
      rest: {
        method: 'put',
        path: (s) => `${assignmentPath(s)}/notes`,
        body: () => ({ notes: 'Tickets at the side door' }),
      },
      expect: ['assignment:updated'],
    },
    {
      tool: 'set_leg_transport_mode',
      needs: ['assignment'],
      args: (s) => ({ ...onAssignment(s), transport_mode: 'walking' }),
      rest: {
        method: 'put',
        path: (s) => `${assignmentPath(s)}/transport`,
        body: () => ({ transport_mode: 'walking' }),
      },
      expect: ['assignment:updated'],
    },
    {
      tool: 'set_assignment_route_excluded',
      needs: ['assignment'],
      args: (s) => ({ ...onAssignment(s), excluded: true }),
      rest: { method: 'put', path: (s) => `${assignmentPath(s)}/route`, body: () => ({ excluded: true }) },
      expect: ['assignment:updated'],
    },
    {
      tool: 'move_assignment',
      needs: ['assignment'],
      args: (s) => ({ ...onAssignment(s), newDayId: s.days[1].id }),
      rest: {
        method: 'put',
        path: (s) => `${assignmentPath(s)}/move`,
        body: (s) => ({ new_day_id: s.days[1].id, order_index: 0 }),
      },
      expect: ['assignment:moved'],
    },
    {
      tool: 'set_assignment_participants',
      needs: ['assignment', 'member'],
      args: (s) => ({ ...onAssignment(s), userIds: [s.member.id] }),
      rest: {
        method: 'put',
        path: (s) => `${assignmentPath(s)}/participants`,
        body: (s) => ({ user_ids: [s.member.id] }),
      },
      expect: ['assignment:participants'],
    },
    {
      tool: 'reorder_day_assignments',
      needs: ['assignment'],
      args: (s) => ({ tripId: s.trip.id, dayId: s.days[0].id, assignmentIds: [s.assignment.id] }),
      rest: {
        method: 'put',
        path: (s) => `${dayPlanPath(s, 0)}/reorder`,
        body: (s) => ({ orderedIds: [s.assignment.id] }),
      },
      expect: ['assignment:reordered'],
    },
    {
      // Closed gap G3: the copies used to reach no open planner, on any surface.
      tool: 'copy_collection_places_to_trip',
      needs: ['collection'],
      args: (s) => ({ trip_id: s.trip.id, place_ids: [s.collectionPlace.id] }),
      rest: {
        method: 'post',
        path: () => '/api/addons/collections/copy-to-trip',
        body: (s) => ({ trip_id: s.trip.id, place_ids: [s.collectionPlace.id] }),
      },
      expect: ['place:created'],
    },
    {
      tool: 'create_day_note',
      args: (s) => ({ tripId: s.trip.id, dayId: s.days[0].id, text: 'Bring the museum pass' }),
      rest: { method: 'post', path: dayNotesPath, body: () => ({ text: 'Bring the museum pass' }) },
      expect: ['dayNote:created'],
    },
    {
      tool: 'update_day_note',
      needs: ['dayNote'],
      args: (s) => ({ tripId: s.trip.id, dayId: s.days[0].id, noteId: s.dayNote.id, text: 'Pass in the blue bag' }),
      rest: {
        method: 'put',
        path: (s) => `${dayNotesPath(s)}/${s.dayNote.id}`,
        body: () => ({ text: 'Pass in the blue bag' }),
      },
      expect: ['dayNote:updated'],
    },
    {
      tool: 'delete_day_note',
      needs: ['dayNote'],
      args: (s) => ({ tripId: s.trip.id, dayId: s.days[0].id, noteId: s.dayNote.id }),
      rest: { method: 'delete', path: (s) => `${dayNotesPath(s)}/${s.dayNote.id}` },
      expect: ['dayNote:deleted'],
    },
    {
      tool: 'update_day',
      args: (s) => ({ tripId: s.trip.id, dayId: s.days[1].id, title: 'Montmartre' }),
      rest: { method: 'put', path: (s) => `${daysPath(s)}/${s.days[1].id}`, body: () => ({ title: 'Montmartre' }) },
      expect: ['day:updated'],
    },
    {
      // The calendar day after the last date: the list and the longer trip. Every
      // day of the scene has a date, so no undated day moves back with a road
      // trip boundary on it, and no boundary event follows.
      tool: 'create_day',
      args: (s) => ({ tripId: s.trip.id, dated: true }),
      rest: { method: 'post', path: daysPath, body: () => ({ dated: true }) },
      expect: ['day:reordered', 'trip:updated'],
    },
    {
      tool: 'reorder_days',
      args: (s) => ({ tripId: s.trip.id, orderedIds: [s.days[1].id, s.days[0].id, s.days[2].id] }),
      rest: {
        method: 'put',
        path: (s) => `${daysPath(s)}/reorder`,
        body: (s) => ({ orderedIds: [s.days[1].id, s.days[0].id, s.days[2].id] }),
      },
      expect: ['day:reordered'],
    },
    {
      // The check-in day of a stay: the stay and its booking go with it, and the
      // boundary on the second day moves up with its day, for every tab.
      tool: 'delete_day',
      needs: ['stay', 'place'],
      setup: boundaryOnSecondDay,
      args: (s) => ({ tripId: s.trip.id, dayId: s.days[0].id }),
      rest: { method: 'delete', path: (s) => `${daysPath(s)}/${s.days[0].id}` },
      expect: [
        'day:deleted',
        'day:reordered',
        { event: 'reservation:deleted', all: true },
        'accommodation:deleted',
        { event: 'roadtripBoundary:changed', all: true },
        'trip:updated',
      ],
    },
    {
      tool: 'set_day_default_transport_mode',
      args: (s) => ({ tripId: s.trip.id, dayId: s.days[0].id, transport_mode: 'walking' }),
      rest: {
        method: 'put',
        path: (s) => `${daysPath(s)}/${s.days[0].id}/transport`,
        body: () => ({ transport_mode: 'walking' }),
      },
      expect: ['day:updated'],
    },
  ],
  exempt: [
    {
      tool: 'create_category',
      reason: CATALOG,
      actor: 'admin',
      args: (s) => ({ name: `Rooftop bars ${s.n}` }),
    },
    {
      tool: 'update_category',
      reason: CATALOG,
      actor: 'admin',
      needs: ['category'],
      args: (s) => ({ categoryId: s.category.id, name: `Night markets ${s.n}` }),
    },
    {
      tool: 'delete_category',
      reason: CATALOG,
      actor: 'admin',
      needs: ['category'],
      args: (s) => ({ categoryId: s.category.id }),
    },
  ],
};
