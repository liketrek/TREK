import { ADDON_IDS, type AddonId } from '../../addons';
import { canRead, type ScopeGroup } from '../../mcp/scopes';

/**
 * The `instructions` a session's initialize answers with, built for that
 * session: the data model and the add-on list name only what this session
 * can reach (an add-on switched on and a scope granted), so a client holding
 * the core scopes is not told about tours it cannot call, and a host that
 * renders MCP Apps is told the views are companions to the answer.
 */
export interface InstructionsContext {
  /** The add-ons switched on for this instance. */
  addons: ReadonlySet<string>;
  /** The token's scopes; null is full access (a web session or a static token). */
  scopes: readonly string[] | null;
  /** The client announced the MCP Apps extension, so some read tools come with an interactive view. */
  hostSupportsApps: boolean;
}

/** One optional part of TREK: what the data model says about it, and its line in the add-on list. */
interface Feature {
  addon?: AddonId;
  group: ScopeGroup;
  model: string;
  feature?: string;
}

const FEATURES: readonly Feature[] = [
  {
    addon: ADDON_IDS.BUDGET,
    group: 'budget',
    model: '**Budget item** — an expense entry for a trip (amount, category, payer, split between members).',
    feature: '**Budget** — expense tracking and per-person settlement.',
  },
  {
    addon: ADDON_IDS.PACKING,
    group: 'packing',
    model: '**Packing item** — a checklist entry grouped into bags and categories.',
    feature: '**Packing** — checklist with bags, categories, and templates.',
  },
  {
    addon: ADDON_IDS.PACKING,
    group: 'todos',
    model: '**Todo** — a task (not packing-specific) attached to a trip, ordered and togglable.',
  },
  {
    addon: ADDON_IDS.COLLAB,
    group: 'collab',
    model: '**Collab note / poll / message** — shared notes, decision polls, and chat messages for group trips.',
    feature: '**Collab** — shared notes, polls, and chat messages for group trips.',
  },
  {
    addon: ADDON_IDS.TOURS,
    group: 'tours',
    model: '**Tour** — a hike, city walk, ride, run, paddle or ski tour on a trip, with its route, stops and packing.',
    feature: '**Tours** — propose, plan and save tours; read a saved one with `get_tour_plan`.',
  },
  {
    addon: ADDON_IDS.ROADTRIP,
    group: 'roadtrip',
    model: '**Road trip** — the driving days of a trip: routes, via points, charging stops, driving preferences.',
    feature: '**Road trip** — routes between the stops of a day, recalculated with `calculate_roadtrip`.',
  },
  {
    addon: ADDON_IDS.COLLECTIONS,
    group: 'collections',
    model: '**Collection** — a saved list of places kept across trips, shareable with other users.',
    feature: '**Collections** — saved places across trips.',
  },
  {
    addon: ADDON_IDS.ATLAS,
    group: 'atlas',
    model: '**Atlas** — global travel journal: bucket list, visited countries and regions.',
    feature: '**Atlas** — bucket list and visited-country/region tracking.',
  },
  {
    addon: ADDON_IDS.VACAY,
    group: 'vacay',
    model: '**Vacay** — vacation-day planner that tracks leave across team members and years.',
    feature: '**Vacay** — team vacation-day planner with public holiday integration.',
  },
  {
    addon: ADDON_IDS.JOURNEY,
    group: 'journey',
    model: '**Journey** — cross-trip travel narrative with dated entries, contributors, and share links.',
    feature: '**Journey** — cross-trip travel narrative with entries, contributors, and share links.',
  },
  {
    addon: ADDON_IDS.JOURNEY,
    group: 'studio',
    model: "**Book** — a journey's photo book, laid out page by page in the Studio.",
  },
  {
    group: 'files',
    model: '**File** — a document on a trip (a booking PDF, a ticket), linked to bookings and places.',
  },
];

const CORE_MODEL = [
  '**Trip** — top-level container. Has dates, currency, members (owner + collaborators), and optional add-ons.',
  '**Day** — one calendar day within a trip (YYYY-MM-DD). Days are generated automatically when a trip is created with start/end dates.',
  "**Place** — a point of interest (POI) stored in the trip's place pool. A place is NOT on the itinerary until it is assigned to a day.",
  '**Assignment** — links a Place to a Day (ordered, with optional start/end time). This is what builds the daily itinerary.',
  '**Accommodation** — a hotel or rental linked to a Place and a check-in/check-out day range.',
  '**Reservation** — a booking record (flight, train, restaurant, etc.) with confirmation details, linked to a day.',
  '**Day note** — a free-text annotation attached to a day (with optional time label and emoji icon).',
  '**Tag** — a label that can be applied to places for filtering.',
];

