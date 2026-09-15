import {
  DAWARICH_BUCKET_MATCH_MIN_MINUTES,
  DAWARICH_BUCKET_MATCH_RADIUS_M,
  DAWARICH_BUCKET_SCAN_LIMIT,
  DAWARICH_ERROR_CODES,
  DAWARICH_KEY_MASK,
  DAWARICH_SUGGESTION_STATES,
  DAWARICH_SUGGESTION_TARGETS,
  DAWARICH_SYNC_LOOKAHEAD_DAYS,
  DAWARICH_SYNC_LOOKBACK_DAYS,
  DAWARICH_SYNC_STATES,
  DAWARICH_TRACK_POINTS_PER_DAY,
  DAWARICH_VISIT_STATUSES,
  dawarichAcceptResultSchema,
  dawarichAcceptSchema,
  dawarichAtlasAcceptSchema,
  dawarichAtlasCountrySchema,
  dawarichAtlasSuggestionsSchema,
  dawarichBucketConfirmSchema,
  dawarichBucketMatchSchema,
  dawarichBucketScanSchema,
  dawarichCapabilitiesSchema,
  dawarichConnectionSchema,
  dawarichErrorCodeSchema,
  dawarichSettingsSchema,
  dawarichStatusSchema,
  dawarichSuggestionListSchema,
  dawarichSuggestionSchema,
  dawarichSuggestionStateSchema,
  dawarichSuggestionStateSchemaBody,
  dawarichSuggestionTargetSchema,
  dawarichSyncStateSchema,
  dawarichTrackDaySchema,
  dawarichTrackSchema,
  dawarichTrackSegmentSchema,
  dawarichVisitStatusSchema,
} from './dawarich.schema';

import { describe, expect, it } from 'vitest';

/**
 * DAWARICH-SCHEMA-001..043: the Dawarich contracts.
 *
 * This is the layer both sides of the integration agree on, and the feature is
 * built out of things that are deliberately lenient in one place and
 * deliberately strict in another. Pinning it here is what stops the two drifting:
 *
 *  - **the two settings defaults are load-bearing.** `saveSettings` writes
 *    `allow_insecure_tls` and `sync_enabled` into the row on every save, taking
 *    whatever the DTO handed it. If `syncEnabled` stopped defaulting to true, a
 *    user who saved their URL without touching the toggle would silently get no
 *    background sync; if `allowInsecureTls` stopped defaulting to false, the
 *    opposite and worse. A string `'true'` off a form must not enable either,
 *    which is why the boolean-ness is asserted rather than assumed.
 *  - **the mask has to survive a round trip.** The server hands out
 *    `DAWARICH_KEY_MASK` in place of the key and the settings form posts back
 *    what it was given, so if the mask stopped validating as an `apiKey`, saving
 *    an unchanged connection would 400.
 *  - **the capability probe has no defaults on purpose.** Every flag is
 *    required, so a probe that half-answered cannot arrive looking like an
 *    instance that simply lacks the endpoints. That distinction is the point of
 *    the probe, and a defaulted `false` would quietly drop the track overlay.
 *  - **`confidenceBand` is a string where an enum is the obvious choice.** A
 *    later Dawarich inventing a fourth band must not fail the whole suggestion
 *    row, so the looseness is a decision and is pinned as one.
 *  - **the error codes are a closed list** because the client renders them
 *    through i18n; a code nobody translated reaches the user as a raw key.
 *
 * Everything here is schema behaviour only. The cross-field rules the comments
 * describe ("required for place / journal / bucket_list") are not enforced here
 * and must not be: the accept route falls back to the suggestion's own trip,
 * matched bucket entry and recorded times, then rejects what is left with an
 * `AcceptError` carrying a status. That half lives in the service and its tests.
 */

/** A fully answered probe of a 1.14.4 instance: the two youngest fields are absent upstream. */
const capabilities = {
  visits: true,
  tracks: true,
  points: true,
  locations: true,
  visitedCities: true,
  visitUpdatedAt: false,
  visitCountryCode: false,
  serverVersion: '1.14.4',
  probedAt: '2026-09-01T10:00:00.000Z',
};

/** A stay as it arrives for review: seen once, accepted into nothing yet. */
const suggestion = {
  id: 12,
  sourceVisitId: '904',
  tripId: 3,
  tripTitle: 'Norway',
  name: 'Bryggen',
  lat: 60.3971,
  lng: 5.3245,
  startedAt: '2026-06-02T09:10:00+02:00',
  endedAt: '2026-06-02T11:40:00+02:00',
  durationMinutes: 150,
  localDate: '2026-06-02',
  sourceStatus: 'suggested',
  confidence: 82,
  confidenceBand: 'high',
  state: 'new',
  target: null,
  acceptedPlaceId: null,
  acceptedJournalEntryId: null,
  acceptedBucketListItemId: null,
  sourceChanged: false,
  sourceMissing: false,
  matchedBucketListItemId: null,
  matchedBucketListName: null,
  countryCode: 'NO',
  firstSeenAt: '2026-06-02T12:00:00.000Z',
  lastSeenAt: '2026-06-03T12:00:00.000Z',
};

