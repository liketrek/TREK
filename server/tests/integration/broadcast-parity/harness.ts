import { ADDON_IDS } from '../../../src/addons';
import { buildApp } from '../../../src/bootstrap';
import { BudgetSettlements } from '../../../src/db/entities/BudgetSettlements.entity';
import { CollabPolls } from '../../../src/db/entities/CollabPolls.entity';
import { DayAccommodations } from '../../../src/db/entities/DayAccommodations.entity';
import { PackingTemplateCategories } from '../../../src/db/entities/PackingTemplateCategories.entity';
import { PackingTemplateItems } from '../../../src/db/entities/PackingTemplateItems.entity';
import { PackingTemplates } from '../../../src/db/entities/PackingTemplates.entity';
import { PhotoProviders } from '../../../src/db/entities/PhotoProviders.entity';
import { Reservations } from '../../../src/db/entities/Reservations.entity';
import { RoadtripVias } from '../../../src/db/entities/RoadtripVias.entity';
import { createLocalMcpServer, McpRegistryService } from '../../../src/nest-mcp';
import { AccommodationsService } from '../../../src/nest/accommodations/accommodations.service';
import { withRequestContext } from '../../../src/nest/database/request-context';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { SchoolHolidaysService } from '../../../src/nest/school-holidays/school-holidays.service';
import { authCookie } from '../../helpers/auth';
import { makeBucketListItem } from '../../helpers/factories/atlas';
import { addBudgetItemMember, makeBudgetItem } from '../../helpers/factories/budget';
import { makeCollabMessage, makeCollabNote } from '../../helpers/factories/collab';
import { makeCollection, makeCollectionPlace } from '../../helpers/factories/collections';
import type { FactoryOrm } from '../../helpers/factories/context';
import { makeTripFile } from '../../helpers/factories/files';
import { makeDayAssignment, makeDayNote } from '../../helpers/factories/itinerary';
import { makeJourney, makeJourneyEntry } from '../../helpers/factories/journeys';
import { makeNotification } from '../../helpers/factories/notifications';
import { makePackingBag, makePackingItem } from '../../helpers/factories/packing';
import { makeCategory, makePlace, makeTag } from '../../helpers/factories/places';
import { makeReservation } from '../../helpers/factories/reservations';
import { createRow, findRow, insertRow, updateRows } from '../../helpers/factories/rows';
import { setAddonEnabled, setCollabFeature } from '../../helpers/factories/settings';
import { makeTodoItem } from '../../helpers/factories/todos';
import { makeTour } from '../../helpers/factories/tours';
import { addTripMember, makeTrip, readTripDays } from '../../helpers/factories/trips';
import { makeAdmin, makeUser, type UserRow } from '../../helpers/factories/users';
import { makeVacayPlan } from '../../helpers/factories/vacay';
import { oneByOne } from '../../helpers/one-by-one';
import type { Need, RestCall, Scene } from './types';
import { MikroORM } from '@mikro-orm/core';
import { Client } from '@modelcontextprotocol/sdk/client/index';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory';
import type { INestApplication } from '@nestjs/common';

import request from 'supertest';
import { vi } from 'vitest';

/**
 * The broadcast parity harness: the whole app booted once per test file,
 * every write tool called through a real MCP session, its REST twin through
 * HTTP, and every trip broadcast and user message in between written down.
 *
 * The app is `buildApp()` as production builds it, with no module mocked:
 * under NODE_ENV=test each worker opens its own `:memory:` copy of the
 * migrated snapshot. The two RealtimeService methods are spied on in the
 * container, so what is recorded is exactly what the services hand the
 * transport, in the order they hand it over.
 */

/** The X-Socket-Id every REST call carries: an event REST sends with `emit` leaves it out. */
export const REST_SOCKET = 'sock-rest';

