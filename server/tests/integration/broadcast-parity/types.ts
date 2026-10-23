import type { BudgetItemRow } from '../../helpers/factories/budget';
import type { CollabMessageRow, CollabNoteRow } from '../../helpers/factories/collab';
import type { CollectionPlaceRow, CollectionRow } from '../../helpers/factories/collections';
import type { TripFileRow } from '../../helpers/factories/files';
import type { DayAssignmentRow, DayNoteRow } from '../../helpers/factories/itinerary';
import type { JourneyEntryRow, JourneyRow } from '../../helpers/factories/journeys';
import type { NotificationRow } from '../../helpers/factories/notifications';
import type { PackingBagRow, PackingItemRow } from '../../helpers/factories/packing';
import type { CategoryRow, PlaceRow, TagRow } from '../../helpers/factories/places';
import type { ReservationRow } from '../../helpers/factories/reservations';
import type { TourRow } from '../../helpers/factories/tours';
import type { DayRow, TripRow } from '../../helpers/factories/trips';
import type { UserRow } from '../../helpers/factories/users';
import type { VacayPlanRow } from '../../helpers/factories/vacay';
import type { INestApplication } from '@nestjs/common';
import type { TrekWsTripEventName, TrekWsUserEventName } from '@trek/shared';

/**
 * The rows a case asks its scene for, beyond the owner, the admin and a trip
 * with three dated days, which every scene has. A row a case reads without
 * naming it here throws, so a case cannot lean on a row by accident.
 */
export type Need =
  | 'place'
  | 'place2'
  | 'assignment'
  | 'dayNote'
  | 'stay'
  | 'transport'
  | 'budgetItem'
  | 'settlement'
  | 'packingItem'
  | 'bag'
  | 'template'
  | 'todo'
  | 'collabNote'
  | 'collabMessage'
  | 'poll'
  | 'file'
  | 'guest'
  | 'member'
  | 'collection'
  | 'journey'
  | 'vacay'
  | 'bucket'
  | 'tag'
  | 'notification'
  | 'via'
  | 'tour'
  | 'category'
  | 'holidayCountry'
  | 'holidayRegion';

/** A stay as the accommodation service writes it: the night, its partner hotel booking and the place it is at. */
export interface StayRow {
  id: number;
  placeId: number;
  startDayId: number;
  endDayId: number;
  reservationId: number;
}

/** A row without a factory of its own: the scene keeps its id. */
export interface IdRow {
  id: number;
}

/**
 * One case's world, built twice (once for REST, once for MCP) so a write on
 * one surface never sees what the other already changed. Every name carries
 * the scene's number, since usernames are unique across the file.
 */
export interface Scene {
  n: number;
  /** Who makes the write on both surfaces, unless the case names the admin. */
  owner: UserRow;
  admin: UserRow;
  trip: TripRow;
  /** Three days with dates (2027-05-03 to 05), in day order. */
  days: [DayRow, DayRow, DayRow];
  place: PlaceRow;
  place2: PlaceRow;
  /** `place` on the first day. */
  assignment: DayAssignmentRow;
  dayNote: DayNoteRow;
  /** From the first to the second day, at a place of its own. */
  stay: StayRow;
  /** A train on the first day. */
  transport: ReservationRow;
  /** Split between the owner and `member`. */
  budgetItem: BudgetItemRow;
  /** `member` paid the owner back. */
  settlement: IdRow;
  packingItem: PackingItemRow;
  bag: PackingBagRow;
  /** A global packing template with one category and one item, made by the admin. */
  template: IdRow;
  todo: IdRow;
  collabNote: CollabNoteRow;
  collabMessage: CollabMessageRow;
  /** Two options, open. */
  poll: IdRow;
  file: TripFileRow;
  /** A guest (no account) on the trip. */
  guest: UserRow;
  /** A second traveller with an account. */
  member: UserRow;
  /** The owner's collection with one saved place. */
  collection: CollectionRow;
  collectionPlace: CollectionPlaceRow;
  /** The owner's journey with one entry. */
  journey: JourneyRow;
  journeyEntry: JourneyEntryRow;
  vacay: VacayPlanRow;
  bucket: IdRow;
  tag: TagRow;
  /** An unread notification for the owner. */
  notification: NotificationRow;
  /** A route via on the first day. */
  via: IdRow;
  /** A hike on a place of its own. */
  tour: TourRow;
  tourPlace: PlaceRow;
  /** A place category of the admin's global catalog, on no place. */
  category: CategoryRow;
  /** A country of the admin's manual school holiday catalog, without regions. */
  holidayCountry: { code: string; name: string };
  /** A region with one holiday period, in a country of its own. */
  holidayRegion: { id: number; revision: number };
}