describe('dawarichSettingsSchema', () => {
  it('DAWARICH-SCHEMA-001 fills the two flags the save path writes unconditionally', () => {
    const filled = dawarichSettingsSchema.parse({ url: 'https://dawarich.example.com' });
    expect(filled.allowInsecureTls).toBe(false);
    expect(filled.syncEnabled).toBe(true);
    expect(filled.apiKey).toBeUndefined();

    // An explicit undefined is the same as an absent key, which is what a form
    // that clears a field before posting actually sends.
    const explicit = dawarichSettingsSchema.parse({
      url: 'https://dawarich.example.com',
      allowInsecureTls: undefined,
      syncEnabled: undefined,
    });
    expect(explicit.allowInsecureTls).toBe(false);
    expect(explicit.syncEnabled).toBe(true);

    const chosen = dawarichSettingsSchema.parse({
      url: 'https://dawarich.example.com',
      allowInsecureTls: true,
      syncEnabled: false,
    });
    expect(chosen.allowInsecureTls).toBe(true);
    expect(chosen.syncEnabled).toBe(false);
  });

  it('DAWARICH-SCHEMA-002 trims the url and accepts an empty one, because clearing it is how you disconnect', () => {
    expect(dawarichSettingsSchema.parse({ url: '  https://dawarich.example.com  ' }).url).toBe(
      'https://dawarich.example.com',
    );
    expect(dawarichSettingsSchema.safeParse({ url: '' }).success).toBe(true);
    // Not a URL type on purpose: the service runs the address through the SSRF
    // guard, which is the only check that can say whether it could ever work.
    expect(dawarichSettingsSchema.safeParse({ url: 'not a url' }).success).toBe(true);
    expect(dawarichSettingsSchema.safeParse({}).success).toBe(false);
    expect(dawarichSettingsSchema.safeParse({ url: 123 }).success).toBe(false);
  });

  it('DAWARICH-SCHEMA-003 caps the address at 2048 and the key at 512', () => {
    expect(dawarichSettingsSchema.safeParse({ url: 'h'.repeat(2048) }).success).toBe(true);
    expect(dawarichSettingsSchema.safeParse({ url: 'h'.repeat(2049) }).success).toBe(false);
    expect(dawarichSettingsSchema.safeParse({ url: 'https://d.example', apiKey: 'k'.repeat(512) }).success).toBe(true);
    expect(dawarichSettingsSchema.safeParse({ url: 'https://d.example', apiKey: 'k'.repeat(513) }).success).toBe(false);
    // A blank key means "keep the stored one" and has to reach the service to say so.
    expect(dawarichSettingsSchema.safeParse({ url: 'https://d.example', apiKey: '' }).success).toBe(true);
  });

  it('DAWARICH-SCHEMA-004 keeps the flags boolean and drops what it was not asked about', () => {
    const url = 'https://dawarich.example.com';
    // A form posting the string 'true' must not be able to turn off certificate
    // checking; coercion here would make that a one-character mistake.
    expect(dawarichSettingsSchema.safeParse({ url, allowInsecureTls: 'true' }).success).toBe(false);
    expect(dawarichSettingsSchema.safeParse({ url, syncEnabled: 1 }).success).toBe(false);
    expect(dawarichSettingsSchema.safeParse({ url, allowInsecureTls: null }).success).toBe(false);

    const parsed = dawarichSettingsSchema.parse({ url, userId: 4, apiKey: 'secret' });
    expect(parsed).toEqual({ url, apiKey: 'secret', allowInsecureTls: false, syncEnabled: true });
  });

  it('DAWARICH-SCHEMA-005 accepts its own mask back, so re-saving an untouched connection works', () => {
    expect(DAWARICH_KEY_MASK.length).toBeGreaterThan(0);
    const parsed = dawarichSettingsSchema.safeParse({ url: 'https://d.example', apiKey: DAWARICH_KEY_MASK });
    expect(parsed.success).toBe(true);
  });

  it('DAWARICH-SCHEMA-040 uses a mask nobody could type, because the save path decides by equality', () => {
    // `saveSettings` keeps the stored key whenever the posted one is equal to the
    // mask. A mask made of characters a person could plausibly type would turn
    // that into a trap: typing it would silently keep the old key rather than
    // save the new one, and the user would see a saved form and a dead connection.
    expect(DAWARICH_KEY_MASK).not.toMatch(/[A-Za-z0-9]/);
    // It also has to fit back through the field it is handed out in.
    expect(DAWARICH_KEY_MASK.length).toBeLessThanOrEqual(512);
  });
});

describe('dawarichCapabilitiesSchema', () => {
  it('DAWARICH-SCHEMA-006 demands an answer for every probe, so half a probe cannot read as "not supported"', () => {
    expect(dawarichCapabilitiesSchema.safeParse(capabilities).success).toBe(true);

    const keys = Object.keys(capabilities);
    const withoutEach = keys.map((key) => {
      const partial: Record<string, unknown> = { ...capabilities };
      delete partial[key];
      return `${key}:${dawarichCapabilitiesSchema.safeParse(partial).success}`;
    });
    expect(withoutEach).toEqual(keys.map((key) => `${key}:false`));
  });

  it('DAWARICH-SCHEMA-007 lets the version be unknown but never the probe time', () => {
    // The version comes from a response header the instance may not send.
    expect(dawarichCapabilitiesSchema.safeParse({ ...capabilities, serverVersion: null }).success).toBe(true);
    expect(dawarichCapabilitiesSchema.safeParse({ ...capabilities, probedAt: null }).success).toBe(false);
    expect(dawarichCapabilitiesSchema.safeParse({ ...capabilities, visits: 1 }).success).toBe(false);
    expect(dawarichCapabilitiesSchema.safeParse({ ...capabilities, serverVersion: 1.14 }).success).toBe(false);
  });
});

