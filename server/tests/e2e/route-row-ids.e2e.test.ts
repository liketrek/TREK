/**
 * ROUTEID: no row id a request carries reaches SQL in a spelling toRowId
 * refuses, on any route, on any engine.
 *
 * An id bound to SQL as the string it arrived as is three answers: SQLite
 * compares it by affinity and matches nothing (or, for '5e0', row 5),
 * Postgres 14 and 15 refuse the cast with an error (a 500), and Postgres 16
 * and later read hex and underscores as a number and reach a real row.
 * `Number()`, `parseInt()` and Nest's `ParseIntPipe` read '0x5', '5e0', '5.0'
 * or '+5' as row 5 on every engine, and hand Postgres a NaN or a number past
 * the bigint range. The one rule is `toRowId` (src/db/row-id.ts): only the
 * canonical decimal spelling is an id, and everything else names no row.
 *
 * ROUTEID-001 walks every route the app registers. For each path param named
 * like an id it sends 'abc' and the non-canonical spellings of an id that
 * exists (seeded below), with every other param holding a real id and a body
 * the route's DTO accepts, and requires no 5xx and the same status and body as
 * 'abc' for each. It then sends the spellings of an id no row has and records
 * what the database drivers are handed (tests/helpers/sql-capture.ts): none
 * may carry the spelling, or the number Number() makes of it, so a route over
 * a table this suite seeds nothing in is held as well.
 *
 * ROUTEID-002 walks every request schema (the @trek/shared request, body and
 * query schemas and every route's body and query DTO) for fields named like a
 * row id and requires each to refuse those spellings, so the Zod pipe answers
 * 400 before a handler sees one. MCPROWID (mcp-resource-row-ids.e2e.test.ts)
 * does the same for MCP resource URIs, RPCROWID
 * (tests/unit/nest-rpc/rpc-row-id-params.test.ts) for plugin RPC params.
 *
 * It boots the app on the real database module, so it runs in the SQLite
 * suite and in the Postgres lane on 14 and 19.
 */
import { buildApp } from '../../src/bootstrap';
import { Addons } from '../../src/db/entities/Addons.entity';
import { RateLimitService } from '../../src/nest/common/rate-limit.service';
import { makeBucketListItem } from '../helpers/factories/atlas';
import { makeBudgetItem } from '../helpers/factories/budget';
import { makeCollabNote } from '../helpers/factories/collab';
import { makeCollection, makeCollectionPlace } from '../helpers/factories/collections';
import { makeDayAssignment, makeDayNote } from '../helpers/factories/itinerary';
import { makeJourney, makeJourneyEntry } from '../helpers/factories/journeys';
import { makeNotification } from '../helpers/factories/notifications';
import { makePackingBag, makePackingItem } from '../helpers/factories/packing';
import { makePlace } from '../helpers/factories/places';
import { makeReservation } from '../helpers/factories/reservations';
import { updateRows } from '../helpers/factories/rows';
import { makeTodoItem } from '../helpers/factories/todos';
import { makeTrip, readTripDays } from '../helpers/factories/trips';
import { makeAdmin, makeUser } from '../helpers/factories/users';
import { oneByOne } from '../helpers/one-by-one';
import { routeBodySchemas, routeRequestDtos, sampleBody } from '../helpers/route-bodies';
import { malformedAccepted, malformedIdSpellings, rowIdFields } from '../helpers/row-id-fields';
import { carriedTo, installSqlCapture, recordSql, uninstallSqlCapture } from '../helpers/sql-capture';
import { sessionCookie } from './harness';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';
import * as contracts from '@trek/shared';

import http from 'node:http';
import type { AddressInfo } from 'node:net';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { z } from 'zod';

/** A path param is taken for a row id when it is named like one. */
const ID_PARAM = /^(id|pid|lid|[a-z][A-Za-z]*Id)$/;

/**
 * Params named like an id that do not hold an integer row id, keyed
 * `METHOD path :param` or `* path-prefix :param`, each with its reason.
 */
