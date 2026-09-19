/**
 * DawarichMcp unit tests: DAWARICH-MCP-001 through DAWARICH-MCP-066.
 *
 * The class is built with `new` and every collaborator is a plain mock: no Nest
 * container, no registry, no MCP server, no network. That is deliberate. The
 * tool bodies are small, and what is worth pinning about them is not the
 * plumbing but the four things a regression would quietly take away:
 *
 *  - **the decorator metadata**, which is the tool's entire security story. The
 *    REST half carries `@RequireAddon(ADDON_IDS.DAWARICH)` and a guard order;
 *    the MCP half carries `when:` and `access:`, and nothing else enforces
 *    either. A dropped `when:` leaves the tools callable on an instance where
 *    the addon is off, and a widened `access:` hands a token scoped to one
 *    thing the power to write another. Accepting is three tools precisely so
 *    that each claims one scope instead of the union of all three, so the
 *    group/mode table below is what keeps that true;
 *  - **the absence of the connection tools**. Settings, test and disconnect
 *    take an API key for somebody's complete location history. Their absence is
 *    a decision, and a decision nobody asserts is one somebody re-adds by
 *    accident, so the tool-name set is pinned exactly and no input schema is
 *    allowed to grow a credential field;
 *  - **the input schemas**, which are the only validation these tools have. The
 *    controller has `parseId`/`parseState`/`parseDate` and a test each; the tool
 *    has a Zod shape and the SDK. If `suggestionId` loses `.positive()` nothing
 *    else notices, so the shapes are parsed here directly;
 *  - **the demo gate and the error shaping**. Every write tool refuses the demo
 *    account before it reaches the service, and `run()` turns an `AcceptError`
 *    into a refusal the assistant can read instead of an exception. Anything
 *    that is not an `AcceptError` is deliberately left to propagate, which is
 *    pinned too: a swallowed failure reported as a success would be worse.
 *
 * Suggestion fixtures are cast rather than spelled out in full, because the
 * tools pass them through untouched and the unread fields would only be noise.
 * Where a tool does reshape a payload (`tripTrack`) the fixture is complete and
 * the assertion is a deep equality, because there the point is exactly which
 * fields survive and which do not.
 */
import { describe, it, expect, vi } from 'vitest';
import { z, type ZodRawShape } from 'zod';
import type { DawarichSuggestionList, DawarichTrack } from '@trek/shared';

import { DawarichMcp } from '../../../src/nest/integrations/dawarich.mcp';
import { AcceptError } from '../../../src/nest/integrations/dawarich-suggestions.service';
import type { DawarichSuggestionsService } from '../../../src/nest/integrations/dawarich-suggestions.service';
import type { DawarichTracksService } from '../../../src/nest/integrations/dawarich-tracks.service';
import type { AuthService } from '../../../src/nest/auth/auth.service';
import type { AddonsService } from '../../../src/nest/addons/addons.service';
import { getEntry, type ClassRef } from '../../../src/nest-mcp/metadata';
import type { McpContext, McpTextResult, ToolOptions } from '../../../src/nest-mcp';
import { ADDON_IDS } from '../../../src/addons';

const ctx = { userId: 7, scopes: null, isStaticToken: false } as McpContext;

interface Mocks {
  suggestions?: Partial<DawarichSuggestionsService>;
  tracks?: Partial<DawarichTracksService>;
  auth?: Partial<AuthService>;
  addons?: Partial<AddonsService>;
}

/** The demo gate is off unless a case turns it on; every write tool asks it. */
function makeMcp(m: Mocks = {}) {
  const auth: Partial<AuthService> = m.auth ?? { isDemoUser: () => false };
  return new DawarichMcp(
    (m.suggestions ?? {}) as DawarichSuggestionsService,
    (m.tracks ?? {}) as DawarichTracksService,
    auth as AuthService,
    (m.addons ?? {}) as AddonsService,
  );
}

/** A tool result is one JSON text block; a success carries no isError flag. */
function payload(result: McpTextResult): Record<string, unknown> {
  expect(result.isError).toBeUndefined();
  return JSON.parse(result.content[0].text) as Record<string, unknown>;
}

function refusal(result: McpTextResult): string {
  expect(result.isError).toBe(true);
  return result.content[0].text;
}