describe('the closed vocabularies', () => {
  it('DAWARICH-SCHEMA-008 the connection card knows exactly four sync states', () => {
    expect(DAWARICH_SYNC_STATES).toEqual(['never', 'ok', 'partial', 'failed']);
    expect(DAWARICH_SYNC_STATES.every((state) => dawarichSyncStateSchema.safeParse(state).success)).toBe(true);
    expect(dawarichSyncStateSchema.safeParse('pending').success).toBe(false);
    expect(dawarichSyncStateSchema.safeParse('').success).toBe(false);
  });

  it('DAWARICH-SCHEMA-009 the error codes are closed because the client translates them', () => {
    expect(DAWARICH_ERROR_CODES).toEqual([
      'unreachable',
      'unauthorized',
      'forbidden',
      'not_found',
      'rate_limited',
      'server_error',
      'invalid_response',
      'too_large',
      'not_connected',
      'addon_disabled',
    ]);
    expect(DAWARICH_ERROR_CODES.every((code) => dawarichErrorCodeSchema.safeParse(code).success)).toBe(true);
    // A new code would reach the user as a raw i18n key, so it has to be added here first.
    expect(dawarichErrorCodeSchema.safeParse('timeout').success).toBe(false);
  });

  it('DAWARICH-SCHEMA-010 an unconfirmed visit is still a visit', () => {
    // Importing only `confirmed` leaves most instances looking empty, which is
    // the failure mode the Dawarich maintainer warned about. Since 1.12.0 a
    // declined visit is deleted upstream, so there is no third status to carry.
    expect(DAWARICH_VISIT_STATUSES).toEqual(['suggested', 'confirmed']);
    expect(dawarichVisitStatusSchema.safeParse('suggested').success).toBe(true);
    expect(dawarichVisitStatusSchema.safeParse('confirmed').success).toBe(true);
    expect(dawarichVisitStatusSchema.safeParse('declined').success).toBe(false);
  });

  it('DAWARICH-SCHEMA-011 TREK tracks its own three states and three accept targets', () => {
    expect(DAWARICH_SUGGESTION_STATES).toEqual(['new', 'accepted', 'dismissed']);
    expect(DAWARICH_SUGGESTION_TARGETS).toEqual(['place', 'journal', 'bucket_list']);
    expect(dawarichSuggestionStateSchema.safeParse('accepted').success).toBe(true);
    expect(dawarichSuggestionStateSchema.safeParse('archived').success).toBe(false);
    expect(dawarichSuggestionTargetSchema.safeParse('bucket_list').success).toBe(true);
    expect(dawarichSuggestionTargetSchema.safeParse('trip').success).toBe(false);
  });
});

describe('dawarichConnectionSchema', () => {
  const connection = {
    url: 'https://dawarich.example.com',
    apiKeyMasked: DAWARICH_KEY_MASK,
    allowInsecureTls: false,
    syncEnabled: true,
    connected: true,
    lastSyncAt: null,
    lastSyncState: 'never',
    lastSyncError: null,
    capabilities: null,
  };

  it('DAWARICH-SCHEMA-012 describes a connection that has never synced and one that has', () => {
    expect(dawarichConnectionSchema.safeParse(connection).success).toBe(true);
    // No key stored yet: the mask field is empty rather than absent, so the form
    // can tell "nothing saved" from "saved and hidden".
    const blank = dawarichConnectionSchema.safeParse({ ...connection, apiKeyMasked: '', connected: false });
    expect(blank.success).toBe(true);
    expect(
      dawarichConnectionSchema.safeParse({
        ...connection,
        lastSyncAt: '2026-09-01T10:05:00.000Z',
        lastSyncState: 'partial',
        lastSyncError: 'rate_limited',
        capabilities,
      }).success,
    ).toBe(true);
  });

  it('DAWARICH-SCHEMA-013 refuses a state the card cannot render and a missing flag', () => {
    expect(dawarichConnectionSchema.safeParse({ ...connection, lastSyncState: 'unknown' }).success).toBe(false);
    const { connected: _connected, ...withoutConnected } = connection;
    expect(dawarichConnectionSchema.safeParse(withoutConnected).success).toBe(false);
    // Nullable, not optional: "never synced" is a value, not an absence.
    const { lastSyncAt: _lastSyncAt, ...withoutLastSync } = connection;
    expect(dawarichConnectionSchema.safeParse(withoutLastSync).success).toBe(false);
  });

  it('DAWARICH-SCHEMA-041 has no slot for the raw key and drops one that is offered anyway', () => {
    // The card is the one response that is built next to the stored credential,
    // and the contract is what says the credential has no way out: there is a
    // masked field and no unmasked one, and an object carrying `apiKey` loses it
    // in the parse rather than shipping it to the browser.
    const keys = Object.keys(dawarichConnectionSchema.shape);
    expect(keys).toContain('apiKeyMasked');
    expect(keys).not.toContain('apiKey');
    const parsed = dawarichConnectionSchema.parse({ ...connection, apiKey: 'dw_live_secret' });
    expect(Object.keys(parsed)).not.toContain('apiKey');
    expect(parsed.apiKeyMasked).toBe(DAWARICH_KEY_MASK);
  });
});