const NOT_ROW_IDS: Record<string, string> = {
  '* /api/plugins/ :pluginId': 'a plugin id is its manifest slug',
  '* /api/plugin-oauth/ :id': 'a plugin id is its manifest slug',
  '* /api/admin/plugins/ :id': 'a plugin id is its manifest slug',
  '* /api/integrations/memories/immich/ :assetId': 'an Immich asset id is a provider string',
  '* /api/integrations/memories/synologyphotos/ :photoId': 'a Synology photo id is a provider string',
  '* /api/public/journey/ :assetId': 'a provider asset id is a provider string',
  '* /api/plugin-settings/ :id': 'a plugin id is its manifest slug',
  '* /api/oauth/clients/ :id': 'an OAuth client row id is a generated text key',
  'PUT /api/admin/addons/:id :id': 'an addon id is its key',
  'PUT /api/trips/:tripId/addons/:addonId :addonId': 'an addon id is its key',
  'GET /api/maps/place-photo/:placeId :placeId': 'a maps provider place id is a provider string',
  '* /api/ :toolCallId': "an assistant tool call id is the model's string",
};

/**
 * Request fields named like a row id that do not hold an integer row id, by
 * field name, or by `<schema> <path>` where the name means a row id elsewhere.
 * The schema is the @trek/shared export, or the DTO class for a schema the
 * server declares itself.
 */
const NOT_ROW_ID_FIELDS: Record<string, string> = {
  spreadId: 'a photo book spread id is a generated string',
  spreadIds: 'a photo book spread id is a generated string',
  afterSpreadId: 'a photo book spread id is a generated string',
  elementId: 'a photo book element id is a generated string',
  elementIds: 'a photo book element id is a generated string',
  photoElementId: 'a photo book element id is a generated string',
  groupId: 'a photo book group id is a generated string',
  designId: 'a photo book design id is a generated string',
  layoutId: 'a photo book layout id is a generated string',
  stickerId: 'a sticker id is a catalog key',
  toolCallId: "an assistant tool call id is the model's string",
  client_id: 'an OAuth or OIDC client id is a string',
  accessKeyId: 'an S3 access key id is a credential',
  google_place_id: 'a Google place id is a provider string',
  osm_id: 'an OpenStreetMap id is a provider string such as "node/123"',
  placeId: 'a maps provider place id is a provider string',
  pickedPlaceId: 'a maps provider place id is a provider string',
  trailId: 'a Wanderer trail id is a provider string',
  pluginId: 'a plugin id is its manifest slug',
  asset_id: 'a photo provider asset id is a provider string',
  asset_ids: 'a photo provider asset id is a provider string',
  album_id: 'a photo provider album id is a provider string',
  remoteRootId: 'a document provider folder id is a provider string',
  flightIds: 'an AirTrail flight id is a provider string',
  'bookSaveRequestSchema $.document.spreads[].id': 'a photo book spread id is a generated string',
  'bookSaveRequestSchema $.document.spreads[].elements[].id': 'a photo book element id is a generated string',
  'bookSaveRequestSchema $.document.spreads[].parked[].id': 'a photo book element id is a generated string',
  'bookSaveRequestSchema $.document.spreads[].groups[].id': 'a photo book group id is a generated string',
  'bookSaveRequestSchema $.document.layouts[].id': 'a photo book layout id is a generated string',
  'bookSaveRequestSchema $.document.layouts[].elements[].id': 'a photo book element id is a generated string',
  'bookSaveRequestSchema $.document.theme.id': 'a photo book theme id is a catalog key',
  'restoreBookPageRequestSchema $.pages[].spread.id': 'a photo book spread id is a generated string',
  'restoreBookPageRequestSchema $.pages[].spread.elements[].id': 'a photo book element id is a generated string',
  'restoreBookPageRequestSchema $.pages[].spread.parked[].id': 'a photo book element id is a generated string',
  'restoreBookPageRequestSchema $.pages[].spread.groups[].id': 'a photo book group id is a generated string',
  'editBookPageRequestSchema $.ops[].id': 'a photo book element or group id is a generated string',
  'previewBookPageRequestSchema $.ops[].id': 'a photo book element or group id is a generated string',
  'reviseBookDesignRequestSchema $.ops[].id': 'a photo book element or group id is a generated string',
  'paddleRegionRequestSchema $.id': 'a paddle region id is a catalog key',
  'pluginInstallRequestSchema $.id': 'a plugin id is its manifest slug',
};