/** One send as the checks read it. Consecutive sends of the same payload to more users are one entry. */
export interface Recorded {
  channel: 'trip' | 'user';
  event: string;
  /** The trip of a room broadcast, the receivers of a user message. */
  to: (number | string)[];
  /** The payload's keys, sorted, without the MCP marker (and without `type` on a user message). */
  keys: string[];
  excludeSid: number | string | undefined;
  /** Set when a room broadcast went only to these users' sockets. */
  onlyUserIds: number[] | undefined;
  /** A transaction was open when it was sent: it would reach the clients before the commit, or after a rollback. */
  inTx: boolean;
  /** The payload as sent, minus `type` on a user message. */
  payload: Record<string, unknown>;
}

/** Writes down every send, folding a fan-out (one payload, one user after the other) into one entry. */
export class BroadcastRecorder {
  private sent: Recorded[] = [];
  private bodies: string[] = [];

  trip(
    tripId: number | string,
    event: string,
    payload: Record<string, unknown>,
    excludeSid: number | string | undefined,
    onlyUserId: number | undefined,
    inTx: boolean,
  ): void {
    const body = JSON.stringify(payload);
    const last = this.sent.at(-1);
    if (
      onlyUserId !== undefined &&
      last?.channel === 'trip' &&
      last.onlyUserIds !== undefined &&
      !last.onlyUserIds.includes(onlyUserId) &&
      this.sameAs(last, event, body, excludeSid, inTx) &&
      last.to[0] === tripId
    ) {
      last.onlyUserIds.push(onlyUserId);
      return;
    }
    this.push(
      {
        channel: 'trip',
        event,
        to: [tripId],
        keys: keysOf(payload),
        excludeSid,
        onlyUserIds: onlyUserId === undefined ? undefined : [onlyUserId],
        inTx,
        payload,
      },
      body,
    );
  }

  user(userId: number, message: Record<string, unknown>, excludeSid: number | string | undefined, inTx: boolean): void {
    const { type, ...payload } = message;
    const event = String(type);
    const body = JSON.stringify(payload);
    const last = this.sent.at(-1);
    if (last?.channel === 'user' && !last.to.includes(userId) && this.sameAs(last, event, body, excludeSid, inTx)) {
      last.to.push(userId);
      return;
    }
    this.push(
      {
        channel: 'user',
        event,
        to: [userId],
        keys: keysOf(payload),
        excludeSid,
        onlyUserIds: undefined,
        inTx,
        payload,
      },
      body,
    );
  }

  /** Everything sent since the last take, and forgets it. */
  take(): Recorded[] {
    const out = this.sent;
    this.sent = [];
    this.bodies = [];
    return out;
  }

  private push(entry: Recorded, body: string): void {
    this.sent.push(entry);
    this.bodies.push(body);
  }

  private sameAs(last: Recorded, event: string, body: string, excludeSid: number | string | undefined, inTx: boolean) {
    return last.event === event && last.excludeSid === excludeSid && last.inTx === inTx && this.bodies.at(-1) === body;
  }
}

function keysOf(payload: Record<string, unknown>): string[] {
  return Object.keys(payload)
    .filter((key) => key !== '_source')
    .sort();
}

type TripSend = [
  tripId: number | string,
  event: string,
  payload: Record<string, unknown>,
  excludeSid?: number | string,
  onlyUserId?: number,
];
type UserSend = [userId: number, message: Record<string, unknown>, excludeSid?: number | string];

/** What a tool call answered, as far as the checks read it. */
export interface ToolOutcome {
  isError: boolean;
  text: string;
}

type ToolCallResult = Awaited<ReturnType<Client['callTool']>>;

function outcomeOf(result: ToolCallResult): ToolOutcome {
  const content: unknown[] = 'content' in result && Array.isArray(result.content) ? result.content : [];
  const text = content
    .map((part) => (part && typeof part === 'object' && 'text' in part ? String(part.text) : ''))
    .join('\n');
  return { isError: result.isError === true, text };
}

/** A tool as `tools/list` shows it to a client. */
export interface ListedTool {
  name: string;
  readOnly: boolean;
}