describe('dawarichStatusSchema', () => {
  it('DAWARICH-SCHEMA-014 is "connected" plus whatever the probe managed to learn', () => {
    expect(dawarichStatusSchema.safeParse({ connected: false }).success).toBe(true);
    expect(dawarichStatusSchema.safeParse({ connected: true, visitCount: 0, capabilities }).success).toBe(true);
    expect(
      dawarichStatusSchema.safeParse({
        connected: false,
        error: 'unauthorized',
        errorDetail: 'API key rejected by https://dawarich.example.com',
      }).success,
    ).toBe(true);
  });

  it('DAWARICH-SCHEMA-015 will not carry an untranslatable error or a stringified count', () => {
    expect(dawarichStatusSchema.safeParse({ connected: false, error: 'bad_key' }).success).toBe(false);
    expect(dawarichStatusSchema.safeParse({ connected: true, visitCount: '3' }).success).toBe(false);
    expect(dawarichStatusSchema.safeParse({}).success).toBe(false);
  });
});

describe('dawarichSuggestionSchema', () => {
  it('DAWARICH-SCHEMA-016 takes a fresh stay with every relation still empty', () => {
    expect(dawarichSuggestionSchema.safeParse(suggestion).success).toBe(true);
    expect(
      dawarichSuggestionSchema.safeParse({
        ...suggestion,
        tripId: null,
        tripTitle: null,
        lat: null,
        lng: null,
        countryCode: null,
      }).success,
    ).toBe(true);
    // An accepted stay points at exactly what it produced.
    expect(
      dawarichSuggestionSchema.safeParse({
        ...suggestion,
        state: 'accepted',
        target: 'place',
        acceptedPlaceId: 41,
      }).success,
    ).toBe(true);
  });

  it('DAWARICH-SCHEMA-017 every id is a row id or null, never a zero or a fraction', () => {
    expect(dawarichSuggestionSchema.safeParse({ ...suggestion, id: 0 }).success).toBe(false);
    expect(dawarichSuggestionSchema.safeParse({ ...suggestion, id: null }).success).toBe(false);
    expect(dawarichSuggestionSchema.safeParse({ ...suggestion, tripId: 0 }).success).toBe(false);
    expect(dawarichSuggestionSchema.safeParse({ ...suggestion, acceptedPlaceId: 1.5 }).success).toBe(false);
    expect(dawarichSuggestionSchema.safeParse({ ...suggestion, acceptedJournalEntryId: -1 }).success).toBe(false);
    expect(dawarichSuggestionSchema.safeParse({ ...suggestion, matchedBucketListItemId: 8 }).success).toBe(true);
    // Dawarich's own id stays a string: it is a foreign key into somebody else's
    // database and is never arithmetic here.
    expect(dawarichSuggestionSchema.safeParse({ ...suggestion, sourceVisitId: 904 }).success).toBe(false);
  });

  it('DAWARICH-SCHEMA-018 keeps the confidence band a plain string, so a future band survives', () => {
    const unscored = dawarichSuggestionSchema.safeParse({ ...suggestion, confidence: null, confidenceBand: null });
    expect(unscored.success).toBe(true);
    // If this were an enum, one unknown band from a newer Dawarich would drop the
    // whole row instead of one label.
    expect(dawarichSuggestionSchema.safeParse({ ...suggestion, confidenceBand: 'very_high' }).success).toBe(true);
    expect(dawarichSuggestionSchema.safeParse({ ...suggestion, confidence: '82' }).success).toBe(false);
  });

  it('DAWARICH-SCHEMA-019 requires both source flags, because absent must not read as unchanged', () => {
    const { sourceChanged: _changed, ...withoutChanged } = suggestion;
    const { sourceMissing: _missing, ...withoutMissing } = suggestion;
    expect(dawarichSuggestionSchema.safeParse(withoutChanged).success).toBe(false);
    expect(dawarichSuggestionSchema.safeParse(withoutMissing).success).toBe(false);
    const flagged = dawarichSuggestionSchema.safeParse({ ...suggestion, sourceChanged: true, sourceMissing: true });
    expect(flagged.success).toBe(true);
  });

  it('DAWARICH-SCHEMA-020 holds the two vocabularies apart: what Dawarich thinks, what TREK did', () => {
    expect(dawarichSuggestionSchema.safeParse({ ...suggestion, sourceStatus: 'declined' }).success).toBe(false);
    expect(dawarichSuggestionSchema.safeParse({ ...suggestion, state: 'dismissed' }).success).toBe(true);
    expect(dawarichSuggestionSchema.safeParse({ ...suggestion, state: 'suggested' }).success).toBe(false);
    expect(dawarichSuggestionSchema.safeParse({ ...suggestion, target: 'journal' }).success).toBe(true);
    expect(dawarichSuggestionSchema.safeParse({ ...suggestion, target: 'day' }).success).toBe(false);
  });

  it('DAWARICH-SCHEMA-042 checks a typed coordinate and a typed date, and a recorded one not at all', () => {
    // A recorded fix is what Dawarich reported. Range-checking it here would drop
    // the entire stay over one bad number instead of showing a pin in the wrong
    // place, which the user can see and correct. The accept body is user input and
    // is checked (SCHEMA-024 and SCHEMA-025 pin that half). The pair is the point:
    // "tidying up" the suggestion to match the request body is a silent data loss.
    expect(dawarichSuggestionSchema.safeParse({ ...suggestion, lat: 91, lng: 181 }).success).toBe(true);
    expect(dawarichAcceptSchema.safeParse({ target: 'place', lat: 91, lng: 181 }).success).toBe(false);
    expect(dawarichSuggestionSchema.safeParse({ ...suggestion, localDate: '02.06.2026' }).success).toBe(true);
    expect(dawarichAcceptSchema.safeParse({ target: 'place', date: '02.06.2026' }).success).toBe(false);
  });
});

