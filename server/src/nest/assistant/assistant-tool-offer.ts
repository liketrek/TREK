import type { McpRegistryListing } from '../../nest-mcp';
import type { AiToolSpec } from '../ai-connections/ai-chat-client.interface';
import { PINNED_ARG } from './assistant-tools.constants';
import { PACKAGE_HELD_READS, PACKAGE_TOOL_CONTROLLERS } from './cards/registry';

/**
 * Which of TREK's MCP tools the assistant is offered, and how. Every tool the
 * registry holds is offered, except the few below that no approval makes
 * safe; the scopes in ASSISTANT_SCOPES hide the rest of what must never run
 * (deleting a trip, share and invite links, file contents, plugins). A tool
 * annotated read-only runs at once, every other one waits as a change card.
 *
 * Offering all of them in every step would cost a lot of tokens and runs past
 * what some providers take in one request, so a turn starts with the core of
 * a trip (days, places, bookings, packing, to-dos, budget, weather, search)
 * and the model loads an addon's tools when it needs them (USE_TOOLS_TOOL).
 */

/**
 * The Studio book tools belong to the Studio's own chat, the journey scope
 * (isOfferedInJourney below): a trip chat has no page to show a change on and
 * an applied write would reload an open Studio from its cover. External MCP
 * clients keep them; a trip conversation of the assistant never sees them.
 */
const STUDIO_ONLY_TOOLS: Readonly<Record<string, string>> = Object.fromEntries(
  [
    'get_book',
    'describe_book_page',
    'list_book_layouts',
    'list_book_assets',
    'create_book',
    'add_book_pages',
    'move_book_page',
    'delete_book_pages',
    'edit_book_page',
    'set_book_cover',
    'suggest_book_photos',
    'set_book_setup',
    'set_book_theme',
    'duplicate_book_page',
    'save_book_layout',
    'remove_book_layout',
    'design_book',
    'get_book_design',
    'revise_book_design',
    'apply_book_design',
  ].map((name) => [name, 'a Studio book tool: offered in the Studio chat only, never in a trip chat']),
);

/** Never offered, whatever the user approves, each for the reason beside it. */
export const ASSISTANT_DENIED_TOOLS: Readonly<Record<string, string>> = {
  delete_trip: 'irreversible, and it takes the conversation with it',
  copy_trip: 'makes a trip outside the conversation',
  create_trip: 'makes a trip outside the conversation',
  leave_trip: 'changes who can see the trip',
  add_trip_member: 'changes who can see the trip',
  remove_trip_member: 'changes who can see the trip',
  leave_collection: 'changes who can see the collection',
  set_collection_member_role: 'changes who can see the collection',
  remove_collection_member: 'changes who can see the collection',
  add_journey_contributor: 'changes who can see the journey',
  update_journey_contributor_role: 'changes who can see the journey',
  remove_journey_contributor: 'changes who can see the journey',
  invite_to_collection: 'invites a person; the model could pick whom',
  send_vacay_invite: 'invites a person; the model could pick whom',
  share_vacay_calendar: 'shares a calendar with a person',
  create_share_link: 'mints a public link, whose token would reach the AI provider',
  get_share_link: 'reads a public link token',
  delete_share_link: 'belongs with the share links above',
  get_trip_invite_link: 'reads an invite token',
  create_trip_invite_link: 'mints an invite token',
  delete_trip_invite_link: 'belongs with the invite links above',
  get_journey_share_link: 'reads a public link token',
  create_journey_share_link: 'mints a public link token',
  delete_journey_share_link: 'belongs with the share links above',
  get_trip_calendar_feed: 'reads a calendar feed token',
  enable_trip_calendar_feed: 'mints a calendar feed token',
  rotate_trip_calendar_feed: 'mints a calendar feed token',
  disable_trip_calendar_feed: 'belongs with the feeds above',
  get_all_trips_calendar_feed: 'reads a calendar feed token',
  enable_all_trips_calendar_feed: 'mints a calendar feed token',
  rotate_all_trips_calendar_feed: 'mints a calendar feed token',
  disable_all_trips_calendar_feed: 'belongs with the feeds above',
  import_places_from_url: 'fetches an address the model chooses',
  read_trip_file: 'would send documents such as passports to the AI provider',
  upload_trip_file: 'writes a file the model made up',
  create_category: 'changes the categories of every user',
  update_category: 'changes the categories of every user',
  delete_category: 'changes the categories of every user',
  create_manual_school_holiday_country: 'changes the holidays of every user',
  create_manual_school_holiday_region: 'changes the holidays of every user',
  update_manual_school_holiday_region: 'changes the holidays of every user',
  delete_manual_school_holiday_region: 'changes the holidays of every user',
  delete_manual_school_holiday_country: 'changes the holidays of every user',
  ...STUDIO_ONLY_TOOLS,
  restore_book_page: 'an undo target only: it puts a book page back as an earlier change left it',
  restore_book_layout: 'an undo target only: it puts back a layout an earlier change took away',
  restore_book_revision: 'an undo target only: it puts the book back as an applied design found it',
};