/**
 * Open fields (`z.unknown()`) named like a row id, whose handler answers its
 * own error for a bad value and so reads the id itself with toRowId, keyed
 * `<schema> <path>`, each naming where. contracts:open only lets these shrink.
 */
const READ_BY_HANDLER: Record<string, string> = {
  'journeyCreateRequestSchema $.trip_ids': 'JourneyController.create keeps the entries toRowId reads (JRNID-001)',
  'journeyAddTripRequestSchema $.trip_id': "JourneyController.addTrip, 400 'trip_id required' (JRNID-002)",
  'journeyReorderEntriesRequestSchema $.orderedIds':
    "JourneyController.reorderEntries, 400 'orderedIds must be...' (JRNID-003)",
  'journeyContributorRequestSchema $.user_id': "JourneyController.addContributor, 400 'user_id required' (JRNID-004)",
  'journeyLinkPhotoRequestSchema $.journey_photo_id':
    "JourneyController.linkPhoto, 400 'journey_photo_id required' (JRNID-005)",
  'journeyLinkPhotoRequestSchema $.photo_id':
    "JourneyController.linkPhoto, 400 'journey_photo_id required' (JRNID-005)",
};

const METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;
type Method = (typeof METHODS)[number];

interface Route {
  method: Method;
  path: string;
}

interface Answer {
  status: number;
  body: string;
}

let app: INestApplication;
let orm: MikroORM;

function isZodSchema(value: unknown): value is z.ZodType {
  return typeof value === 'object' && value !== null && '_zod' in value;
}

/** Every route Express holds once Nest is initialised, in registration order. */
function registeredRoutes(): Route[] {
  type Layer = { route?: { path: unknown; methods: Record<string, boolean> } };
  const express = app.getHttpAdapter().getInstance() as { router: { stack: Layer[] } };
  const routes: Route[] = [];
  for (const layer of express.router.stack) {
    if (!layer.route || typeof layer.route.path !== 'string') continue;
    for (const method of METHODS) {
      if (layer.route.methods[method]) routes.push({ method, path: layer.route.path });
    }
  }
  return routes;
}

function exempts(key: string, route: Route, param: string): boolean {
  const [method, path, name] = key.split(' ');
  if (name !== `:${param}`) return false;
  if (method === '*') return route.path.startsWith(path);
  return method === route.method.toUpperCase() && path === route.path;
}

function exempt(route: Route, param: string): boolean {
  return Object.keys(NOT_ROW_IDS).some((key) => exempts(key, route, param));
}

function pathParams(route: Route): string[] {
  return [...route.path.matchAll(/:([A-Za-z_]+)/g)].map((m) => m[1]);
}

/**
 * An id no seeded row has. A route that reads '0x3ade68b1' or '987654321e0' with
 * Number() binds this number although no answer shows it, on a table this
 * suite seeds nothing in as well as on one it does.
 */
const UNUSED_ID = 987654321;