describe('dawarichSuggestionListSchema', () => {
  it('DAWARICH-SCHEMA-021 ships the provenance with the rows, so a panel needs one request', () => {
    const list = {
      suggestions: [suggestion],
      connected: true,
      lastSyncAt: '2026-09-01T10:05:00.000Z',
      lastSyncState: 'ok',
      lastSyncError: null,
    };
    expect(dawarichSuggestionListSchema.safeParse(list).success).toBe(true);
    expect(dawarichSuggestionListSchema.safeParse({ ...list, suggestions: [] }).success).toBe(true);
    const neverSynced = dawarichSuggestionListSchema.safeParse({ ...list, lastSyncAt: null, lastSyncState: 'never' });
    expect(neverSynced.success).toBe(true);

    const { lastSyncState: _state, ...withoutState } = list;
    expect(dawarichSuggestionListSchema.safeParse(withoutState).success).toBe(false);
    // One bad row fails the response rather than being silently skipped.
    const withBadRow = dawarichSuggestionListSchema.safeParse({
      ...list,
      suggestions: [suggestion, { ...suggestion, id: 0 }],
    });
    expect(withBadRow.success).toBe(false);
  });
});

describe('dawarichAcceptSchema', () => {
  it('DAWARICH-SCHEMA-022 takes a target on its own, because every other field has a recorded fallback', () => {
    expect(dawarichAcceptSchema.safeParse({ target: 'place' }).success).toBe(true);
    expect(dawarichAcceptSchema.safeParse({ target: 'journal' }).success).toBe(true);
    expect(dawarichAcceptSchema.safeParse({ target: 'bucket_list' }).success).toBe(true);
    expect(dawarichAcceptSchema.safeParse({}).success).toBe(false);
    expect(dawarichAcceptSchema.safeParse({ target: 'trip' }).success).toBe(false);
  });

  it('DAWARICH-SCHEMA-023 makes the corrected name survive its own trim', () => {
    expect(dawarichAcceptSchema.parse({ target: 'place', name: '  Bryggen  ' }).name).toBe('Bryggen');
    // Whitespace is not a correction; without the trim it would overwrite the
    // detected name with nothing.
    expect(dawarichAcceptSchema.safeParse({ target: 'place', name: '   ' }).success).toBe(false);
    expect(dawarichAcceptSchema.safeParse({ target: 'place', name: '' }).success).toBe(false);
    expect(dawarichAcceptSchema.safeParse({ target: 'place', name: 'x'.repeat(255) }).success).toBe(true);
    expect(dawarichAcceptSchema.safeParse({ target: 'place', name: 'x'.repeat(256) }).success).toBe(false);
    expect(dawarichAcceptSchema.safeParse({ target: 'journal', notes: 'n'.repeat(5000) }).success).toBe(true);
    expect(dawarichAcceptSchema.safeParse({ target: 'journal', notes: 'n'.repeat(5001) }).success).toBe(false);
  });

  it('DAWARICH-SCHEMA-024 keeps a corrected pin on the planet, edges included', () => {
    expect(dawarichAcceptSchema.safeParse({ target: 'place', lat: 90, lng: 180 }).success).toBe(true);
    expect(dawarichAcceptSchema.safeParse({ target: 'place', lat: -90, lng: -180 }).success).toBe(true);
    expect(dawarichAcceptSchema.safeParse({ target: 'place', lat: 90.1, lng: 0 }).success).toBe(false);
    expect(dawarichAcceptSchema.safeParse({ target: 'place', lat: 0, lng: -180.1 }).success).toBe(false);
    expect(dawarichAcceptSchema.safeParse({ target: 'place', lat: '60', lng: 5 }).success).toBe(false);
  });

  it('DAWARICH-SCHEMA-025 checks the shape of the date and the two times, and only the shape', () => {
    expect(dawarichAcceptSchema.safeParse({ target: 'place', date: '2026-06-02' }).success).toBe(true);
    expect(dawarichAcceptSchema.safeParse({ target: 'place', date: '2026-6-2' }).success).toBe(false);
    expect(dawarichAcceptSchema.safeParse({ target: 'place', date: '02.06.2026' }).success).toBe(false);
    expect(dawarichAcceptSchema.safeParse({ target: 'place', time: '09:10', endTime: '11:40' }).success).toBe(true);
    expect(dawarichAcceptSchema.safeParse({ target: 'place', time: '9:10' }).success).toBe(false);
    expect(dawarichAcceptSchema.safeParse({ target: 'place', endTime: '11:40:00' }).success).toBe(false);
    // Pinned as it stands rather than as it should be: the pattern is a shape and
    // not a calendar, and `acceptAsPlace` writes `time` straight into the place
    // row. Tightening it is a contract change and should break this line on purpose.
    expect(dawarichAcceptSchema.safeParse({ target: 'place', date: '2026-13-45', time: '99:99' }).success).toBe(true);
  });

  it('DAWARICH-SCHEMA-026 will not carry an id that could not be a row', () => {
    expect(dawarichAcceptSchema.safeParse({ target: 'place', tripId: 3, dayId: 9 }).success).toBe(true);
    expect(dawarichAcceptSchema.safeParse({ target: 'place', tripId: 0 }).success).toBe(false);
    expect(dawarichAcceptSchema.safeParse({ target: 'place', dayId: -1 }).success).toBe(false);
    expect(dawarichAcceptSchema.safeParse({ target: 'journal', journalId: 1.5 }).success).toBe(false);
    expect(dawarichAcceptSchema.safeParse({ target: 'bucket_list', bucketListItemId: 0 }).success).toBe(false);
    expect(dawarichAcceptSchema.safeParse({ target: 'bucket_list', bucketListItemId: 8 }).success).toBe(true);
  });
});