/**
 * Names that read like sharing but only list or take back what the user
 * shared already. Any other name that shares, invites or publishes a feed
 * must be denied above; the boot check holds the two apart.
 */
const SHARE_LIKE_SAFE: ReadonlySet<string> = new Set([
  'set_packing_item_sharing',
  'list_vacay_shares',
  'get_shareable_vacay_users',
  'get_shared_vacay_calendars',
  'unshare_vacay_calendar',
  'cancel_vacay_invite',
  'accept_vacay_invite',
  'decline_vacay_invite',
  'cancel_collection_invite',
  'accept_collection_invite',
  'decline_collection_invite',
]);
const SHARE_LIKE = /share|invite|feed/;

/**
 * Read-only tools that still wait for the user: they fetch an address that
 * came from the web or a message. The packages add theirs in their cards.
 */
export const HELD_READS: ReadonlySet<string> = new Set([
  'resolve_maps_url',
  'preview_google_maps_route',
  'preview_google_maps_walk',
  ...PACKAGE_HELD_READS,
]);

export function isOfferedTool(name: string): boolean {
  return !(name in ASSISTANT_DENIED_TOOLS);
}

/** The argument a Studio conversation pins on every tool that takes it, as a trip conversation pins `tripId`. */
export const JOURNEY_PINNED_ARG = 'journeyId';

/** The controllers of the book itself: their reads, and their writes for someone who may change the book. */
const STUDIO_CONTROLLERS: ReadonlySet<string> = new Set([
  'JourneyBookMcp',
  'JourneyBookPhotosMcp',
  'JourneyBookDesignMcp',
]);

/** The controllers whose reads a Studio conversation also gets: the journey, its map and its tracks. */
const JOURNEY_READ_CONTROLLERS: ReadonlySet<string> = new Set(['JourneyMcp', 'JourneyMapMcp', 'JourneyTracksMcp']);

/**
 * Whether a registered tool is one of the book's own. A trip conversation
 * leaves these out by their controller as well as by name, so a book tool
 * added later never reaches a trip chat through the journey group.
 */
export function isStudioController(className: string | undefined): boolean {
  return className !== undefined && STUDIO_CONTROLLERS.has(className);
}

/**
 * What is wrong with the book tools against the registry: one that is not
 * listed above as a Studio tool (or as the undo target), so the denylist and
 * the Studio's offer no longer tell the same story.
 */
export function checkStudioTools(listing: Iterable<Pick<McpRegistryListing, 'kind' | 'name' | 'className'>>): string[] {
  const problems: string[] = [];
  for (const entry of listing) {
    if (entry.kind === 'tool' && isStudioController(entry.className) && !(entry.name in ASSISTANT_DENIED_TOOLS)) {
      problems.push(`book tool "${entry.name}" is not listed as a Studio tool`);
    }
  }
  return problems;
}

/**
 * Whether a Studio conversation attaches a registered tool: one of the book's
 * or the journey's, and none the denylist keeps from the assistant, the book
 * tools a trip chat goes without excepted (`restore_book_page` stays out: it
 * is an undo target only).
 */
export function isOfferedInJourney(name: string, className: string | undefined): boolean {
  if (name in ASSISTANT_DENIED_TOOLS && !(name in STUDIO_ONLY_TOOLS)) return false;
  return isStudioController(className) || (className !== undefined && JOURNEY_READ_CONTROLLERS.has(className));
}

/**
 * The controllers whose reads work only for someone who may change the book:
 * a design draft is its editor's, so a viewer's design_book, revise_book_design
 * and get_book_design could only refuse.
 */
const EDITOR_READ_CONTROLLERS: ReadonlySet<string> = new Set(['JourneyBookDesignMcp']);

/**
 * Whether a Studio conversation keeps an attached tool once its schema and
 * annotations are known. Only tools that work on the conversation's journey
 * (they take the `journeyId` the server pins) stay, so the conversation never
 * reaches another journey; of those every read but the design draft's, which,
 * like the book's writes, go only to someone who may change the book. The
 * journey's own writes (entries, photos, its trips) stay with the journey page.
 */
export function keptInJourney(
  className: string | undefined,
  kind: 'read' | 'write',
  pinned: boolean,
  canWrite: boolean,
): boolean {
  if (!pinned) return false;
  if (kind === 'read') return canWrite || className === undefined || !EDITOR_READ_CONTROLLERS.has(className);
  return canWrite && isStudioController(className);
}