describe('ROUTEID: every route answers a malformed path id like an unknown one', () => {
  let cookie: string;
  /**
   * One listening server and one keep-alive connection pool for the whole walk:
   * supertest on an unbound server listens anew per request, and a few thousand
   * requests run the machine out of ephemeral ports.
   */
  let baseUrl: string;
  const keepAlive = new http.Agent({ keepAlive: true, maxSockets: 1 });
  /** The id each param names in the seeded world, by param name or by the path segment before `:id`. */
  const ids: Record<string, number> = {};

  beforeAll(async () => {
    installSqlCapture();
    app = await buildApp();
    orm = app.get(MikroORM);
    await app.listen(0, '127.0.0.1');
    baseUrl = `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}`;
    await updateRows(orm, Addons, {}, { enabled: true });

    const { user: admin } = await makeAdmin(orm);
    const { user: other } = await makeUser(orm);
    cookie = sessionCookie(admin.id);
    const trip = await makeTrip(orm, admin.id, { start_date: '2026-03-01', end_date: '2026-03-03' });
    const [day] = await readTripDays(orm, trip.id);
    const place = await makePlace(orm, trip.id);
    const assignment = await makeDayAssignment(orm, day.id, place.id);
    const note = await makeDayNote(orm, day.id, trip.id);
    const journey = await makeJourney(orm, admin.id);
    const entry = await makeJourneyEntry(orm, journey.id, admin.id);
    const collection = await makeCollection(orm, admin.id);
    const collectionPlace = await makeCollectionPlace(orm, collection.id, admin.id);
    Object.assign(ids, {
      tripId: trip.id,
      trips: trip.id,
      dayId: day.id,
      days: day.id,
      placeId: place.id,
      places: place.id,
      assignments: assignment.id,
      notes: note.id,
      journeyId: journey.id,
      journeys: journey.id,
      entryId: entry.id,
      entries: entry.id,
      collections: collection.id,
      pid: collectionPlace.id,
      userId: other.id,
      users: other.id,
      ownerId: other.id,
      reservations: (await makeReservation(orm, trip.id)).id,
      budget: (await makeBudgetItem(orm, trip.id)).id,
      bags: (await makePackingBag(orm, trip.id)).id,
      packing: (await makePackingItem(orm, trip.id)).id,
      todos: (await makeTodoItem(orm, trip.id)).id,
      'bucket-list': (await makeBucketListItem(orm, admin.id)).id,
      'in-app': (await makeNotification(orm, admin.id)).id,
    });
    ids.collab = (await makeCollabNote(orm, trip.id, admin.id)).id;
  }, 60_000);

  afterAll(async () => {
    uninstallSqlCapture();
    keepAlive.destroy();
    await app?.close();
  });

  /** The id a param names: by its own name, else by the path segment before it, else the trip's. */
  function idFor(path: string, param: string): number {
    if (ids[param] !== undefined) return ids[param];
    const before = path.split(`/:${param}`)[0].split('/').pop() ?? '';
    return ids[before] ?? ids.tripId;
  }

  async function send(route: Route, path: string, body: unknown): Promise<Answer> {
    await app.get(RateLimitService).reset();
    try {
      const pending = request(baseUrl)[route.method](path).agent(keepAlive).set('Cookie', cookie).timeout(10_000);
      const res =
        route.method === 'get' || route.method === 'delete' ? await pending : await pending.send(body as object);
      return { status: res.status, body: JSON.stringify(res.body) };
    } catch (err) {
      return { status: 599, body: `no answer: ${String(err)}` };
    }
  }

  it('ROUTEID-001: no route answers a non-canonical id differently from "abc", and none with a 5xx', async () => {
    // A body the route's DTO accepts, so the Zod pipe's 400 does not answer before the handler reads the path.
    const bodySchemas = routeBodySchemas(app);
    const routes = registeredRoutes();
    const staleExemptions = Object.keys(NOT_ROW_IDS).filter(
      (key) => !routes.some((route) => pathParams(route).some((param) => exempts(key, route, param))),
    );
    const cases = routes.flatMap((route) =>
      pathParams(route)
        .filter((param) => ID_PARAM.test(param) && !exempt(route, param))
        .map((param) => {
          const schema = bodySchemas.get(`${route.method} ${route.path}`);
          return {
            route,
            label: `${route.method.toUpperCase()} ${route.path} :${param}`,
            spellings: malformedIdSpellings(idFor(route.path, param)),
            body: schema ? sampleBody(schema) : undefined,
            fill: (value: string) =>
              route.path.replace(/:([A-Za-z_]+)/g, (_m, name: string) =>
                name === param ? encodeURIComponent(value) : String(idFor(route.path, name)),
              ),
          };
        }),
    );

    // One request at a time: they share one server and one seeded world.
    const failures = (
      await oneByOne(cases, async ({ route, label, spellings, body, fill }) => {
        const unknown = await send(route, fill('abc'), body ?? {});
        const found =
          unknown.status >= 500 ? [`${label}='abc' answered ${unknown.status} ${unknown.body.slice(0, 160)}`] : [];
        const answers = await oneByOne(spellings, (spelling) => send(route, fill(spelling), body ?? {}));
        answers.forEach((got, i) => {
          if (got.status >= 500 || got.status !== unknown.status || got.body !== unknown.body) {
            found.push(
              `${label}='${spellings[i]}' answered ${got.status} ${got.body.slice(0, 160)}, 'abc' ${unknown.status} ${unknown.body.slice(0, 80)}`,
            );
          }
        });
        // The same spellings of an id no row has: none may reach SQL, as a string or as the number it spells.
        await oneByOne(['abc', ...malformedIdSpellings(UNUSED_ID)], async (spelling) => {
          const sent = await recordSql(() => send(route, fill(spelling), body ?? {}));
          const sql = carriedTo(sent, spelling, UNUSED_ID);
          if (sql) found.push(`${label}='${spelling}' reached SQL: ${sql.slice(0, 160)}`);
        });
        return found;
      })
    ).flat();
    const bodied = cases.filter((c) => c.body !== undefined).length;
    const checked = cases.length;

    expect(bodied, 'no route got a body its DTO accepts; routeBodySchemas lost the handlers').toBeGreaterThan(100);
    expect(checked, 'the walk found no route with an id param; the route listing broke').toBeGreaterThan(300);
    expect(staleExemptions, 'a NOT_ROW_IDS entry names a param no route has any more; remove it').toEqual([]);
    expect(
      failures,
      [
        'A route reads a path id some other way than toRowId, so a spelling no client sends reaches SQL (as sent, or as',
        'the number Number() or parseInt() makes of it) or answers unlike an unknown id.',
        "Declare the param with @Param('<name>', rowId('<the route's not-found error>'[, status])) from",
        'src/nest/common/row-id.pipe.ts (ParseRowIdPipe in place of ParseIntPipe), or read it with toRowId/withRowId',
        '(src/db/row-id.ts) in the guard, service or repository that looks the row up, answering what an id that',
        'names no row gets. If the param is not an integer row id, add it to NOT_ROW_IDS above with the reason.',
      ].join(' '),
    ).toEqual([]);
  }, 600_000);

  it('ROUTEID-002: no request schema lets a malformed row id through to the handler', () => {
    // The same schema object is one entry, under its @trek/shared name where it has one.
    const named = new Map<z.ZodType, string>();
    for (const [name, value] of Object.entries(contracts)) {
      if (/(Request|Body|Query)Schema$/.test(name) && isZodSchema(value)) named.set(value, name);
    }
    for (const dto of routeRequestDtos(app)) if (!named.has(dto.schema)) named.set(dto.schema, dto.name);

    const seen = new Set<string>();
    const failures: string[] = [];
    for (const [schema, name] of named) {
      for (const field of rowIdFields(schema)) {
        const key = `${name} ${field.path}`;
        seen.add(key).add(field.name);
        if (NOT_ROW_ID_FIELDS[field.name] || NOT_ROW_ID_FIELDS[key] || READ_BY_HANDLER[key]) continue;
        const accepted = malformedAccepted(field.schema);
        if (accepted.length) failures.push(`${key} accepts ${accepted.map((v) => JSON.stringify(v)).join(', ')}`);
      }
    }
    const stale = [...Object.keys(NOT_ROW_ID_FIELDS), ...Object.keys(READ_BY_HANDLER)].filter((key) => !seen.has(key));

    expect(named.size, 'no request schema found; the contracts import or the DTO walk broke').toBeGreaterThan(300);
    expect(stale, 'an entry names a field no request schema holds any more; remove it').toEqual([]);
    expect(
      failures,
      [
        'A request field named like a row id accepts a spelling toRowId refuses, so the handler receives it and SQL',
        'answers it three ways. In the @trek/shared schema, declare the field rowIdInputSchema (a number or its digits,',
        'kept as sent), rowIdStringSchema (digits only, a multipart field), idParamSchema (read as a number), or',
        'z.number().int() for a list of numbers (src/common/primitives.schema.ts), and read it with toRowId on the',
        'server. If the field does not hold an integer row id, add it to NOT_ROW_ID_FIELDS above with the reason.',
      ].join(' '),
    ).toEqual([]);
  });
});