describe('dawarichAcceptResultSchema and the re-review body', () => {
  it('DAWARICH-SCHEMA-027 answers with the updated row and exactly what was created', () => {
    const accepted = { ...suggestion, state: 'accepted', target: 'place', acceptedPlaceId: 41 };
    expect(
      dawarichAcceptResultSchema.safeParse({
        suggestion: accepted,
        createdPlaceId: 41,
        createdJournalEntryId: null,
        bucketListItemId: null,
      }).success,
    ).toBe(true);
    // Nullable, not optional: the caller navigates on these, so "nothing was
    // created here" has to be said rather than left out.
    const halfAnswer = dawarichAcceptResultSchema.safeParse({
      suggestion: accepted,
      createdPlaceId: 41,
      bucketListItemId: null,
    });
    expect(halfAnswer.success).toBe(false);
    expect(
      dawarichAcceptResultSchema.safeParse({
        suggestion: accepted,
        createdPlaceId: 0,
        createdJournalEntryId: null,
        bucketListItemId: null,
      }).success,
    ).toBe(false);
  });

  it('DAWARICH-SCHEMA-028 lets a client push a suggestion back to new or dismissed, and no further', () => {
    expect(dawarichSuggestionStateSchemaBody.safeParse({ state: 'new' }).success).toBe(true);
    expect(dawarichSuggestionStateSchemaBody.safeParse({ state: 'dismissed' }).success).toBe(true);
    // Accepting creates a place, a journal entry or a tick. It cannot be done by
    // writing a word into a state field.
    expect(dawarichSuggestionStateSchemaBody.safeParse({ state: 'accepted' }).success).toBe(false);
    expect(dawarichSuggestionStateSchemaBody.safeParse({}).success).toBe(false);
  });

  it('DAWARICH-SCHEMA-043 keeps the re-review body a strict subset of the states TREK tracks', () => {
    // The body spells its two words out instead of deriving them from
    // DAWARICH_SUGGESTION_STATES, so nothing but this makes the two move together:
    // renaming a state would leave a route still accepting a word that no longer
    // exists, and adding a fourth one would leave it unreachable without anybody
    // deciding that it should be.
    const reviewable = DAWARICH_SUGGESTION_STATES.filter((state) => state !== 'accepted');
    expect(reviewable).toEqual(['new', 'dismissed']);
    expect(reviewable.every((state) => dawarichSuggestionStateSchemaBody.safeParse({ state }).success)).toBe(true);
    expect(reviewable.every((state) => dawarichSuggestionStateSchema.safeParse(state).success)).toBe(true);
  });
});