const WORKFLOWS = `## Key workflows

**Discovering trips:** Always call \`list_trips\` first when no trip ID has been provided. Never assume a trip ID.

**Loading trip context:** Before planning or modifying a trip, call \`get_trip_summary\` once. It returns all days (with assignments and notes), accommodations, budget, packing, reservations, collab notes, and todos in a single round-trip. Use this data to answer follow-up questions without extra tool calls.

**Adding a place to the itinerary (correct order):**
1. \`search_place\` — find the real-world POI; note the \`osm_id\`, \`google_place_id\`, and/or \`google_ftid\` in the result.
2. \`create_place\` — add it to the trip's place pool, passing the IDs from step 1 (enables opening hours, ratings, and map linking in the app).
3. \`assign_place_to_day\` — schedule it on the desired day using the dayId from \`get_trip_summary\`.

**Creating an accommodation:** A place must exist in the trip first. Create the place (or reuse an existing one), then call \`create_accommodation\` with that \`place_id\` and the \`start_day_id\`/\`end_day_id\`.

**Reordering:** Assignments, todos, packing items, and reservations all support positional reordering via dedicated reorder tools. Always read the current order from \`get_trip_summary\` before reordering.

**Help:** \`list_help_topics\` and \`get_help_page\` hold how-tos. A tool whose input is too large for the tool list says so and keeps its full reference there, under \`tool/<name>\`.`;

const RULES = `## Access rules

- The authenticated user can only access trips they own or are a member of. Never guess at trip IDs.
- Only the trip owner can delete the trip, add members, or remove members.
- Deleting a place removes all of its day assignments as well — warn the user before doing this.
- A trip can span at most 999 days, by date range or by day_count.

## Dates and times

- All dates use ISO format: **YYYY-MM-DD**.
- Times are strings like **"09:00"** or **"14:30"** (24-hour). Pass \`null\` to clear a time.
- When displaying dates to users, use a friendly human-readable format (e.g. "Mon, Apr 14").`;

const BEHAVIOUR = `## Behavioral rules

- Prefer \`get_trip_summary\` over individual list tools when you need a full picture — it is one call instead of many.
- Use \`search_place\` before \`create_place\` so the app gets structured POI data (coordinates, address, opening hours). Do not skip this step.
- When the user asks to "add X to day Y", resolve both the place (search + create if needed) and the day ID before calling \`assign_place_to_day\`.
- Do not batch destructive operations (delete trip, delete day, delete place) without explicit user confirmation for each.
- Present amounts with the trip's currency. Use \`get_trip_summary\` to read the currency field.
- Read \`get_display_settings\` before rendering a temperature, a distance or a clock time: the user has picked units, a time format and a default currency, and guessing at them contradicts what they see in the app.
- For group trips, always check member IDs via \`list_trip_members\` before calling tools that require a \`userId\` (e.g. budget splits, assignment participants).
- A tool whose description starts with "Deprecated: use" still works; call the tool it names instead.`;

const APPS = `## Interactive views

This host renders MCP Apps: some read tools (trips, packing, budget, weather and more) come with an interactive view beside their result. The view is a companion, not the answer: still answer in words, and do not repeat every row the view already shows.`;

/** The instructions for one session; deterministic for the same context. */
export function buildInstructions({ addons, scopes, hostSupportsApps }: InstructionsContext): string {
  const granted = scopes === null ? null : [...scopes];
  const reachable = FEATURES.filter(
    (feature) => (feature.addon === undefined || addons.has(feature.addon)) && canRead(granted, feature.group),
  );
  const model = [...CORE_MODEL, ...reachable.map((f) => f.model)].map((line) => `- ${line}`).join('\n');
  const features = reachable.flatMap((f) => (f.feature ? [`- ${f.feature}`] : []));
  const parts = [
    'You are connected to TREK, a travel planning application. Below is a compact reference of the data model, key workflows, and behavioral rules you must follow.',
    `## Data model\n\n${model}`,
    WORKFLOWS,
    RULES,
    features.length > 0
      ? `## Add-on features\n\nThis session can use these optional parts of TREK; anything not listed is switched off on this instance or outside the access granted to this client:\n${features.join('\n')}`
      : '',
    BEHAVIOUR,
    hostSupportsApps ? APPS : '',
  ];
  return parts.filter(Boolean).join('\n\n');
}