function toolOptions(methodName: string): ToolOptions {
  const entry = getEntry(DawarichMcp as unknown as ClassRef, methodName);
  if (!entry || entry.kind !== 'tool') throw new Error(methodName + ' is not a registered MCP tool');
  return entry.options;
}

/**
 * Every decorated method on the class, read off the prototype the same way the
 * registry enumerates one. Read rather than listed, because a table this file
 * writes down cannot notice a seventh tool: the point of the set assertion
 * below is a new tool failing a test, and that only works if the class is the
 * thing being enumerated.
 */
function registeredMethods(): string[] {
  return Object.getOwnPropertyNames(DawarichMcp.prototype)
    .filter((name) => getEntry(DawarichMcp as unknown as ClassRef, name) !== undefined)
    .sort();
}

/** The tool's declared input shape, as a schema a case can parse against. */
function inputSchema(methodName: string) {
  return z.object(toolOptions(methodName).inputSchema as ZodRawShape);
}

/** Method name to advertised tool name. Handlers are reached by the key. */
const TOOLS: Record<string, string> = {
  listSuggestions: 'list_dawarich_suggestions',
  acceptAsPlace: 'accept_dawarich_suggestion_as_place',
  acceptAsJournalEntry: 'accept_dawarich_suggestion_as_journal_entry',
  markBucketVisited: 'mark_bucket_list_item_visited_from_dawarich',
  dismiss: 'dismiss_dawarich_suggestion',
  tripTrack: 'get_dawarich_trip_track',
};

function list(count: number, over: Partial<DawarichSuggestionList> = {}): DawarichSuggestionList {
  return {
    suggestions: Array.from({ length: count }, (_, i) => ({ id: i + 1, name: 'Stay ' + (i + 1) })),
    connected: true,
    lastSyncAt: '2026-05-01T06:00:00.000Z',
    lastSyncState: 'ok',
    lastSyncError: null,
    ...over,
  } as unknown as DawarichSuggestionList;
}

// ---------------------------------------------------------------------------
// Decorator metadata: the whole gate, and the tools that are not here
// ---------------------------------------------------------------------------