describe('the track overlay', () => {
  const segment = {
    points: [
      [60.3971, 5.3245],
      [60.3988, 5.3301],
    ],
    mode: 'walking',
    startedAt: '2026-06-02T09:10:00+02:00',
    endedAt: '2026-06-02T09:40:00+02:00',
    distanceMeters: 1420,
  };

  it('DAWARICH-SCHEMA-029 is [lat, lng] pairs and nothing wider', () => {
    expect(dawarichTrackSegmentSchema.safeParse(segment).success).toBe(true);
    // A third element would be read as a coordinate by everything downstream,
    // which stores pairs; an altitude has to be dropped upstream, not smuggled in.
    expect(dawarichTrackSegmentSchema.safeParse({ ...segment, points: [[60.39, 5.32, 12]] }).success).toBe(false);
    expect(dawarichTrackSegmentSchema.safeParse({ ...segment, points: [[60.39]] }).success).toBe(false);
    expect(dawarichTrackSegmentSchema.safeParse({ ...segment, points: [['60.39', '5.32']] }).success).toBe(false);
    // An empty segment is legal: a day with a gap in the recording still has the day.
    expect(dawarichTrackSegmentSchema.safeParse({ ...segment, points: [] }).success).toBe(true);
  });

  it('DAWARICH-SCHEMA-030 passes the mode through untranslated, or null on an older instance', () => {
    // Dawarich has `stationary`, TREK has `ferry`. Mapping one onto the other
    // would put a confident wrong label on a recorded fact, so the string travels
    // as it came and an unknown value is not a reason to reject the segment.
    expect(dawarichTrackSegmentSchema.safeParse({ ...segment, mode: 'stationary' }).success).toBe(true);
    expect(dawarichTrackSegmentSchema.safeParse({ ...segment, mode: null, distanceMeters: null }).success).toBe(true);
    const { mode: _mode, ...withoutMode } = segment;
    expect(dawarichTrackSegmentSchema.safeParse(withoutMode).success).toBe(false);
  });

  it('DAWARICH-SCHEMA-031 groups segments under one local calendar day', () => {
    expect(dawarichTrackDaySchema.safeParse({ date: '2026-06-02', segments: [segment] }).success).toBe(true);
    expect(dawarichTrackDaySchema.safeParse({ date: '2026-06-02', segments: [] }).success).toBe(true);
    expect(dawarichTrackDaySchema.safeParse({ date: '2026-06-02' }).success).toBe(false);
    const brokenSegment = dawarichTrackDaySchema.safeParse({
      date: '2026-06-02',
      segments: [{ ...segment, points: 'x' }],
    });
    expect(brokenSegment.success).toBe(false);
  });

  it('DAWARICH-SCHEMA-032 names the endpoint that answered and admits when the line is cut short', () => {
    const track = {
      days: [{ date: '2026-06-02', segments: [segment] }],
      source: 'tracks',
      fetchedAt: '2026-09-01T10:05:00.000Z',
      pointCount: 2,
      truncated: false,
    };
    expect(dawarichTrackSchema.safeParse(track).success).toBe(true);
    expect(dawarichTrackSchema.safeParse({ ...track, source: 'points', truncated: true }).success).toBe(true);
    expect(dawarichTrackSchema.safeParse({ ...track, source: 'gpx' }).success).toBe(false);
    // Required, not defaulted: an incomplete line that forgot to say so is drawn
    // as if it were the whole route.
    const { truncated: _truncated, ...withoutTruncated } = track;
    expect(dawarichTrackSchema.safeParse(withoutTruncated).success).toBe(false);
    // A window with no recordings is an answer, not an error.
    expect(dawarichTrackSchema.safeParse({ ...track, days: [], pointCount: 0 }).success).toBe(true);
  });
});

describe('the atlas contracts', () => {
  const country = {
    countryCode: 'NO',
    sourceName: 'Norway',
    cities: [{ name: 'Bergen', minutes: 2400, lastSeenAt: '2026-06-04T18:00:00Z' }],
    alreadyVisited: false,
  };

  it('DAWARICH-SCHEMA-033 keeps the source spelling and lets a city have no last sighting', () => {
    expect(dawarichAtlasCountrySchema.safeParse(country).success).toBe(true);
    expect(
      dawarichAtlasCountrySchema.safeParse({
        ...country,
        cities: [{ name: 'Bergen', minutes: 2400, lastSeenAt: null }],
        alreadyVisited: true,
      }).success,
    ).toBe(true);
    expect(dawarichAtlasCountrySchema.safeParse({ ...country, cities: [] }).success).toBe(true);
    // Nullable and not optional on purpose: a city stamped 1970-01-01 looks like
    // data and is not.
    const undated = dawarichAtlasCountrySchema.safeParse({
      ...country,
      cities: [{ name: 'Bergen', minutes: 2400 }],
    });
    expect(undated.success).toBe(false);
    const stringMinutes = dawarichAtlasCountrySchema.safeParse({
      ...country,
      cities: [{ name: 'Bergen', minutes: '2400', lastSeenAt: null }],
    });
    expect(stringMinutes.success).toBe(false);
  });

  it('DAWARICH-SCHEMA-034 names the countries it could not resolve instead of dropping them', () => {
    expect(
      dawarichAtlasSuggestionsSchema.safeParse({
        countries: [country],
        unresolved: ['Kosovo'],
        fetchedAt: '2026-09-01T10:05:00.000Z',
      }).success,
    ).toBe(true);
    const empty = dawarichAtlasSuggestionsSchema.safeParse({
      countries: [],
      unresolved: [],
      fetchedAt: '2026-09-01T10:05:00.000Z',
    });
    expect(empty.success).toBe(true);
    expect(dawarichAtlasSuggestionsSchema.safeParse({ countries: [country], unresolved: ['Kosovo'] }).success).toBe(
      false,
    );
  });

  it('DAWARICH-SCHEMA-035 accepts between one and three hundred alpha-2 codes', () => {
    expect(dawarichAtlasAcceptSchema.safeParse({ countryCodes: ['NO', 'SE'] }).success).toBe(true);
    // Nothing to accept is a client bug, not an empty write.
    expect(dawarichAtlasAcceptSchema.safeParse({ countryCodes: [] }).success).toBe(false);
    const atCap = dawarichAtlasAcceptSchema.safeParse({ countryCodes: Array.from({ length: 300 }, () => 'NO') });
    expect(atCap.success).toBe(true);
    const overCap = dawarichAtlasAcceptSchema.safeParse({ countryCodes: Array.from({ length: 301 }, () => 'NO') });
    expect(overCap.success).toBe(false);
    // Alpha-2 and nothing else: the Atlas keys its countries on exactly two letters.
    expect(dawarichAtlasAcceptSchema.safeParse({ countryCodes: ['NOR'] }).success).toBe(false);
    expect(dawarichAtlasAcceptSchema.safeParse({ countryCodes: ['n'] }).success).toBe(false);
  });
});

