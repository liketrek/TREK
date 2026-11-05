import {
  PLACE_CLIENT_ORIGINS,
  PLACE_FIELD_ORIGINS,
  placeContribDecisionRequestSchema,
  placeContribErrorSchema,
  placeContribImageAnswerSchema,
  placeContribLogQuerySchema,
  placeContribPlaceAnswerSchema,
  placeContribPlaceBodySchema,
  placeContribStateSchema,
  placeContribWithdrawRequestSchema,
  placeFieldOriginsSchema,
} from './place-contrib.schema';
import { placeCreateRequestSchema, placeUpdateRequestSchema } from './place.schema';

import { describe, expect, it } from 'vitest';

const SWITCHES = { website: true, phone: true, email: false, opening_hours: true, description: true, image: false };

describe('placeFieldOriginsSchema', () => {
  it('takes a partial map of the client origins', () => {
    expect(placeFieldOriginsSchema.safeParse({}).success).toBe(true);
    expect(
      placeFieldOriginsSchema.safeParse({ website: 'user', phone: 'google', description: 'enrichment' }).success,
    ).toBe(true);
  });

  it('refuses the origins only the server decides', () => {
    for (const origin of ['agent', 'plugin', 'import', 'attachment', 'unknown']) {
      expect(placeFieldOriginsSchema.safeParse({ website: origin }).success, origin).toBe(false);
    }
  });

  it('keeps the client list a subset of the stored one', () => {
    for (const origin of PLACE_CLIENT_ORIGINS) expect(PLACE_FIELD_ORIGINS).toContain(origin);
  });

  it('rides on the place create and update contracts and is checked there', () => {
    expect(placeCreateRequestSchema.safeParse({ name: 'Café', fieldOrigins: { website: 'user' } }).success).toBe(true);
    expect(placeUpdateRequestSchema.safeParse({ fieldOrigins: { phone: 'osm' } }).success).toBe(true);
    expect(placeUpdateRequestSchema.safeParse({ fieldOrigins: { phone: 'agent' } }).success).toBe(false);
    expect(placeUpdateRequestSchema.safeParse({ fieldOrigins: 'user' }).success).toBe(false);
  });
});

describe('placeContribDecisionRequestSchema', () => {
  it('takes each action with what it needs', () => {
    expect(
      placeContribDecisionRequestSchema.safeParse({ action: 'agree', termsVersion: 1, fields: SWITCHES }).success,
    ).toBe(true);
    expect(placeContribDecisionRequestSchema.safeParse({ action: 'snooze' }).success).toBe(true);
    expect(placeContribDecisionRequestSchema.safeParse({ action: 'decline', termsVersion: 1 }).success).toBe(true);
    expect(
      placeContribDecisionRequestSchema.safeParse({ action: 'fields', fields: SWITCHES, withdraw: true }).success,
    ).toBe(true);
    expect(placeContribDecisionRequestSchema.safeParse({ action: 'off' }).success).toBe(true);
  });

  it('refuses an agreement without terms or with a partial set of switches', () => {
    expect(placeContribDecisionRequestSchema.safeParse({ action: 'agree', fields: SWITCHES }).success).toBe(false);
    expect(
      placeContribDecisionRequestSchema.safeParse({ action: 'agree', termsVersion: 1, fields: { website: true } })
        .success,
    ).toBe(false);
    expect(placeContribDecisionRequestSchema.safeParse({ action: 'maybe' }).success).toBe(false);
  });
});

describe('placeContribLogQuerySchema', () => {
  it('coerces the query strings and defaults the page', () => {
    expect(placeContribLogQuerySchema.parse({})).toEqual({ page: 1, perPage: 50 });
    expect(placeContribLogQuerySchema.parse({ page: '2', perPage: '10', result: 'withheld', field: 'phone' })).toEqual({
      page: 2,
      perPage: 10,
      result: 'withheld',
      field: 'phone',
    });
    expect(placeContribLogQuerySchema.safeParse({ result: 'sent' }).success).toBe(false);
  });
});

describe('placeContribWithdrawRequestSchema', () => {
  it('needs the explicit confirmation', () => {
    expect(placeContribWithdrawRequestSchema.safeParse({ confirm: true }).success).toBe(true);
    expect(placeContribWithdrawRequestSchema.safeParse({}).success).toBe(false);
    expect(placeContribWithdrawRequestSchema.safeParse({ confirm: 'yes' }).success).toBe(false);
  });
});

describe('placeContribStateSchema', () => {
  it('describes an undecided, eligible installation', () => {
    const state = {
      termsVersion: 1,
      ceiling: 'admin',
      eligible: true,
      ineligibleReason: null,
      consent: {
        enabled: false,
        fields: SWITCHES,
        termsVersion: null,
        decision: null,
        decidedBy: null,
        decidedAt: null,
      },
      showPrompt: true,
      snoozedUntil: null,
      active: false,
      counts: { accepted: 0, duplicate: 0, rejected: 0, withheld: 0, retracted: 0 },
      lastSuccessDay: null,
      queue: { size: 0, cap: 5000, full: false },
      pauseReason: null,
      registrationOpen: false,
    };
    expect(placeContribStateSchema.safeParse(state).success).toBe(true);
  });
});

describe('the central wire format', () => {
  it('builds a place body of at most the shareable text fields', () => {
    const body = {
      v: 1,
      termsVersion: 1,
      cid: 'c0ffee-1234',
      key: 'gers:08f2a1b3c4d5e6f7a8b9c0d1e2f3a4b5',
      fields: { website: { value: 'https://cafe-luna.de/', baseHash: 'a91e3f00' } },
      place: { name: 'Café Luna', lat: 54.08, lng: 12.13, country: 'DE' },
    };
    expect(placeContribPlaceBodySchema.safeParse(body).success).toBe(true);
    expect(placeContribPlaceBodySchema.safeParse({ ...body, cid: 'short' }).success).toBe(false);
    expect(
      placeContribPlaceBodySchema.safeParse({ ...body, fields: { image: { value: 'x', baseHash: null } } }).success,
    ).toBe(false);
  });

  it('reads the answers the service gives', () => {
    expect(
      placeContribPlaceAnswerSchema.safeParse({
        ok: true,
        cid: 'c0ffee-1234',
        duplicate: false,
        key: 'osm:node/42',
        community: { version: 3 },
        results: { website: { result: 'published', reason: null, flags: [] }, phone: { result: 'review' } },
      }).success,
    ).toBe(true);
    expect(
      placeContribPlaceAnswerSchema.safeParse({
        ok: true,
        cid: 'x',
        duplicate: false,
        key: 'k',
        results: { website: { result: 'sent' } },
      }).success,
    ).toBe(false);
    expect(
      placeContribImageAnswerSchema.safeParse({
        ok: true,
        result: { result: 'review', image: '0123456789abcdef0123456789abcdef', sameAs: false },
      }).success,
    ).toBe(true);
    expect(placeContribErrorSchema.safeParse({ error: 'field_not_accepted:email' }).success).toBe(true);
  });
});
