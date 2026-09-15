/**
 * DawarichController unit tests — the controller built with `new`, every
 * collaborator a plain mock. No Nest container, no DI, no network: the
 * DawarichClient is never constructed here, because the only things under test
 * are the ones the controller itself owns.
 *
 * Those are three:
 *
 *  - **the parsers** (`parseId`, `parseOptionalId`, `parseState`, `parseDate`,
 *    `parseWindow`), the reason a bad path segment never reaches a query. They
 *    are module-private on purpose, so they are pinned through the handlers
 *    that use them rather than exported for a test's convenience;
 *  - **`toHttp`**, the one place a domain error becomes a status code — an
 *    `AcceptError` keeps the status the domain chose, a `DawarichError` becomes
 *    502 except for the two codes that mean "your key is wrong", which are 400
 *    because they are the caller's to fix and not the upstream's fault;
 *  - **the delegation**, `X-Socket-Id` included, whose loss would make an
 *    accept echo straight back into the tab that performed it.
 */
import { describe, it, expect, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import type { Request } from 'express';
import type { DawarichErrorCode } from '@trek/shared';
import { DawarichController } from '../../../src/nest/integrations/dawarich.controller';
import { AcceptError } from '../../../src/nest/integrations/dawarich-suggestions.service';
import { DawarichError } from '../../../src/nest/integrations/dawarich.client';
import { JwtAuthGuard } from '../../../src/nest/auth/jwt-auth.guard';
import { AddonGuard } from '../../../src/nest/addons/addon.guard';
import { REQUIRE_ADDON } from '../../../src/nest/addons/require-addon.decorator';
import { ADDON_IDS } from '../../../src/addons';
import type { DawarichService } from '../../../src/nest/integrations/dawarich.service';
import type { DawarichSyncService } from '../../../src/nest/integrations/dawarich-sync.service';
import type { DawarichSuggestionsService } from '../../../src/nest/integrations/dawarich-suggestions.service';
import type { DawarichTracksService } from '../../../src/nest/integrations/dawarich-tracks.service';
import type { User } from '../../../src/types';

const user = { id: 7 } as User;

interface Mocks {
  dawarich?: Partial<DawarichService>;
  sync?: Partial<DawarichSyncService>;
  suggestions?: Partial<DawarichSuggestionsService>;
  tracks?: Partial<DawarichTracksService>;
}

function makeController(m: Mocks = {}) {
  return new DawarichController(
    (m.dawarich ?? {}) as DawarichService,
    (m.sync ?? {}) as DawarichSyncService,
    (m.suggestions ?? {}) as DawarichSuggestionsService,
    (m.tracks ?? {}) as DawarichTracksService,
  );
}

/** A request stub carrying only what the controller reads off it. */
function makeReq(headers: Record<string, string> = {}, ip = '10.1.2.3'): Request {
  return { headers, ip, socket: { remoteAddress: ip } } as unknown as Request;
}

/** A valid settings body — the two defaulted fields are required in the DTO's output type. */
function settings(over: Partial<{ url: string; apiKey: string; allowInsecureTls: boolean; syncEnabled: boolean }> = {}) {
  return {
    url: 'https://dawarich.example',
    allowInsecureTls: false,
    syncEnabled: true,
    ...over,
  };
}

async function thrown(fn: () => unknown): Promise<{ status: number; body: unknown }> {
  try {
    await fn();
  } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected the handler to throw');
}

// ---------------------------------------------------------------------------
// Route wiring
// ---------------------------------------------------------------------------

describe('DawarichController wiring', () => {
  it('DAWARICH-CTRL-001: answers under /api/integrations/dawarich', () => {
    expect(Reflect.getMetadata('path', DawarichController)).toBe('api/integrations/dawarich');
  });

  it('DAWARICH-CTRL-002: AddonGuard runs BEFORE JwtAuthGuard, so a disabled addon 404s an anonymous caller instead of confirming the route with a 401', () => {
    const guards = Reflect.getMetadata('__guards__', DawarichController) as unknown[] | undefined;
    // Array shape asserted first: expect(undefined).toContain(X) passes in this
    // vitest version, so the plain form would stop guarding the moment the
    // decorator disappeared.
    expect(Array.isArray(guards)).toBe(true);
    expect(guards).toEqual([AddonGuard, JwtAuthGuard]);
  });

  it('DAWARICH-CTRL-003: gates on the dawarich addon, with the label that leads the 404 body', () => {
    expect(Reflect.getMetadata(REQUIRE_ADDON, DawarichController)).toEqual({
      addonId: ADDON_IDS.DAWARICH,
      label: 'Dawarich',
    });
  });
});

// ---------------------------------------------------------------------------
// Connection routes
// ---------------------------------------------------------------------------

describe('DawarichController connection routes', () => {
  it('DAWARICH-CTRL-010: GET settings hands back what the service says, for the calling user only', () => {
    const connection = { url: 'https://d.example', connected: true };
    const getConnection = vi.fn().mockReturnValue(connection);
    expect(makeController({ dawarich: { getConnection } }).getSettings(user)).toBe(connection);
    expect(getConnection).toHaveBeenCalledWith(7);
  });

  it('DAWARICH-CTRL-011: PUT settings forwards url, key, tls flag, syncEnabled and the client ip', async () => {
    const saveSettings = vi.fn().mockResolvedValue({ success: true });
    const forget = vi.fn();
    const c = makeController({ dawarich: { saveSettings }, tracks: { forget } });

    const out = await c.putSettings(
      user,
      settings({ apiKey: 'k', allowInsecureTls: true, syncEnabled: false }),
      makeReq({}, '203.0.113.9'),
    );

    expect(out).toEqual({ success: true });
    expect(saveSettings).toHaveBeenCalledWith(7, 'https://dawarich.example', 'k', true, false, '203.0.113.9');
  });

  it('DAWARICH-CTRL-012: only an explicit false turns the background poll off', async () => {
    const saveSettings = vi.fn().mockResolvedValue({ success: true });
    const c = makeController({ dawarich: { saveSettings }, tracks: { forget: vi.fn() } });

    await c.putSettings(user, settings({ syncEnabled: true }), makeReq());
    expect(saveSettings.mock.calls[0][4]).toBe(true);
  });

  it('DAWARICH-CTRL-013: a rejected URL is a 400 carrying the service reason, and the cached track is left alone', async () => {
    const saveSettings = vi.fn().mockResolvedValue({ success: false, error: 'Invalid URL' });
    const forget = vi.fn();
    const c = makeController({ dawarich: { saveSettings }, tracks: { forget } });

    expect(await thrown(() => c.putSettings(user, settings({ url: 'nope' }), makeReq())))
      .toEqual({ status: 400, body: { error: 'Invalid URL' } });
    expect(forget).not.toHaveBeenCalled();
  });

  it("DAWARICH-CTRL-014: a saved connection drops the cached track, so the old instance's route is not drawn under the new one's name", async () => {
    const forget = vi.fn();
    const c = makeController({
      dawarich: { saveSettings: vi.fn().mockResolvedValue({ success: true }) },
      tracks: { forget },
    });
    await c.putSettings(user, settings(), makeReq());
    expect(forget).toHaveBeenCalledWith(7);
  });

  it('DAWARICH-CTRL-015: a private-IP warning reaches the caller alongside the success', async () => {
    const c = makeController({
      dawarich: { saveSettings: vi.fn().mockResolvedValue({ success: true, warning: 'resolves to a private IP' }) },
      tracks: { forget: vi.fn() },
    });
    expect(await c.putSettings(user, settings({ url: 'http://192.168.0.5:3000' }), makeReq()))
      .toEqual({ success: true, warning: 'resolves to a private IP' });
  });

  it('DAWARICH-CTRL-016: DELETE settings disconnects, forgets the track and answers 200 { success: true }', () => {
    const disconnect = vi.fn();
    const forget = vi.fn();
    const c = makeController({ dawarich: { disconnect }, tracks: { forget } });

    expect(c.disconnect(user, makeReq({}, '198.51.100.4'))).toEqual({ success: true });
    expect(disconnect).toHaveBeenCalledWith(7, '198.51.100.4');
    expect(forget).toHaveBeenCalledWith(7);
  });

  it('DAWARICH-CTRL-017: POST test answers the probe verbatim — an unusable connection is a 200 the form can render, not an exception', async () => {
    const status = { connected: false, error: 'unauthorized' };
    const testConnection = vi.fn().mockResolvedValue(status);
    const c = makeController({ dawarich: { testConnection } });

    await expect(c.test(user, settings({ apiKey: 'wrong' }))).resolves.toBe(status);
    expect(testConnection).toHaveBeenCalledWith(7, 'https://dawarich.example', 'wrong', false);
  });

  it('DAWARICH-CTRL-018: POST sync pulls for the caller and returns the counts', async () => {
    const result = { state: 'ok', created: 2, updated: 1, missing: 0 };
    const syncUser = vi.fn().mockResolvedValue(result);
    await expect(makeController({ sync: { syncUser } }).syncNow(user)).resolves.toBe(result);
    expect(syncUser).toHaveBeenCalledWith(7);
  });
});

// ---------------------------------------------------------------------------
// parseOptionalId / parseState — the suggestions list filters
// ---------------------------------------------------------------------------

describe('DawarichController GET /suggestions filters', () => {
  it('DAWARICH-CTRL-020: no filters means both are undefined', () => {
    const list = vi.fn().mockReturnValue({ suggestions: [] });
    makeController({ suggestions: { list } }).listSuggestions(user);
    expect(list).toHaveBeenCalledWith(7, { tripId: undefined, state: undefined });
  });

  it('DAWARICH-CTRL-021: an empty query value reads as "no filter", not as a filter on nothing', () => {
    const list = vi.fn().mockReturnValue({ suggestions: [] });
    makeController({ suggestions: { list } }).listSuggestions(user, '', '');
    expect(list).toHaveBeenCalledWith(7, { tripId: undefined, state: undefined });
  });

  it('DAWARICH-CTRL-022: a numeric tripId arrives as a number', () => {
    const list = vi.fn().mockReturnValue({ suggestions: [] });
    makeController({ suggestions: { list } }).listSuggestions(user, '42', 'new');
    expect(list).toHaveBeenCalledWith(7, { tripId: 42, state: 'new' });
  });

  it('DAWARICH-CTRL-023: 400 on a tripId that merely starts with digits, and the field is named', () => {
    const list = vi.fn();
    return thrown(() => makeController({ suggestions: { list } }).listSuggestions(user, '12abc')).then((r) => {
      expect(r).toEqual({ status: 400, body: { error: 'Invalid tripId' } });
      expect(list).not.toHaveBeenCalled();
    });
  });

  it.each(['new', 'accepted', 'dismissed'])('DAWARICH-CTRL-024: %s is a known state and passes through', (state) => {
    const list = vi.fn().mockReturnValue({ suggestions: [] });
    makeController({ suggestions: { list } }).listSuggestions(user, undefined, state);
    expect(list).toHaveBeenCalledWith(7, { tripId: undefined, state });
  });

  it.each(['NEW', 'pending', 'all', "new' OR 1=1"])(
    'DAWARICH-CTRL-025: 400 on the unknown state %j rather than a silently unfiltered list',
    (state) => {
      const list = vi.fn();
      return thrown(() => makeController({ suggestions: { list } }).listSuggestions(user, undefined, state)).then((r) => {
        expect(r).toEqual({ status: 400, body: { error: 'state must be one of: new, accepted, dismissed' } });
        expect(list).not.toHaveBeenCalled();
      });
    },
  );
});

// ---------------------------------------------------------------------------
// parseId — every route that takes an id in the path
// ---------------------------------------------------------------------------

describe('DawarichController parseId', () => {
  const bad = ['12abc', 'abc', '', ' 12', '12 ', '1.5', '-3', '0', '+7', '1e3', '0x10', '9007199254740993'];

  it.each(bad)('DAWARICH-CTRL-030: POST accept refuses the id %j with 400 and never reaches the service', (raw) => {
    const accept = vi.fn();
    return thrown(() => makeController({ suggestions: { accept } })
      .acceptSuggestion(user, raw, { target: 'place' }, makeReq())).then((r) => {
      expect(r).toEqual({ status: 400, body: { error: 'Invalid id' } });
      expect(accept).not.toHaveBeenCalled();
    });
  });

  it('DAWARICH-CTRL-031: "12abc" is never read as 12 — this is exactly what parseInt would have let through', () => {
    const setState = vi.fn();
    return thrown(() => makeController({ suggestions: { setState } })
      .setSuggestionState(user, '12abc', { state: 'dismissed' })).then((r) => {
      expect(r).toEqual({ status: 400, body: { error: 'Invalid id' } });
      expect(setState).not.toHaveBeenCalled();
    });
  });

  it('DAWARICH-CTRL-032: a plain positive integer is accepted, leading zeroes included', () => {
    const setState = vi.fn().mockReturnValue({ id: 12 });
    const c = makeController({ suggestions: { setState } });
    expect(c.setSuggestionState(user, '012', { state: 'new' })).toEqual({ id: 12 });
    expect(setState).toHaveBeenCalledWith(7, 12, 'new');
  });

  it('DAWARICH-CTRL-033: DELETE bucket-list/:itemId/visit refuses a non-numeric item id with 400', () => {
    const clearBucketVisit = vi.fn();
    return thrown(() => makeController({ suggestions: { clearBucketVisit } }).clearBucketVisit(user, '12abc')).then((r) => {
      expect(r).toEqual({ status: 400, body: { error: 'Invalid id' } });
      expect(clearBucketVisit).not.toHaveBeenCalled();
    });
  });

  it('DAWARICH-CTRL-034: GET trips/:tripId/track refuses a non-numeric trip id with 400, not with the guard\'s 502', async () => {
    const forTrip = vi.fn();
    expect(await thrown(() => makeController({ tracks: { forTrip } }).tripTrack(user, '12abc')))
      .toEqual({ status: 400, body: { error: 'Invalid id' } });
    expect(forTrip).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Suggestion state, accept, bucket list, atlas
// ---------------------------------------------------------------------------

describe('DawarichController suggestion routes', () => {
  it('DAWARICH-CTRL-040: PUT state returns the updated suggestion', () => {
    const updated = { id: 3, state: 'dismissed' };
    const setState = vi.fn().mockReturnValue(updated);
    expect(makeController({ suggestions: { setState } }).setSuggestionState(user, '3', { state: 'dismissed' })).toBe(updated);
    expect(setState).toHaveBeenCalledWith(7, 3, 'dismissed');
  });

  it("DAWARICH-CTRL-041: PUT state on somebody else's suggestion is the same 404 a missing one gets — no enumeration", () => {
    const setState = vi.fn().mockReturnValue(null);
    return thrown(() => makeController({ suggestions: { setState } }).setSuggestionState(user, '999', { state: 'new' })).then((r) =>
      expect(r).toEqual({ status: 404, body: { error: 'Suggestion not found' } }));
  });

  it('DAWARICH-CTRL-042: POST accept forwards X-Socket-Id, so the broadcast does not echo into the originating tab', () => {
    const accept = vi.fn().mockReturnValue({ createdPlaceId: 5 });
    const body = { target: 'place' as const, tripId: 2 };
    makeController({ suggestions: { accept } }).acceptSuggestion(user, '9', body, makeReq({ 'x-socket-id': 'sock-abc' }));
    expect(accept).toHaveBeenCalledWith(7, 9, body, 'sock-abc');
  });

  it('DAWARICH-CTRL-043: no X-Socket-Id means undefined, not an empty string a broadcaster would compare against', () => {
    const accept = vi.fn().mockReturnValue({});
    makeController({ suggestions: { accept } }).acceptSuggestion(user, '9', { target: 'journal' }, makeReq());
    expect(accept.mock.calls[0][3]).toBeUndefined();
  });

  it('DAWARICH-CTRL-044: a blank X-Socket-Id counts as absent', () => {
    const accept = vi.fn().mockReturnValue({});
    makeController({ suggestions: { accept } }).acceptSuggestion(user, '9', { target: 'journal' }, makeReq({ 'x-socket-id': '' }));
    expect(accept.mock.calls[0][3]).toBeUndefined();
  });

  it('DAWARICH-CTRL-045: POST bucket-list/confirm wraps the count', () => {
    const confirmBucketVisits = vi.fn().mockReturnValue(3);
    expect(makeController({ suggestions: { confirmBucketVisits } })
      .confirmBucketVisits(user, { itemIds: [1, 2, 3], visitedAt: '2026-05-01' })).toEqual({ updated: 3 });
    expect(confirmBucketVisits).toHaveBeenCalledWith(7, [1, 2, 3], '2026-05-01');
  });

  it('DAWARICH-CTRL-046: DELETE bucket-list/:itemId/visit is a 404 when nothing was cleared', () => {
    const clearBucketVisit = vi.fn().mockReturnValue(false);
    return thrown(() => makeController({ suggestions: { clearBucketVisit } }).clearBucketVisit(user, '4')).then((r) =>
      expect(r).toEqual({ status: 404, body: { error: 'Bucket-list entry not found' } }));
  });

  it('DAWARICH-CTRL-076: DELETE bucket-list/:itemId/visit answers 200 { success: true } when a tick was cleared', () => {
    // The counterpart to 046: the service reports whether a row changed, and
    // only the "nothing changed" answer is a 404. A cleared tick must not come
    // back as one, or undoing a wish would look like it failed.
    const clearBucketVisit = vi.fn().mockReturnValue(true);
    expect(makeController({ suggestions: { clearBucketVisit } }).clearBucketVisit(user, '4')).toEqual({
      success: true,
    });
    expect(clearBucketVisit).toHaveBeenCalledWith(7, 4);
  });

  it('DAWARICH-CTRL-047: POST atlas/accept wraps the marked count', () => {
    const acceptAtlasCountries = vi.fn().mockReturnValue(2);
    expect(makeController({ suggestions: { acceptAtlasCountries } })
      .acceptAtlasCountries(user, { countryCodes: ['DE', 'FR'] })).toEqual({ marked: 2 });
    expect(acceptAtlasCountries).toHaveBeenCalledWith(7, ['DE', 'FR']);
  });

  it('DAWARICH-CTRL-048: POST bucket-list/scan returns the scan untouched', async () => {
    const scan = { items: [], connected: true };
    const scanBucketList = vi.fn().mockResolvedValue(scan);
    await expect(makeController({ suggestions: { scanBucketList } }).scanBucketList(user)).resolves.toBe(scan);
    expect(scanBucketList).toHaveBeenCalledWith(7);
  });
});

// ---------------------------------------------------------------------------
// toHttp — the one place a domain error becomes a status
// ---------------------------------------------------------------------------

describe('DawarichController error shaping', () => {
  it('DAWARICH-CTRL-050: an AcceptError keeps the 404 the domain chose', () => {
    const accept = vi.fn(() => { throw new AcceptError('not_found', 'Suggestion not found', 404); });
    return thrown(() => makeController({ suggestions: { accept } })
      .acceptSuggestion(user, '9', { target: 'place' }, makeReq())).then((r) =>
      expect(r).toEqual({ status: 404, body: { error: 'Suggestion not found', code: 'not_found' } }));
  });

  it('DAWARICH-CTRL-051: an AcceptError keeps a 409 too — the status travels with the error, it is not re-derived here', () => {
    const accept = vi.fn(() => { throw new AcceptError('already_accepted', 'Suggestion has already been accepted', 409); });
    return thrown(() => makeController({ suggestions: { accept } })
      .acceptSuggestion(user, '9', { target: 'place' }, makeReq())).then((r) =>
      expect(r).toEqual({ status: 409, body: { error: 'Suggestion has already been accepted', code: 'already_accepted' } }));
  });

  it('DAWARICH-CTRL-052: an AcceptError keeps a 400 (a day that is not on the trip)', () => {
    const accept = vi.fn(() => { throw new AcceptError('day_not_on_trip', 'Day does not belong to this trip', 400); });
    return thrown(() => makeController({ suggestions: { accept } })
      .acceptSuggestion(user, '9', { target: 'place', dayId: 4 }, makeReq())).then((r) =>
      expect(r).toEqual({ status: 400, body: { error: 'Day does not belong to this trip', code: 'day_not_on_trip' } }));
  });

  const upstreamCodes: DawarichErrorCode[] = [
    'unreachable',
    'not_found',
    'rate_limited',
    'server_error',
    'invalid_response',
    'too_large',
    'not_connected',
  ];

  it.each(upstreamCodes)(
    'DAWARICH-CTRL-053: a DawarichError with code %s becomes a 502 — the failure is a server TREK called, not TREK itself',
    async (code) => {
      const scanBucketList = vi.fn().mockRejectedValue(new DawarichError(code, 'upstream said no'));
      expect(await thrown(() => makeController({ suggestions: { scanBucketList } }).scanBucketList(user)))
        .toEqual({ status: 502, body: { error: 'upstream said no', code } });
    },
  );

  const callerCodes: DawarichErrorCode[] = ['unauthorized', 'forbidden'];

  it.each(callerCodes)(
    "DAWARICH-CTRL-054: a DawarichError with code %s becomes a 400 — a rejected key is the caller's to fix, not a gateway fault",
    async (code) => {
      const scanBucketList = vi.fn().mockRejectedValue(new DawarichError(code, 'key rejected', 401));
      expect(await thrown(() => makeController({ suggestions: { scanBucketList } }).scanBucketList(user)))
        .toEqual({ status: 400, body: { error: 'key rejected', code } });
    },
  );

  it('DAWARICH-CTRL-055: the code reaches the client for i18n, and `detail` rides along only when there is one', async () => {
    const scanBucketList = vi.fn().mockRejectedValue(
      new DawarichError('invalid_response', 'Unexpected response', 200, '<html>login</html>'),
    );
    expect(await thrown(() => makeController({ suggestions: { scanBucketList } }).scanBucketList(user)))
      .toEqual({ status: 502, body: { error: 'Unexpected response', code: 'invalid_response', detail: '<html>login</html>' } });
  });

  it('DAWARICH-CTRL-056: an HttpException raised inside the guarded call passes through untouched', async () => {
    const forTrip = vi.fn().mockRejectedValue(new HttpException({ error: 'Trip not found' }, 404));
    expect(await thrown(() => makeController({ tracks: { forTrip } }).tripTrack(user, '3')))
      .toEqual({ status: 404, body: { error: 'Trip not found' } });
  });

  it('DAWARICH-CTRL-057: anything else becomes a generic 502 rather than leaking the message', async () => {
    const atlasSuggestions = vi.fn().mockRejectedValue(new Error('ECONNRESET on /api/v1/visits?api_key=secret'));
    expect(await thrown(() => makeController({ suggestions: { atlasSuggestions } })
      .atlasSuggestions(user, '2026-01-01T00:00:00Z', '2026-01-05T00:00:00Z')))
      .toEqual({ status: 502, body: { error: 'Dawarich request failed', code: 'server_error' } });
  });

  it('DAWARICH-CTRL-058: the synchronous guard shapes a throw from accept exactly as the async one does', () => {
    const accept = vi.fn(() => { throw new DawarichError('unauthorized', 'key rejected'); });
    return thrown(() => makeController({ suggestions: { accept } })
      .acceptSuggestion(user, '9', { target: 'place' }, makeReq())).then((r) =>
      expect(r).toEqual({ status: 400, body: { error: 'key rejected', code: 'unauthorized' } }));
  });
});

// ---------------------------------------------------------------------------
// parseWindow — the explicit instant range
// ---------------------------------------------------------------------------

describe('DawarichController parseWindow', () => {
  const halfOpen: Array<[string | undefined, string | undefined]> = [
    [undefined, undefined],
    ['2026-01-01T00:00:00Z', undefined],
    [undefined, '2026-01-05T00:00:00Z'],
    ['', '2026-01-05T00:00:00Z'],
    ['2026-01-01T00:00:00Z', ''],
    ['nonsense', '2026-01-05T00:00:00Z'],
    ['2026-01-01T00:00:00Z', 'nonsense'],
  ];

  it.each(halfOpen)(
    'DAWARICH-CTRL-060: GET atlas/suggestions refuses the window (%j, %j) with 400 — one open end is "everything since the epoch"',
    async (from, to) => {
      const atlasSuggestions = vi.fn();
      expect(await thrown(() => makeController({ suggestions: { atlasSuggestions } }).atlasSuggestions(user, from, to)))
        .toEqual({ status: 400, body: { error: 'from and to are required ISO timestamps' } });
      expect(atlasSuggestions).not.toHaveBeenCalled();
    },
  );

  it.each(halfOpen)('DAWARICH-CTRL-061: GET track refuses the window (%j, %j) with 400', async (from, to) => {
    const forWindow = vi.fn();
    expect(await thrown(() => makeController({ tracks: { forWindow } }).windowTrack(user, from, to)))
      .toEqual({ status: 400, body: { error: 'from and to are required ISO timestamps' } });
    expect(forWindow).not.toHaveBeenCalled();
  });

  it('DAWARICH-CTRL-062: an inverted window is a 400', async () => {
    expect(await thrown(() => makeController({ suggestions: { atlasSuggestions: vi.fn() } })
      .atlasSuggestions(user, '2026-02-01T00:00:00Z', '2026-01-01T00:00:00Z')))
      .toEqual({ status: 400, body: { error: 'to must be after from' } });
  });

  it('DAWARICH-CTRL-063: a zero-length window is a 400 — "after from", not "at or after"', async () => {
    expect(await thrown(() => makeController({ tracks: { forWindow: vi.fn() } })
      .windowTrack(user, '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z')))
      .toEqual({ status: 400, body: { error: 'to must be after from' } });
  });

  it('DAWARICH-CTRL-064: exactly 400 days is still allowed', async () => {
    const atlasSuggestions = vi.fn().mockResolvedValue({ countries: [] });
    const from = new Date('2026-01-01T00:00:00Z');
    const to = new Date(from.getTime() + 400 * 86_400_000);

    await makeController({ suggestions: { atlasSuggestions } }).atlasSuggestions(user, from.toISOString(), to.toISOString());

    expect(atlasSuggestions).toHaveBeenCalledWith(7, from, to);
  });

  it('DAWARICH-CTRL-065: one millisecond past 400 days is a 400, so nobody can ask an instance to time out', async () => {
    const atlasSuggestions = vi.fn();
    const from = new Date('2026-01-01T00:00:00Z');
    const to = new Date(from.getTime() + 400 * 86_400_000 + 1);

    expect(await thrown(() => makeController({ suggestions: { atlasSuggestions } })
      .atlasSuggestions(user, from.toISOString(), to.toISOString())))
      .toEqual({ status: 400, body: { error: 'Window must be 400 days or less' } });
    expect(atlasSuggestions).not.toHaveBeenCalled();
  });

  it('DAWARICH-CTRL-066: GET track normalises both ends to ISO before handing them on', async () => {
    const forWindow = vi.fn().mockResolvedValue({ days: [] });
    await makeController({ tracks: { forWindow } }).windowTrack(user, '2026-01-01T00:00:00+02:00', '2026-01-02T00:00:00+02:00');

    // The trailing 0 is the caller's UTC offset: absent means UTC, which is
    // what this endpoint grouped by before it asked.
    expect(forWindow).toHaveBeenCalledWith(7, '2025-12-31T22:00:00.000Z', '2026-01-01T22:00:00.000Z', 0);
  });
});

// ---------------------------------------------------------------------------
// parseDate — the trip-track narrowing
// ---------------------------------------------------------------------------

describe('DawarichController GET /trips/:tripId/track', () => {
  it('DAWARICH-CTRL-070: no narrowing means the service decides the window from the trip', async () => {
    const forTrip = vi.fn().mockResolvedValue({ days: [] });
    await makeController({ tracks: { forTrip } }).tripTrack(user, '5');
    expect(forTrip).toHaveBeenCalledWith(7, 5, undefined, undefined, 0);
  });

  it('DAWARICH-CTRL-071: an empty from/to is "no narrowing", not an empty date', async () => {
    const forTrip = vi.fn().mockResolvedValue({ days: [] });
    await makeController({ tracks: { forTrip } }).tripTrack(user, '5', '', '');
    expect(forTrip).toHaveBeenCalledWith(7, 5, undefined, undefined, 0);
  });

  it('DAWARICH-CTRL-072: YYYY-MM-DD passes through', async () => {
    const forTrip = vi.fn().mockResolvedValue({ days: [] });
    await makeController({ tracks: { forTrip } }).tripTrack(user, '5', '2026-05-01', '2026-05-03');
    expect(forTrip).toHaveBeenCalledWith(7, 5, '2026-05-01', '2026-05-03', 0);
  });

  it('DAWARICH-CTRL-074: the offset from the caller decides which day a point belongs to', async () => {
    const forTrip = vi.fn().mockResolvedValue({ days: [] });
    await makeController({ tracks: { forTrip } }).tripTrack(user, '5', undefined, undefined, '120');
    expect(forTrip).toHaveBeenCalledWith(7, 5, undefined, undefined, 120);
  });

  it.each([
    ['9999', 840],
    ['-9999', -720],
    ['not-a-number', 0],
    ['', 0],
    ['-210.9', -210],
  ])('DAWARICH-CTRL-075: the offset %j is bounded to the real world as %i', async (raw, expected) => {
    // A junk offset must not be able to shift a day by a week; the bounds are
    // the actual range of world offsets, -12h to +14h.
    const forTrip = vi.fn().mockResolvedValue({ days: [] });
    await makeController({ tracks: { forTrip } }).tripTrack(user, '5', undefined, undefined, raw);
    expect(forTrip).toHaveBeenCalledWith(7, 5, undefined, undefined, expected);
  });

  it.each(['2026-5-1', '01.05.2026', '2026-05-01T00:00:00Z', 'yesterday'])(
    'DAWARICH-CTRL-073: 400 on the non-ISO date %j',
    async (raw) => {
      const forTrip = vi.fn();
      expect(await thrown(() => makeController({ tracks: { forTrip } }).tripTrack(user, '5', raw)))
        .toEqual({ status: 400, body: { error: 'Dates must be ISO, YYYY-MM-DD' } });
      expect(forTrip).not.toHaveBeenCalled();
    },
  );

  it('DAWARICH-CTRL-077: a trip the caller cannot read is a 404 (the service says null, the controller says not found)', async () => {
    const forTrip = vi.fn().mockResolvedValue(null);
    expect(await thrown(() => makeController({ tracks: { forTrip } }).tripTrack(user, '5')))
      .toEqual({ status: 404, body: { error: 'Trip not found' } });
  });

  it('DAWARICH-CTRL-078: a track comes back untouched', async () => {
    const track = { days: [{ date: '2026-05-01', segments: [] }], truncated: false };
    const forTrip = vi.fn().mockResolvedValue(track);
    await expect(makeController({ tracks: { forTrip } }).tripTrack(user, '5')).resolves.toBe(track);
  });
});