export interface ParityHarness {
  app: INestApplication;
  orm: FactoryOrm;
  recorder: BroadcastRecorder;
  /** A fresh scene with the rows the case names, and what they need in turn. */
  scene(needs?: readonly Need[]): Promise<Scene>;
  /** Calls one tool as `userId`, over a session holding only that tool. */
  callTool(userId: number, tool: string, args: Record<string, unknown>): Promise<ToolOutcome>;
  /** Every tool a full session of `userId` lists, with its read-only hint. */
  listTools(userId: number): Promise<ListedTool[]>;
  /** The REST twin, as `userId`, with the session cookie and X-Socket-Id 'sock-rest'. */
  rest(userId: number, call: RestCall, s: Scene): Promise<{ status: number; text: string }>;
  close(): Promise<void>;
}

/**
 * Boots the app, switches every addon (and its sub-features) on so no gate
 * hides a tool, and starts recording. One per test file.
 */
export async function openHarness(): Promise<ParityHarness> {
  const app = await buildApp();
  // Keep REST on a bound IPv4 listener. Supertest's implicit IPv6 wildcard
  // can share a port with an unrelated IPv4 fixture on macOS.
  await app.listen(0, '127.0.0.1');
  const orm = app.get(MikroORM);
  await oneByOne(Object.values(ADDON_IDS), (addon) => setAddonEnabled(orm, addon, true));
  await oneByOne(['chat', 'notes', 'polls', 'whatsnext'] as const, (feature) => setCollabFeature(orm, feature, true));
  // The photo search tools show only while a provider is on.
  await updateRows(orm, PhotoProviders, { id: { $in: ['immich', 'synologyphotos'] } }, { enabled: 1 });

  const recorder = new BroadcastRecorder();
  const realtime = app.get(RealtimeService);
  // Read at the moment of the send: the transaction context is the caller's async context.
  const inTx = () => orm.em.isInTransaction();
  vi.spyOn(realtime, 'broadcast').mockImplementation((...args: unknown[]) => {
    const [tripId, event, payload, excludeSid, onlyUserId] = args as TripSend;
    recorder.trip(tripId, event, payload, excludeSid, onlyUserId, inTx());
  });
  vi.spyOn(realtime, 'broadcastToUser').mockImplementation((...args: unknown[]) => {
    const [userId, message, excludeSid] = args as UserSend;
    recorder.user(userId, message, excludeSid, inTx());
  });

  const registry = app.get(McpRegistryService);
  // As AssistantToolsService.open attaches the registry: every call in a request context of its own.
  const around = (_info: { kind: string; name: string }, call: () => unknown): unknown => withRequestContext(orm, call);

  async function session<T>(userId: number, only: string | null, use: (client: Client) => Promise<T>): Promise<T> {
    const server = createLocalMcpServer('TREK broadcast parity');
    await withRequestContext(orm, () =>
      registry.attach(
        server,
        { userId, scopes: null, isStaticToken: false },
        { include: (kind, name) => kind === 'tool' && (only === null || name === only), around },
      ),
    );
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'broadcast-parity', version: '1.0.0' });
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    try {
      return await use(client);
    } finally {
      await client.close();
      await server.close();
    }
  }

  return {
    app,
    orm,
    recorder,
    scene: (needs = []) => buildScene(app, orm, needs),
    callTool: (userId, tool, args) =>
      session(userId, tool, async (client) => outcomeOf(await client.callTool({ name: tool, arguments: args }))),
    listTools: (userId) =>
      session(userId, null, async (client) =>
        (await client.listTools()).tools.map((tool) => ({
          name: tool.name,
          readOnly: tool.annotations?.readOnlyHint === true,
        })),
      ),
    async rest(userId, call, s) {
      const agent = request(app.getHttpServer());
      const path = call.path(s);
      const req =
        call.method === 'post'
          ? agent.post(path)
          : call.method === 'put'
            ? agent.put(path)
            : call.method === 'patch'
              ? agent.patch(path)
              : agent.delete(path);
      req.set('Cookie', authCookie(userId)).set('X-Socket-Id', REST_SOCKET);
      const res = call.body ? await req.send(call.body(s)) : await req;
      return { status: res.status, text: res.text };
    },
    close: async () => {
      vi.restoreAllMocks();
      await app.close();
    },
  };
}