/**
 * The arguments that name a trip or a journey, as the tools spell them: the
 * collections' copy takes `trip_id`, a new journey its `trip_ids`, a Dawarich
 * stay taken into a journal its `journalId`.
 */
const TRIP_OR_JOURNEY_ARGS: ReadonlySet<string> = new Set([
  PINNED_ARG,
  JOURNEY_PINNED_ARG,
  'trip_id',
  'trip_ids',
  'journey_id',
  'journalId',
]);

/**
 * The controllers of a journey's own content, whose every write works on one
 * journey, also when it names only a part of it (an entry by its `entryId`).
 */
const JOURNEY_WRITE_CONTROLLERS: ReadonlySet<string> = new Set([
  'JourneyMcp',
  'JourneyMapMcp',
  'JourneyTracksMcp',
  'JourneyRecordingsMcp',
  'JourneyDayImportMcp',
  'TripJournalLinkMcp',
]);

/**
 * Whether the home chat (no one trip, no one journey) keeps an attached tool
 * once its schema and annotations are known: every read, a trip's or a
 * journey's too, on the id the model names (the tool itself checks that the
 * user may read it, as for any MCP client); and the writes that take neither
 * a trip nor a journey (the atlas, the vacation planner, collections, the
 * tour library, the settings). A trip's own changes belong in that trip's
 * chat, which the home chat offers instead (open_trip_chat); a journey's stay
 * with the journey page, as they do for the Studio's chat.
 */
export function keptAtHome(
  kind: 'read' | 'write',
  schemaArgs: Iterable<string>,
  className: string | undefined,
): boolean {
  if (kind === 'read') return true;
  if (className !== undefined && JOURNEY_WRITE_CONTROLLERS.has(className)) return false;
  for (const arg of schemaArgs) if (TRIP_OR_JOURNEY_ARGS.has(arg)) return false;
  return true;
}

/** What is wrong with the denylist against the registry: a sharing tool that slipped through. */
export function checkDenylist(names: Iterable<string>): string[] {
  const problems: string[] = [];
  for (const name of names) {
    if (SHARE_LIKE.test(name) && isOfferedTool(name) && !SHARE_LIKE_SAFE.has(name)) {
      problems.push(`"${name}" shares, invites or publishes; deny it or list it as safe`);
    }
  }
  return problems;
}

type ToolGroups = Readonly<Record<string, { about: string; controllers: readonly string[] }>>;

/**
 * The tool groups a turn can load, by the MCP controller that registers the
 * tools, each with the words the model reads to pick it. A controller not
 * listed here, nor added by a package (`toolControllers` in its cards),
 * belongs to the core, which every step offers.
 */
const CORE_TOOL_GROUPS: ToolGroups = {
  tours: {
    about:
      'Tours: hikes (also over several days in stages), city walks, bike tours (road, gravel, mountain bike), ' +
      'runs (road and trail), rides, paddling and ski and winter tours; plan and save every one of them, change ' +
      'and export them (hikes with their heights and SAC grades), round hikes of a wished length and other ' +
      'ways for one leg, search along a tour, check off a city walk under way, the recorded tracks and tour ' +
      'stats, their packing, tours in collections, the tour library, wanderer trails and imports from GPX ' +
      'files and Google Maps walks.',
    controllers: [
      'ToursMcp',
      'CityWalkMcp',
      'HikePlanMcp',
      'TourPlanMcp',
      'TourChangeMcp',
      'TourChangeUndoMcp',
      'TourLibraryMcp',
      'TourPackingMcp',
      'TourActivitiesMcp',
      'TourActivityStatsMcp',
      'TourWalkImportMcp',
      'TourStopsMcp',
      'CollectionToursMcp',
      'PaddleRoutingMcp',
      'SkiRoutingMcp',
      'HikeWaysMcp',
      'ToursWandererMcp',
    ],
  },
  roadtrip: {
    about:
      'Road trips and transit: the driving route and its stops, where each day ends, charging, hazards, ' +
      'public transport journeys and driving routes imported from Google Maps.',
    controllers: [
      'RoadtripMcp',
      'RoadtripPlanningMcp',
      'RoadtripPreferencesMcp',
      'RoadtripHazardsMcp',
      'ChargingMcp',
      'TransitMcp',
    ],
  },
  journey: {
    about:
      'Journeys (the travel journal): entries, photos, the journal linked to this trip, its map and GPX tracks, ' +
      'location history and the recorded days.',
    controllers: [
      'JourneyMcp',
      'JourneyMapMcp',
      'JourneyTracksMcp',
      'JourneyBookMcp',
      'JourneyBookPhotosMcp',
      'JourneyRecordingsMcp',
      'JourneyDayImportMcp',
      'TripJournalLinkMcp',
      'MemoriesMcp',
      'DawarichMcp',
    ],
  },
  vacay: {
    about: 'Vacation planner: vacation days per year, public and school holidays, shared calendars.',
    controllers: ['VacayMcp', 'SchoolHolidaysMcp'],
  },
  atlas: {
    about: 'Atlas: visited countries and regions, the bucket list, and both checked against the Dawarich recordings.',
    controllers: ['AtlasMcp', 'DawarichAtlasMcp'],
  },
  collections: {
    about: 'Collections: saved places across trips, their labels and ratings.',
    controllers: ['CollectionsMcp'],
  },
  collab: { about: 'Trip chat: notes, polls and messages to the people on the trip.', controllers: ['CollabMcp'] },
  files: {
    about: 'Files and imports: the trip files, document sync, flights from AirTrail.',
    controllers: ['FilesMcp', 'DocSyncMcp', 'ReservationImportMcp', 'AirtrailMcp'],
  },
  account: {
    about: 'The user: notifications and display settings.',
    controllers: ['NotificationsMcp', 'SettingsMcp'],
  },
  plugins: {
    about: 'Places and points of interest from installed plugins.',
    controllers: ['PluginPoisMcp', 'PluginSearchMcp'],
  },
};