describe('DawarichMcp surface', () => {
  it('DAWARICH-MCP-001: exactly six tools, and not one of them touches the connection', () => {
    // The API key is a credential for somebody's complete location history, so
    // settings, test and disconnect have no tool at all. Asserted as an exact
    // set, because "we did not add one" stays true only until somebody does.
    // The class is enumerated first so that a seventh decorated method fails
    // here rather than being quietly absent from the table this file keeps.
    expect(registeredMethods()).toEqual(Object.keys(TOOLS).sort());

    const names = registeredMethods().map((method) => toolOptions(method).name).sort();
    expect(names).toEqual([
      'accept_dawarich_suggestion_as_journal_entry',
      'accept_dawarich_suggestion_as_place',
      'dismiss_dawarich_suggestion',
      'get_dawarich_trip_track',
      'list_dawarich_suggestions',
      'mark_bucket_list_item_visited_from_dawarich',
    ]);
  });

  it('DAWARICH-MCP-002: no tool takes a URL, an API key or a TLS switch', () => {
    // The other half of the same decision: a connection surface could also
    // arrive as a field bolted onto an existing schema rather than as a tool.
    const fields = registeredMethods().flatMap((method) =>
      Object.keys(toolOptions(method).inputSchema as ZodRawShape),
    );
    for (const forbidden of ['url', 'apiKey', 'api_key', 'allowInsecureTls', 'token']) {
      expect(fields).not.toContain(forbidden);
    }
  });

  it.each(registeredMethods())(
    'DAWARICH-MCP-003: %s is gated on the dawarich addon, the same gate the controller gets from @RequireAddon',
    (method) => {
      const isAddonEnabled = vi.fn().mockReturnValue(false);
      const mcp = makeMcp({ addons: { isAddonEnabled } });
      const { when } = toolOptions(method);

      expect(typeof when).toBe('function');
      expect(when(ctx, mcp)).toBe(false);
      expect(isAddonEnabled).toHaveBeenCalledWith(ADDON_IDS.DAWARICH);

      isAddonEnabled.mockReturnValue(true);
      expect(when(ctx, mcp)).toBe(true);
    },
  );

  it.each([
    ['listSuggestions', 'journey', 'read'],
    ['acceptAsPlace', 'places', 'write'],
    ['acceptAsJournalEntry', 'journey', 'write'],
    ['markBucketVisited', 'atlas', 'write'],
    ['dismiss', 'journey', 'write'],
    ['tripTrack', 'journey', 'read'],
  ])(
    'DAWARICH-MCP-004: %s claims %s:%s, the scope of what it writes rather than of where the data came from',
    (method, group, mode) => {
      // Collapse the three accept tools into one with a `target` parameter and
      // this table is the first thing that has to change: the single tool would
      // have to claim places:write, journey:write and atlas:write together.
      expect(toolOptions(method).access).toEqual({ group, mode });
    },
  );

  it.each([
    // method, readOnlyHint, idempotentHint, openWorldHint
    ['listSuggestions', true, true, false],
    ['acceptAsPlace', false, false, false],
    ['acceptAsJournalEntry', false, false, false],
    ['markBucketVisited', false, true, false],
    ['dismiss', false, true, false],
    ['tripTrack', true, true, true],
  ])(
    'DAWARICH-MCP-005: %s advertises readOnly=%s idempotent=%s openWorld=%s',
    (method, readOnly, idempotent, openWorld) => {
      // openWorldHint is the one a host acts on: the list tool reads TREK's own
      // table (the fetch from the remote instance happens on a cron), while the
      // track tool reaches the caller's Dawarich instance on every call.
      expect(toolOptions(method).annotations).toMatchObject({
        readOnlyHint: readOnly,
        destructiveHint: false,
        idempotentHint: idempotent,
        openWorldHint: openWorld,
      });
    },
  );

  it('DAWARICH-MCP-006: the two read tools never ask the demo gate, so the demo account can still see what it recorded', async () => {
    // The counterpart to DAWARICH-MCP-040, and the same line the controller
    // draws: reading is not a write. The gate is wired to answer "yes, demo"
    // here, so a check added to a read would turn both of these into refusals
    // and payload() would fail on the isError flag.
    const isDemoUser = vi.fn().mockReturnValue(true);
    const listFn = vi.fn().mockReturnValue(list(1));
    const forTrip = vi.fn().mockResolvedValue({
      days: [], source: 'tracks', fetchedAt: '2026-05-02T09:00:00.000Z', pointCount: 0, truncated: false,
    });
    const mcp = makeMcp({ suggestions: { list: listFn }, tracks: { forTrip }, auth: { isDemoUser } });

    payload(mcp.listSuggestions({}, ctx));
    payload(await mcp.tripTrack({ tripId: 5 }, ctx));
    expect(isDemoUser).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Input schemas: the only validation these tools have
// ---------------------------------------------------------------------------

describe('DawarichMcp input schemas', () => {
  it('DAWARICH-MCP-010: every filter on the list tool is optional, so "what is waiting for review" needs no arguments', () => {
    expect(inputSchema('listSuggestions').safeParse({}).success).toBe(true);
  });

  it.each([0, -3, 1.5, '42'])('DAWARICH-MCP-011: the list tool refuses the tripId %j', (tripId) => {
    expect(inputSchema('listSuggestions').safeParse({ tripId }).success).toBe(false);
  });

  it.each(['new', 'accepted', 'dismissed'])('DAWARICH-MCP-012: %s is a known state and passes', (state) => {
    expect(inputSchema('listSuggestions').safeParse({ state }).success).toBe(true);
  });

  it.each(['NEW', 'pending', 'all', ''])(
    'DAWARICH-MCP-013: the unknown state %j is refused rather than ignored, which would answer with an unfiltered list',
    (state) => {
      expect(inputSchema('listSuggestions').safeParse({ state }).success).toBe(false);
    },
  );

  it.each([
    [1, true],
    [200, true],
    [0, false],
    [201, false],
    [50.5, false],
  ])(
    'DAWARICH-MCP-014: limit %j is accepted: %s. 200 is the ceiling that keeps a year of stays out of one tool result',
    (limit, okay) => {
      expect(inputSchema('listSuggestions').safeParse({ limit }).success).toBe(okay);
    },
  );

  it('DAWARICH-MCP-015: accepting as a place needs an id and nothing else, because the trip defaults to the one the stay fell into', () => {
    const schema = inputSchema('acceptAsPlace');
    expect(schema.safeParse({ suggestionId: 9 }).success).toBe(true);
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ suggestionId: 0 }).success).toBe(false);
    expect(schema.safeParse({ suggestionId: -1 }).success).toBe(false);
  });

  it.each([
    [{ lat: 90, lng: 180 }, true],
    [{ lat: -90, lng: -180 }, true],
    [{ lat: 90.1, lng: 0 }, false],
    [{ lat: 0, lng: 180.1 }, false],
  ])('DAWARICH-MCP-016: corrected coordinates %j are on the globe: %s', (coords, okay) => {
    expect(inputSchema('acceptAsPlace').safeParse({ suggestionId: 1, ...coords }).success).toBe(okay);
  });

  it('DAWARICH-MCP-017: a corrected name is trimmed and cannot be whitespace, and notes stop at 5000 characters', () => {
    const schema = inputSchema('acceptAsPlace');
    expect(schema.safeParse({ suggestionId: 1, name: '  Hafen  ' })).toMatchObject({
      success: true,
      data: { name: 'Hafen' },
    });
    expect(schema.safeParse({ suggestionId: 1, name: '   ' }).success).toBe(false);
    expect(schema.safeParse({ suggestionId: 1, notes: 'x'.repeat(5000) }).success).toBe(true);
    expect(schema.safeParse({ suggestionId: 1, notes: 'x'.repeat(5001) }).success).toBe(false);
  });

  it('DAWARICH-MCP-018: a journal entry needs a journey to live in, so journalId is the one required companion', () => {
    const schema = inputSchema('acceptAsJournalEntry');
    expect(schema.safeParse({ suggestionId: 9, journalId: 3 }).success).toBe(true);
    expect(schema.safeParse({ suggestionId: 9 }).success).toBe(false);
  });

  // Spelled with an explicit row type: the rows carry different keys, so left
  // to inference the callback's first parameter is a union of one-key object
  // types rather than "a partial stamp", which is what it means here.
  it.each<[Record<string, unknown>, boolean]>([
    [{ date: '2026-05-01' }, true],
    [{ date: '2026-5-1' }, false],
    [{ date: '2026-05-01T00:00:00Z' }, false],
    [{ time: '09:30' }, true],
    [{ time: '9:30' }, false],
    [{ time: '09:30:00' }, false],
  ])('DAWARICH-MCP-019: the journal stamp %j is accepted: %s', (over, okay) => {
    expect(inputSchema('acceptAsJournalEntry').safeParse({ suggestionId: 1, journalId: 1, ...over }).success).toBe(okay);
  });

  it('DAWARICH-MCP-020: ticking off a wish needs the stay; the wish itself defaults to the one it was matched to', () => {
    const schema = inputSchema('markBucketVisited');
    expect(schema.safeParse({ suggestionId: 4 }).success).toBe(true);
    expect(schema.safeParse({ suggestionId: 4, bucketListItemId: 8 }).success).toBe(true);
    expect(schema.safeParse({ suggestionId: 4, bucketListItemId: 0 }).success).toBe(false);
    expect(schema.safeParse({ bucketListItemId: 8 }).success).toBe(false);
  });

  it('DAWARICH-MCP-021: dismissing takes only the two states that are a review decision, and "accepted" is not one of them', () => {
    const schema = inputSchema('dismiss');
    expect(schema.safeParse({ suggestionId: 4 }).success).toBe(true);
    expect(schema.safeParse({ suggestionId: 4, state: 'new' }).success).toBe(true);
    expect(schema.safeParse({ suggestionId: 4, state: 'dismissed' }).success).toBe(true);
    // Accepting writes a place, an entry or a tick. It is never a state change,
    // and a tool that let one through would mark a stay handled with nothing
    // behind it.
    expect(schema.safeParse({ suggestionId: 4, state: 'accepted' }).success).toBe(false);
  });

  it.each<[Record<string, unknown>, boolean]>([
    [{ tripId: 5 }, true],
    [{ tripId: 5, from: '2026-05-01', to: '2026-05-03' }, true],
    [{}, false],
    [{ tripId: 5, from: '01.05.2026' }, false],
    [{ tripId: 5, to: 'yesterday' }, false],
  ])('DAWARICH-MCP-022: the track tool accepts %j: %s', (args, okay) => {
    expect(inputSchema('tripTrack').safeParse(args).success).toBe(okay);
  });
});

// ---------------------------------------------------------------------------
// list_dawarich_suggestions
// ---------------------------------------------------------------------------

describe('DawarichMcp list_dawarich_suggestions', () => {
  it('DAWARICH-MCP-030: the filters reach the service for the calling user, and the sync provenance rides back', () => {
    // A disconnected instance with a failed poll is the interesting case: the
    // stays are still there, and without the provenance an assistant would
    // present a stale backlog as if it were current.
    const listFn = vi.fn().mockReturnValue(list(2, { connected: false, lastSyncState: 'failed', lastSyncAt: null }));
    const out = payload(makeMcp({ suggestions: { list: listFn } }).listSuggestions({ tripId: 3, state: 'new' }, ctx));

    expect(listFn).toHaveBeenCalledWith(7, { tripId: 3, state: 'new' });
    expect(out).toMatchObject({
      total: 2,
      truncated: false,
      connected: false,
      lastSyncAt: null,
      lastSyncState: 'failed',
    });
  });

  it('DAWARICH-MCP-031: no arguments means no filters, undefined rather than a filter on nothing', () => {
    const listFn = vi.fn().mockReturnValue(list(0));
    payload(makeMcp({ suggestions: { list: listFn } }).listSuggestions({}, ctx));
    expect(listFn).toHaveBeenCalledWith(7, { tripId: undefined, state: undefined });
  });

  it('DAWARICH-MCP-032: a backlog longer than the default page is cut to 50 and says so, because an assistant must not pay for a year of stays', () => {
    const out = payload(makeMcp({ suggestions: { list: vi.fn().mockReturnValue(list(60)) } }).listSuggestions({}, ctx));

    expect((out.suggestions as unknown[]).length).toBe(50);
    expect(out.total).toBe(60);
    expect(out.truncated).toBe(true);
  });

  it('DAWARICH-MCP-033: a list that fits is not flagged truncated, so a caller can tell "all of it" from "the first page"', () => {
    const out = payload(makeMcp({ suggestions: { list: vi.fn().mockReturnValue(list(50)) } }).listSuggestions({}, ctx));

    expect((out.suggestions as unknown[]).length).toBe(50);
    expect(out.total).toBe(50);
    expect(out.truncated).toBe(false);
  });

  it('DAWARICH-MCP-034: an explicit limit wins over the default in both directions', () => {
    const mcp = makeMcp({ suggestions: { list: vi.fn().mockReturnValue(list(60)) } });

    const small = payload(mcp.listSuggestions({ limit: 3 }, ctx));
    expect((small.suggestions as unknown[]).length).toBe(3);
    expect(small.truncated).toBe(true);

    const large = payload(mcp.listSuggestions({ limit: 200 }, ctx));
    expect((large.suggestions as unknown[]).length).toBe(60);
    expect(large.truncated).toBe(false);
  });

  it('DAWARICH-MCP-035: the stays go out as the service shaped them, because the tool pages and does not reshape', () => {
    const out = payload(makeMcp({ suggestions: { list: vi.fn().mockReturnValue(list(2)) } }).listSuggestions({ limit: 1 }, ctx));
    expect(out.suggestions).toEqual([{ id: 1, name: 'Stay 1' }]);
  });

  it('DAWARICH-MCP-036: the reason the last poll failed is the one field the tool drops', () => {
    // lastSyncError is on DawarichSuggestionList and the REST list carries it;
    // this tool does not. Pinned so the omission stays a decision rather than an
    // oversight: an assistant can say the sync failed but not why, which is a
    // defensible privacy line (the string can name the host) and, at the same
    // time, a real gap in what it is able to explain to the person asking.
    const listFn = vi.fn().mockReturnValue(list(1, { lastSyncState: 'failed', lastSyncError: 'unauthorized' }));
    const out = payload(makeMcp({ suggestions: { list: listFn } }).listSuggestions({}, ctx));

    expect(out).not.toHaveProperty('lastSyncError');
    expect(out.lastSyncState).toBe('failed');
  });
});

// ---------------------------------------------------------------------------
// The three accept tools and the dismiss tool
// ---------------------------------------------------------------------------

describe('DawarichMcp accept tools', () => {
  it.each(['acceptAsPlace', 'acceptAsJournalEntry', 'markBucketVisited', 'dismiss'])(
    'DAWARICH-MCP-040: %s refuses the demo account before the service is reached',
    (method) => {
      // One argument object for all four: the demo check runs before anything
      // reads the body, so the extra keys are exactly as irrelevant here as the
      // refusal makes them.
      const args = { suggestionId: 9, tripId: 2, journalId: 2 };
      const accept = vi.fn();
      const setState = vi.fn();
      const isDemoUser = vi.fn().mockReturnValue(true);
      const mcp = makeMcp({ suggestions: { accept, setState }, auth: { isDemoUser } });

      const call = (mcp as unknown as Record<string, (a: unknown, c: McpContext) => McpTextResult>)[method];
      expect(refusal(call.call(mcp, args, ctx))).toBe('Write operations are disabled in demo mode.');
      expect(isDemoUser).toHaveBeenCalledWith(7);
      expect(accept).not.toHaveBeenCalled();
      expect(setState).not.toHaveBeenCalled();
    },
  );

  it('DAWARICH-MCP-041: accepting as a place forwards every correction under target "place", with the id kept out of the body', () => {
    // suggestionId is the second argument, not a body field. Leaving it in the
    // body would put a key into DawarichAccept that nothing reads, and the next
    // reader would reasonably assume it was the one being accepted.
    const accept = vi.fn().mockReturnValue({ createdPlaceId: 5, createdJournalEntryId: null, bucketListItemId: null });
    const out = payload(makeMcp({ suggestions: { accept } }).acceptAsPlace(
      { suggestionId: 9, tripId: 2, dayId: 4, name: 'Hafen', notes: 'windy', lat: 53.5, lng: 9.9 },
      ctx,
    ));

    expect(accept).toHaveBeenCalledWith(7, 9, {
      target: 'place',
      tripId: 2,
      dayId: 4,
      name: 'Hafen',
      notes: 'windy',
      lat: 53.5,
      lng: 9.9,
    });
    expect(accept.mock.calls[0][2]).not.toHaveProperty('suggestionId');
    expect(out).toMatchObject({ createdPlaceId: 5 });
  });

  it('DAWARICH-MCP-042: a bare accept sends only the target, so the service keeps its own defaults for the trip and the coordinates', () => {
    const accept = vi.fn().mockReturnValue({ createdPlaceId: 1 });
    makeMcp({ suggestions: { accept } }).acceptAsPlace({ suggestionId: 9 }, ctx);
    expect(accept).toHaveBeenCalledWith(7, 9, { target: 'place' });
  });

  it('DAWARICH-MCP-043: accepting as a journal entry forwards target "journal" with the journey, the story and the corrected stamp', () => {
    const accept = vi.fn().mockReturnValue({ createdJournalEntryId: 11 });
    const out = payload(makeMcp({ suggestions: { accept } }).acceptAsJournalEntry(
      { suggestionId: 9, journalId: 3, name: 'The harbour', notes: 'It rained.', date: '2026-05-01', time: '09:30' },
      ctx,
    ));

    expect(accept).toHaveBeenCalledWith(7, 9, {
      target: 'journal',
      journalId: 3,
      name: 'The harbour',
      notes: 'It rained.',
      date: '2026-05-01',
      time: '09:30',
    });
    expect(out).toMatchObject({ createdJournalEntryId: 11 });
  });

  it('DAWARICH-MCP-044: ticking off a wish names it explicitly when the caller did', () => {
    const accept = vi.fn().mockReturnValue({ bucketListItemId: 8 });
    makeMcp({ suggestions: { accept } }).markBucketVisited({ suggestionId: 9, bucketListItemId: 8 }, ctx);
    expect(accept).toHaveBeenCalledWith(7, 9, { target: 'bucket_list', bucketListItemId: 8 });
  });

  it('DAWARICH-MCP-045: an omitted wish stays undefined rather than being guessed here, and the service falls back to the matched one', () => {
    const accept = vi.fn().mockReturnValue({ bucketListItemId: 2 });
    makeMcp({ suggestions: { accept } }).markBucketVisited({ suggestionId: 9 }, ctx);
    expect(accept).toHaveBeenCalledWith(7, 9, { target: 'bucket_list', bucketListItemId: undefined });
  });

  it.each([
    ['not_found', 'Suggestion not found', 404],
    ['already_accepted', 'Suggestion has already been accepted', 409],
    ['day_not_on_trip', 'Day does not belong to this trip', 400],
    ['trip_required', 'A trip is required to create a place', 400],
  ])(
    'DAWARICH-MCP-046: the AcceptError %s comes back as a refusal an assistant can read (%s), not as an exception and not as the HTTP %i the REST half answers',
    (code, message, status) => {
      const accept = vi.fn(() => { throw new AcceptError(code, message, status); });
      const result = makeMcp({ suggestions: { accept } }).acceptAsPlace({ suggestionId: 9 }, ctx);

      expect(refusal(result)).toBe(message);
      // The status code is the REST half's vocabulary. MCP has isError and a
      // sentence, and a number leaking into the sentence would be noise an
      // assistant then repeats at the person who asked.
      expect(result.content[0].text).not.toContain(String(status));
    },
  );

  it('DAWARICH-MCP-047: the same shaping covers the journal and bucket-list tools, because run() is shared and a second copy would drift', () => {
    const accept = vi.fn(() => { throw new AcceptError('not_found', 'Bucket-list entry not found', 404); });
    const mcp = makeMcp({ suggestions: { accept } });

    expect(refusal(mcp.acceptAsJournalEntry({ suggestionId: 9, journalId: 1 }, ctx))).toBe('Bucket-list entry not found');
    expect(refusal(mcp.markBucketVisited({ suggestionId: 9 }, ctx))).toBe('Bucket-list entry not found');
  });

  it('DAWARICH-MCP-048: anything that is not an AcceptError propagates, because a failed write must never be reported as a success', () => {
    // A locked database, or a permission lookup that blew up, is not a refusal
    // the caller can act on. Flattening it into a text result would hand the
    // assistant a message with no isError flag on it to notice.
    const accept = vi.fn(() => { throw new Error('SQLITE_BUSY: database is locked'); });
    expect(() => makeMcp({ suggestions: { accept } }).acceptAsPlace({ suggestionId: 9 }, ctx))
      .toThrow('SQLITE_BUSY: database is locked');
  });
});

describe('DawarichMcp dismiss_dawarich_suggestion', () => {
  it('DAWARICH-MCP-050: dismissed is the default, because that is what the tool is for', () => {
    const updated = { id: 4, state: 'dismissed' };
    const setState = vi.fn().mockReturnValue(updated);
    const out = payload(makeMcp({ suggestions: { setState } }).dismiss({ suggestionId: 4 }, ctx));

    expect(setState).toHaveBeenCalledWith(7, 4, 'dismissed');
    expect(out).toEqual({ suggestion: updated });
  });

  it('DAWARICH-MCP-051: "new" puts a dismissed stay back into the review list', () => {
    const setState = vi.fn().mockReturnValue({ id: 4, state: 'new' });
    makeMcp({ suggestions: { setState } }).dismiss({ suggestionId: 4, state: 'new' }, ctx);
    expect(setState).toHaveBeenCalledWith(7, 4, 'new');
  });

  it("DAWARICH-MCP-052: somebody else's suggestion gets the answer a missing one gets: the service says null, the tool says not found", () => {
    // The service scopes its lookup by user_id, so null covers both cases and
    // the tool must not separate them. A different message for "exists but is
    // not yours" would let a caller enumerate other people's suggestion ids.
    const setState = vi.fn().mockReturnValue(null);
    expect(refusal(makeMcp({ suggestions: { setState } }).dismiss({ suggestionId: 999 }, ctx)))
      .toBe('Suggestion not found');
  });
});

// ---------------------------------------------------------------------------
// get_dawarich_trip_track
// ---------------------------------------------------------------------------

describe('DawarichMcp get_dawarich_trip_track', () => {
  const track = {
    source: 'points',
    fetchedAt: '2026-05-02T09:00:00.000Z',
    truncated: true,
    pointCount: 3,
    days: [
      {
        date: '2026-05-01',
        segments: [
          {
            mode: 'walking',
            startedAt: '2026-05-01T08:00:00.000Z',
            endedAt: '2026-05-01T08:20:00.000Z',
            distanceMeters: 1234,
            points: [[53.5, 9.9], [53.6, 10.0]],
          },
          {
            // An instance too old to classify reports neither a mode nor a
            // distance. Both travel as null rather than being invented here.
            mode: null,
            startedAt: '2026-05-01T12:00:00.000Z',
            endedAt: '2026-05-01T12:05:00.000Z',
            distanceMeters: null,
            points: [[53.7, 10.1]],
          },
        ],
      },
      // A recorded day on which nothing was segmented still belongs in the
      // answer: "we have that day and it is empty" is not "we have no day".
      { date: '2026-05-02', segments: [] },
    ],
  } as unknown as DawarichTrack;

  it('DAWARICH-MCP-060: the geometry is replaced by a count, because a month of coordinates in a tool result is the failure mode', async () => {
    const forTrip = vi.fn().mockResolvedValue(track);
    const out = payload(await makeMcp({ tracks: { forTrip } }).tripTrack({ tripId: 5 }, ctx));

    expect(out).toEqual({
      source: 'points',
      fetchedAt: '2026-05-02T09:00:00.000Z',
      truncated: true,
      pointCount: 3,
      days: [
        {
          date: '2026-05-01',
          segments: [
            {
              mode: 'walking',
              startedAt: '2026-05-01T08:00:00.000Z',
              endedAt: '2026-05-01T08:20:00.000Z',
              distanceMeters: 1234,
              points: 2,
            },
            {
              mode: null,
              startedAt: '2026-05-01T12:00:00.000Z',
              endedAt: '2026-05-01T12:05:00.000Z',
              distanceMeters: null,
              points: 1,
            },
          ],
        },
        { date: '2026-05-02', segments: [] },
      ],
    });
  });

  it('DAWARICH-MCP-061: the narrowing reaches the service, so one day can be asked for without pulling the whole trip', async () => {
    const forTrip = vi.fn().mockResolvedValue(track);
    await makeMcp({ tracks: { forTrip } }).tripTrack({ tripId: 5, from: '2026-05-01', to: '2026-05-01' }, ctx);
    expect(forTrip).toHaveBeenCalledWith(7, 5, '2026-05-01', '2026-05-01');
  });

  it('DAWARICH-MCP-062: no narrowing leaves the window to the trip dates, and the day grouping falls back to UTC', async () => {
    // Four arguments, not five: the tool passes no offsetMinutes, so the
    // service's own default of 0 decides which local day a point belongs to.
    // The REST route takes the offset from the caller. Pinned as it stands
    // rather than as it arguably should be, so a deliberate change to it is
    // visible in a diff instead of arriving unnoticed.
    const forTrip = vi.fn().mockResolvedValue(track);
    await makeMcp({ tracks: { forTrip } }).tripTrack({ tripId: 5 }, ctx);
    expect(forTrip).toHaveBeenCalledWith(7, 5, undefined, undefined);
  });

  it('DAWARICH-MCP-063: a trip the caller cannot read is "not found", the same answer a missing trip gets', async () => {
    // The service returns null for both on purpose, and the tool has to keep
    // them indistinguishable or trip ids become enumerable over MCP.
    const forTrip = vi.fn().mockResolvedValue(null);
    expect(refusal(await makeMcp({ tracks: { forTrip } }).tripTrack({ tripId: 5 }, ctx))).toBe('Trip not found');
  });

  it('DAWARICH-MCP-064: an unreachable instance is a refusal carrying the reason, not a rejected promise', async () => {
    const forTrip = vi.fn().mockRejectedValue(new Error('Dawarich is unreachable'));
    expect(refusal(await makeMcp({ tracks: { forTrip } }).tripTrack({ tripId: 5 }, ctx)))
      .toBe('Dawarich is unreachable');
  });

  it('DAWARICH-MCP-065: a throw that is not an Error still gets a sentence, rather than reaching the assistant as "undefined"', async () => {
    const forTrip = vi.fn().mockRejectedValue('boom');
    expect(refusal(await makeMcp({ tracks: { forTrip } }).tripTrack({ tripId: 5 }, ctx)))
      .toBe('Could not read the Dawarich recording');
  });

  it('DAWARICH-MCP-066: an empty recording is a success with no days, not an error, because "we looked and there was nothing" is an answer', async () => {
    const forTrip = vi.fn().mockResolvedValue({
      days: [],
      source: 'tracks',
      fetchedAt: '2026-05-02T09:00:00.000Z',
      pointCount: 0,
      truncated: false,
    } as unknown as DawarichTrack);

    expect(payload(await makeMcp({ tracks: { forTrip } }).tripTrack({ tripId: 5 }, ctx))).toEqual({
      days: [],
      source: 'tracks',
      fetchedAt: '2026-05-02T09:00:00.000Z',
      pointCount: 0,
      truncated: false,
    });
  });
});