/** The scene keys each need fills; reading one the case did not name throws. */
export const NEED_KEYS: Record<Need, readonly (keyof Scene)[]> = {
  member: ['member'],
  guest: ['guest'],
  place: ['place'],
  place2: ['place2'],
  assignment: ['assignment'],
  dayNote: ['dayNote'],
  stay: ['stay'],
  transport: ['transport'],
  budgetItem: ['budgetItem'],
  settlement: ['settlement'],
  packingItem: ['packingItem'],
  bag: ['bag'],
  template: ['template'],
  todo: ['todo'],
  collabNote: ['collabNote'],
  collabMessage: ['collabMessage'],
  poll: ['poll'],
  file: ['file'],
  collection: ['collection', 'collectionPlace'],
  journey: ['journey', 'journeyEntry'],
  vacay: ['vacay'],
  bucket: ['bucket'],
  tag: ['tag'],
  notification: ['notification'],
  via: ['via'],
  tour: ['tour', 'tourPlace'],
  category: ['category'],
  holidayCountry: ['holidayCountry'],
  holidayRegion: ['holidayRegion'],
};

/** Every need, in the order they are built (a need comes after the ones it reads). */
export const ALL_NEEDS = Object.keys(NEED_KEYS) as Need[];

/** Needs that read another need's rows. */
const NEED_DEPENDS: Partial<Record<Need, Need[]>> = {
  assignment: ['place'],
  budgetItem: ['member'],
  settlement: ['member'],
};

type Building = Partial<Scene> & Pick<Scene, 'n' | 'owner' | 'admin' | 'trip' | 'days'>;

/** A row an earlier need put on the scene. */
function built<K extends keyof Scene>(s: Building, key: K): Scene[K] {
  const value = s[key];
  if (value === undefined) throw new Error(`scene.${key} is read before it was built`);
  return value as Scene[K];
}

type Builder = (s: Building, app: INestApplication, orm: FactoryOrm) => Promise<void>;