/**
 * Which users of the trip room a send is limited to (`onlyUserIds`):
 * `actor` the writer alone, `viewers` the users who may see the row (a
 * restricted packing item), the writer among them.
 */
export type Receivers = 'actor' | 'viewers';

/**
 * One event a write sends, in the order it sends them.
 *
 * - a trip event name: to the whole trip room; REST leaves out the socket
 *   that made the request (`emit`).
 * - `{ event, all: true }`: to the trip room, the requesting socket included
 *   on REST too (`emitAll`, the day-plan side of a write).
 * - `{ event, only }`: to some users of the trip room only. A surface that
 *   limits it differently on purpose names both, `{ rest, mcp }`, and the
 *   case says why in its note.
 * - `{ event, user }`: to users' own sockets (`broadcastToUser`). `actor` means
 *   the writer is among the receivers (REST leaves out the requesting socket
 *   unless `all` is set too), `others` that only other users receive it.
 */
export type Expect =
  | TrekWsTripEventName
  | { event: TrekWsTripEventName; all?: true; only?: Receivers | { rest: Receivers; mcp: Receivers } }
  | { event: TrekWsUserEventName; user: 'actor' | 'others'; all?: true };

/** The REST twin of a tool, called as the same user with X-Socket-Id 'sock-rest'. */
export interface RestCall {
  method: 'post' | 'put' | 'patch' | 'delete';
  path: (s: Scene) => string;
  body?: (s: Scene) => object;
}

/** What a case and an exemption both say about the call: the rows, the caller and the arguments. */
export interface ToolCall {
  tool: string;
  needs?: Need[];
  /** Who calls; the owner unless the tool is an admin's. */
  actor?: 'owner' | 'admin';
  /** The tool's arguments, pointing at rows of the scene. A wrong field fails in the SDK's validation. */
  args: (s: Scene) => Record<string, unknown>;
  /** More rows than the needs give, per scene, before the write. */
  setup?: (s: Scene, app: INestApplication) => Promise<void>;
}

export interface ParityCase extends ToolCall {
  /** The REST route doing the same write. A case has this or `twin`. */
  rest?: RestCall;
  /** For a tool without one REST route: the nearest twin, in words, and no REST run. */
  twin?: string;
  /** Every event the write sends, in order and with repeats. Never empty: a silent tool is an exemption. */
  expect: Expect[];
  /**
   * Replaces a network call with `vi.spyOn` on the provider's service, never
   * `vi.mock`. Return the restore, called once the case is done.
   */
  stub?: (app: INestApplication) => (() => void) | void;
  /** The trip room the events go to, when it is not the scene's trip (a copy, a new trip). */
  room?: (s: Scene) => number;
  /** Events a write sends after it answered: read them one macrotask later. */
  settle?: boolean;
  /** A deliberate difference between the surfaces, and why. */
  note?: string;
}

/**
 * A write tool that sends nothing, on purpose. It runs like a case, over MCP,
 * and must answer without an error and send nothing at all, so the reason is
 * checked rather than only claimed.
 */
export interface ExemptTool extends ToolCall {
  /** Why the tool sends nothing to anyone, at least 20 characters. */
  reason: string;
  /** Another exempt tool run first as the same caller, for a link or feed to rotate or revoke. */
  first?: { tool: string; args: (s: Scene) => Record<string, unknown> };
}

export interface CaseGroup {
  name: string;
  /** The test id prefix of the group's cases, `<prefix>-001` and on. */
  prefix: string;
  cases: ParityCase[];
  exempt: ExemptTool[];
  /**
   * Write tools without a case yet. Only for the build-up: the group's package
   * empties it, and no tool may join it (PENDING_CEILING in pending-ceiling.ts).
   */
  pending?: string[];
}