describe('the bucket-list contracts', () => {
  const match = {
    itemId: 5,
    name: 'See the Northern Lights',
    match: { at: '2026-06-02T22:10:00+02:00', minutes: 95, distanceMeters: 120, points: 34 },
    alreadyVisited: false,
  };

  it('DAWARICH-SCHEMA-036 reports both numbers that justify a match, or no match at all', () => {
    expect(dawarichBucketMatchSchema.safeParse(match).success).toBe(true);
    expect(dawarichBucketMatchSchema.safeParse({ ...match, match: null, alreadyVisited: true }).success).toBe(true);
    // Proximity alone is not a visit, so neither number may go missing: the user
    // is meant to judge the call, and half the evidence is not a judgement.
    const withoutDistance = dawarichBucketMatchSchema.safeParse({
      ...match,
      match: { at: '2026-06-02T22:10:00+02:00', minutes: 95, points: 34 },
    });
    expect(withoutDistance.success).toBe(false);
    const withoutMinutes = dawarichBucketMatchSchema.safeParse({
      ...match,
      match: { at: '2026-06-02T22:10:00+02:00', distanceMeters: 120, points: 34 },
    });
    expect(withoutMinutes.success).toBe(false);
    expect(dawarichBucketMatchSchema.safeParse({ ...match, itemId: 0 }).success).toBe(false);
  });

  it('DAWARICH-SCHEMA-037 says out loud what the scan skipped and where it stopped', () => {
    const scan = {
      matches: [match],
      skippedWithoutCoordinates: 2,
      truncated: true,
      fetchedAt: '2026-09-01T10:05:00.000Z',
    };
    expect(dawarichBucketScanSchema.safeParse(scan).success).toBe(true);
    const clean = dawarichBucketScanSchema.safeParse({ ...scan, matches: [], skippedWithoutCoordinates: 0 });
    expect(clean.success).toBe(true);
    const { truncated: _truncated, ...withoutTruncated } = scan;
    expect(dawarichBucketScanSchema.safeParse(withoutTruncated).success).toBe(false);
    const { skippedWithoutCoordinates: _skipped, ...withoutSkipped } = scan;
    expect(dawarichBucketScanSchema.safeParse(withoutSkipped).success).toBe(false);
  });

  it('DAWARICH-SCHEMA-038 confirms between one and two hundred entries, dated or not', () => {
    expect(dawarichBucketConfirmSchema.safeParse({ itemIds: [5] }).success).toBe(true);
    const dated = dawarichBucketConfirmSchema.safeParse({ itemIds: [5, 6], visitedAt: '2026-06-02T22:10:00+02:00' });
    expect(dated.success).toBe(true);
    expect(dawarichBucketConfirmSchema.safeParse({ itemIds: [] }).success).toBe(false);
    expect(dawarichBucketConfirmSchema.safeParse({ itemIds: [0] }).success).toBe(false);
    const atCap = dawarichBucketConfirmSchema.safeParse({ itemIds: Array.from({ length: 200 }, () => 5) });
    expect(atCap.success).toBe(true);
    const overCap = dawarichBucketConfirmSchema.safeParse({ itemIds: Array.from({ length: 201 }, () => 5) });
    expect(overCap.success).toBe(false);
  });
});

describe('the tuning numbers', () => {
  it('DAWARICH-SCHEMA-039 pins what TREK calls "being somewhere"', () => {
    // These decide whether a wish counts as fulfilled and how much of a month-long
    // trip stays drawable. They live in the contract so the server, the help text
    // and these tests cannot disagree; changing one is a product decision.
    expect(DAWARICH_BUCKET_MATCH_RADIUS_M).toBe(250);
    expect(DAWARICH_BUCKET_MATCH_MIN_MINUTES).toBe(20);
    expect(DAWARICH_BUCKET_SCAN_LIMIT).toBe(50);
    expect(DAWARICH_TRACK_POINTS_PER_DAY).toBe(600);
    expect(DAWARICH_SYNC_LOOKBACK_DAYS).toBe(3);
    // A stay can end after midnight, so the window reaches one day past the trip.
    expect(DAWARICH_SYNC_LOOKAHEAD_DAYS).toBe(1);
  });
});