const BUILDERS: Record<Need, Builder> = {
  async member(s, _app, orm) {
    s.member = (await makeUser(orm, { username: `Member ${s.n}` })).user;
    await addTripMember(orm, s.trip.id, s.member.id, s.owner.id);
  },
  async guest(s, _app, orm) {
    s.guest = (await makeUser(orm, { username: `Guest ${s.n}`, is_guest: 1 })).user;
    await addTripMember(orm, s.trip.id, s.guest.id, s.owner.id);
  },
  async place(s, _app, orm) {
    s.place = await makePlace(orm, s.trip.id, { name: `Louvre ${s.n}` });
  },
  async place2(s, _app, orm) {
    s.place2 = await makePlace(orm, s.trip.id, { name: `Orsay ${s.n}`, lat: 48.86, lng: 2.3266 });
  },
  async assignment(s, _app, orm) {
    s.assignment = await makeDayAssignment(orm, s.days[0].id, built(s, 'place').id);
  },
  async dayNote(s, _app, orm) {
    s.dayNote = await makeDayNote(orm, s.days[0].id, s.trip.id);
  },
  async stay(s, app, orm) {
    // Through the service's own building block: it writes the night, the partner
    // hotel booking and the check-in stop the way every surface does, and sends nothing.
    const hotel = await makePlace(orm, s.trip.id, { name: `Hotel ${s.n}`, lat: 48.87, lng: 2.33 });
    const [checkIn, checkOut] = [s.days[0].id, s.days[1].id];
    await withRequestContext(orm, () =>
      app
        .get(AccommodationsService)
        .createAccommodation(s.trip.id, { place_id: hotel.id, start_day_id: checkIn, end_day_id: checkOut }),
    );
    const stay = await findRow(orm, DayAccommodations, { trip: s.trip.id, place: hotel.id });
    const booking = await findRow(orm, Reservations, { trip: s.trip.id, type: 'hotel' });
    if (!stay || !booking) throw new Error('the scene stay has no row or no partner booking');
    s.stay = { id: stay.id, placeId: hotel.id, startDayId: checkIn, endDayId: checkOut, reservationId: booking.id };
  },
  async transport(s, _app, orm) {
    s.transport = await makeReservation(orm, s.trip.id, {
      type: 'train',
      title: `Train ${s.n}`,
      day: s.days[0].id,
    });
  },
  async budgetItem(s, _app, orm) {
    s.budgetItem = await makeBudgetItem(orm, s.trip.id, { name: `Dinner ${s.n}`, total_price: 60 });
    await addBudgetItemMember(orm, s.budgetItem.id, s.owner.id);
    await addBudgetItemMember(orm, s.budgetItem.id, built(s, 'member').id);
  },
  async settlement(s, _app, orm) {
    const row = await createRow(orm, BudgetSettlements, {
      trip: s.trip.id,
      fromUser: built(s, 'member').id,
      toUser: s.owner.id,
      amount: 30,
      currency: 'EUR',
      createdByUser: s.owner.id,
    });
    s.settlement = { id: row.id };
  },
  async packingItem(s, _app, orm) {
    s.packingItem = await makePackingItem(orm, s.trip.id, { name: `Socks ${s.n}` });
  },
  async bag(s, _app, orm) {
    s.bag = await makePackingBag(orm, s.trip.id);
  },
  async template(s, _app, orm) {
    const id = await insertRow(orm, PackingTemplates, { name: `Camping ${s.n}`, createdByRef: s.admin.id });
    const category = await insertRow(orm, PackingTemplateCategories, { template: id, name: 'Gear', sort_order: 0 });
    await insertRow(orm, PackingTemplateItems, { category, name: 'Tent', sort_order: 0 });
    s.template = { id };
  },
  async todo(s, _app, orm) {
    s.todo = { id: (await makeTodoItem(orm, s.trip.id, { name: `Book museum ${s.n}` })).id };
  },
  async collabNote(s, _app, orm) {
    s.collabNote = await makeCollabNote(orm, s.trip.id, s.owner.id);
  },
  async collabMessage(s, _app, orm) {
    s.collabMessage = await makeCollabMessage(orm, s.trip.id, s.owner.id);
  },
  async poll(s, _app, orm) {
    const row = await createRow(orm, CollabPolls, {
      trip: s.trip.id,
      user: s.owner.id,
      question: `Dinner on day ${s.n}?`,
      options: JSON.stringify(['Pasta', 'Sushi']),
    });
    s.poll = { id: row.id };
  },
  async file(s, _app, orm) {
    s.file = await makeTripFile(orm, s.trip.id);
  },
  async collection(s, _app, orm) {
    s.collection = await makeCollection(orm, s.owner.id);
    s.collectionPlace = await makeCollectionPlace(orm, s.collection.id, s.owner.id);
  },
  async journey(s, _app, orm) {
    s.journey = await makeJourney(orm, s.owner.id);
    s.journeyEntry = await makeJourneyEntry(orm, s.journey.id, s.owner.id);
  },
  async vacay(s, _app, orm) {
    s.vacay = await makeVacayPlan(orm, s.owner.id);
  },
  async bucket(s, _app, orm) {
    s.bucket = { id: (await makeBucketListItem(orm, s.owner.id, { name: `Kyoto ${s.n}` })).id };
  },
  async tag(s, _app, orm) {
    s.tag = await makeTag(orm, s.owner.id);
  },
  async notification(s, _app, orm) {
    s.notification = await makeNotification(orm, s.owner.id);
  },
  async via(s, _app, orm) {
    const row = await createRow(orm, RoadtripVias, {
      day: s.days[0].id,
      after_order_index: 0,
      lat: 48.85,
      lng: 2.34,
    });
    s.via = { id: row.id };
  },
  async tour(s, _app, orm) {
    s.tourPlace = await makePlace(orm, s.trip.id, { name: `Hike ${s.n}`, lat: 47.42, lng: 10.98 });
    s.tour = await makeTour(orm, s.tourPlace.id);
  },
  async category(s, _app, orm) {
    s.category = await makeCategory(orm, { name: `Street food ${s.n}` });
  },
  // The catalog through its service, as the admin's form writes it; nothing is sent.
  async holidayCountry(s, app, orm) {
    const country = { code: holidayCode(s.n, 0), name: `Holiday land ${s.n}` };
    await withRequestContext(orm, () => app.get(SchoolHolidaysService).createCountry(country));
    s.holidayCountry = country;
  },
  async holidayRegion(s, app, orm) {
    const code = holidayCode(s.n, 1);
    const holidays = app.get(SchoolHolidaysService);
    const region = await withRequestContext(orm, async () => {
      await holidays.createCountry({ code, name: `Region land ${s.n}` });
      return holidays.createRegion(code, {
        name: `District ${s.n}`,
        revision: 0,
        holidays: [{ name: 'Summer', startDate: '2027-07-01', endDate: '2027-08-15' }],
      });
    });
    s.holidayRegion = { id: Number(region.id), revision: region.revision };
  },
};