/**
 * The groups with the controllers the packages added to them. A package that
 * names a group this file does not know, or a controller a group lists
 * already, stops the server at load.
 */
export function withPackageControllers(
  core: ToolGroups,
  added: Readonly<Record<string, readonly string[]>>,
): ToolGroups {
  const groups = Object.fromEntries(Object.entries(core).map(([group, value]) => [group, { ...value }]));
  const listed = new Set(Object.values(core).flatMap((group) => group.controllers));
  for (const [group, controllers] of Object.entries(added)) {
    const known = groups[group];
    if (!known) throw new Error(`Assistant tool groups: no group "${group}" for ${controllers.join(', ')}`);
    const twice = controllers.find((controller) => listed.has(controller));
    if (twice) throw new Error(`Assistant tool groups: controller "${twice}" is listed already`);
    known.controllers = [...known.controllers, ...controllers];
  }
  return groups;
}

export const ASSISTANT_TOOL_GROUPS = withPackageControllers(CORE_TOOL_GROUPS, PACKAGE_TOOL_CONTROLLERS);

const GROUP_OF_CONTROLLER = new Map(
  Object.entries(ASSISTANT_TOOL_GROUPS).flatMap(([group, { controllers }]) =>
    controllers.map((controller) => [controller, group] as const),
  ),
);

/** The group a registered tool loads with; null for the core. */
export function groupOf(entry: Pick<McpRegistryListing, 'className'>): string | null {
  return GROUP_OF_CONTROLLER.get(entry.className) ?? null;
}

/** The server's own step that loads a group's tools for the rest of the turn. */
export const USE_TOOLS_TOOL = 'use_addon_tools';

/** The step's description: the groups, and what needs nothing loaded in this kind of conversation. */
function useToolsDescription(core: string): string {
  return (
    'Load the tools of more parts of TREK for the rest of this turn. Call it before working with any of: ' +
    Object.entries(ASSISTANT_TOOL_GROUPS)
      .map(([group, { about }]) => `"${group}" (${about})`)
      .join('; ') +
    `. ${core}`
  );
}

const USE_TOOLS_PARAMETERS: AiToolSpec['parameters'] = {
  type: 'object',
  properties: {
    groups: {
      type: 'array',
      items: { type: 'string', enum: Object.keys(ASSISTANT_TOOL_GROUPS) },
      minItems: 1,
    },
  },
  required: ['groups'],
  additionalProperties: false,
};

/** The same step in the home chat, where the core reads trips by the id the model passes. */
export const HOME_USE_TOOLS_SPEC: AiToolSpec = {
  name: USE_TOOLS_TOOL,
  description: useToolsDescription(
    'Reading the trips (list_trips, and a trip by its id: days, places, bookings, packing, to-dos, budget, weather) ' +
      'needs nothing loaded.',
  ),
  parameters: USE_TOOLS_PARAMETERS,
};

export const USE_TOOLS_SPEC: AiToolSpec = {
  name: USE_TOOLS_TOOL,
  description: useToolsDescription(
    'The trip itself (days, places, bookings, packing, to-dos, budget, weather, search) needs nothing loaded.',
  ),
  parameters: {
    type: 'object',
    properties: {
      groups: {
        type: 'array',
        items: { type: 'string', enum: Object.keys(ASSISTANT_TOOL_GROUPS) },
        minItems: 1,
      },
    },
    required: ['groups'],
    additionalProperties: false,
  },
};