/**
 * A two-letter country code of the manual school holiday catalog that no
 * other scene uses: two per scene, the first for its empty country (or for a
 * case creating one), the second for the country of its region.
 */
export function holidayCode(n: number, which: 0 | 1): string {
  const index = 2 * n + which;
  return String.fromCharCode(65 + (Math.floor(index / 26) % 26), 65 + (index % 26));
}

/**
 * The users a scene built, by id, under the names a case reads them by, so
 * the receivers of a send compare across the two scenes of a case. A user the
 * case did not ask for is left out without reading it.
 */
export function sceneUsers(s: Scene): Map<number, string> {
  const users = new Map<number, string>();
  for (const key of ['owner', 'admin', 'member', 'guest'] as const) {
    const built = Object.getOwnPropertyDescriptor(s, key);
    if (built && 'value' in built) users.set((built.value as UserRow).id, key);
  }
  return users;
}

/** The needs together with every need they read, in build order. */
function withDependencies(needs: readonly Need[]): Set<Need> {
  const out = new Set<Need>();
  const add = (need: Need) => {
    for (const dependency of NEED_DEPENDS[need] ?? []) add(dependency);
    out.add(need);
  };
  for (const need of needs) add(need);
  return out;
}

let scenes = 0;

async function buildScene(app: INestApplication, orm: FactoryOrm, needs: readonly Need[]): Promise<Scene> {
  const n = ++scenes;
  const owner = (await makeUser(orm, { username: `Owner ${n}` })).user;
  const admin = (await makeAdmin(orm, { username: `Admin ${n}` })).user;
  const trip = await makeTrip(orm, owner.id, {
    title: `Parity trip ${n}`,
    start_date: '2027-05-03',
    end_date: '2027-05-05',
  });
  const [day1, day2, day3] = await readTripDays(orm, trip.id);
  if (!day1 || !day2 || !day3) throw new Error('the scene trip did not get its three days');
  const s: Building = { n, owner, admin, trip, days: [day1, day2, day3] };
  const wanted = withDependencies(needs);
  // One after the other, in ALL_NEEDS order: a need reads the rows of the ones before it.
  await oneByOne(
    ALL_NEEDS.filter((need) => wanted.has(need)),
    (need) => BUILDERS[need](s, app, orm),
  );
  for (const need of ALL_NEEDS) {
    if (wanted.has(need)) continue;
    for (const key of NEED_KEYS[need]) {
      Object.defineProperty(s, key, {
        get() {
          throw new Error(`scene.${key} is not built: add '${need}' to the case's needs`);
        },
      });
    }
  }
  return s as Scene;
}
