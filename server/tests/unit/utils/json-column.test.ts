import {
  COLLAB_POLL_OPTIONS,
  JOURNEY_ENTRY_PROS_CONS,
  JOURNEY_ENTRY_TAGS,
  MCP_TOKEN_API_SCOPES,
  OAUTH_CLIENT_ALLOWED_SCOPES,
  OAUTH_CLIENT_REDIRECT_URIS,
  OAUTH_CONSENT_SCOPES,
  OAUTH_TOKEN_SCOPES,
  RESERVATION_METADATA,
  USER_MFA_BACKUP_CODES,
} from '../../../src/db/json-columns';
import {
  decodeJson,
  decodeJsonResult,
  encodeJson,
  logJsonFailure,
  type JsonColumn,
} from '../../../src/utils/json-column';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const logMock = vi.hoisted(() => ({ logInfo: vi.fn(), logError: vi.fn(), logWarn: vi.fn(), logDebug: vi.fn() }));
vi.mock('../../../src/nest/audit/audit-log.logger', () => logMock);

const LIST: JsonColumn<string[]> = { column: 't.list', schema: z.array(z.string()), fallback: () => [] };

beforeEach(() => vi.clearAllMocks());

describe('decodeJsonResult', () => {
  it('JSONCOL-001: decodes text of the right shape', () => {
    expect(decodeJsonResult(LIST, '["a","b"]')).toEqual({ ok: true, value: ['a', 'b'] });
  });

  it('JSONCOL-002: names why a value did not decode', () => {
    expect(decodeJsonResult(LIST, null)).toEqual({ ok: false, reason: 'empty' });
    expect(decodeJsonResult(LIST, undefined)).toEqual({ ok: false, reason: 'empty' });
    expect(decodeJsonResult(LIST, '')).toEqual({ ok: false, reason: 'empty' });
    expect(decodeJsonResult(LIST, '{not json')).toEqual({ ok: false, reason: 'invalid-json' });
    expect(decodeJsonResult(LIST, '{"a":1}')).toEqual({ ok: false, reason: 'schema' });
  });

  it('JSONCOL-003: checks a value a driver handed back already parsed', () => {
    expect(decodeJsonResult(LIST, ['x'])).toEqual({ ok: true, value: ['x'] });
    expect(decodeJsonResult(LIST, { a: 1 })).toEqual({ ok: false, reason: 'schema' });
  });

  it('JSONCOL-004: unwraps one level of double encoding only where the column says so', () => {
    const doubled = JSON.stringify(JSON.stringify({ price: '12' }));
    expect(decodeJsonResult(RESERVATION_METADATA, doubled)).toEqual({ ok: true, value: { price: '12' } });
    expect(decodeJsonResult(LIST, JSON.stringify(JSON.stringify(['a'])))).toEqual({ ok: false, reason: 'schema' });
    expect(decodeJsonResult(RESERVATION_METADATA, JSON.stringify('{broken'))).toEqual({
      ok: false,
      reason: 'invalid-json',
    });
  });
});

describe('decodeJson', () => {
  it('JSONCOL-010: returns the decoded value without logging', () => {
    expect(decodeJson(LIST, '["a"]')).toEqual(['a']);
    expect(logMock.logWarn).not.toHaveBeenCalled();
  });

  it('JSONCOL-011: an empty column falls back quietly', () => {
    expect(decodeJson(LIST, null)).toEqual([]);
    expect(logMock.logWarn).not.toHaveBeenCalled();
  });

  it('JSONCOL-012: broken text and the wrong shape fall back and are logged with the column and context', () => {
    expect(decodeJson(LIST, '{not json', 'row 7')).toEqual([]);
    expect(logMock.logWarn).toHaveBeenLastCalledWith(
      '[json] t.list (row 7): stored value is not valid JSON, using the fallback',
    );
    expect(decodeJson(LIST, '{"a":1}')).toEqual([]);
    expect(logMock.logWarn).toHaveBeenLastCalledWith(
      '[json] t.list: stored value has the wrong shape, using the fallback',
    );
  });

  it('JSONCOL-013: every fallback is a fresh value', () => {
    const a = decodeJson(RESERVATION_METADATA, null);
    a.price = '1';
    expect(decodeJson(RESERVATION_METADATA, null)).toEqual({});
  });
});

describe('logJsonFailure / encodeJson', () => {
  it('JSONCOL-020: logs the column, the context and the reason', () => {
    logJsonFailure(LIST, 'schema');
    expect(logMock.logWarn).toHaveBeenCalledWith('[json] t.list: stored value has the wrong shape, using the fallback');
  });

  it('JSONCOL-021: encodes a value of the right shape and refuses another', () => {
    expect(encodeJson(LIST, ['a', 'b'])).toBe('["a","b"]');
    expect(() => encodeJson(LIST, [1] as unknown as string[])).toThrow();
  });
});

describe('the declared columns', () => {
  it('JSONCOL-030: reservation metadata is an object, and anything else reads as an empty one', () => {
    expect(decodeJson(RESERVATION_METADATA, '{"airline":"LH","legs":[1,2]}')).toEqual({ airline: 'LH', legs: [1, 2] });
    expect(decodeJson(RESERVATION_METADATA, '[1,2]')).toEqual({});
    expect(decodeJson(RESERVATION_METADATA, 'null')).toEqual({});
    expect(decodeJson(RESERVATION_METADATA, '{oops')).toEqual({});
  });

  it('JSONCOL-031: the OAuth lists fail closed to an empty list', () => {
    for (const col of [
      OAUTH_TOKEN_SCOPES,
      OAUTH_CLIENT_ALLOWED_SCOPES,
      OAUTH_CLIENT_REDIRECT_URIS,
      OAUTH_CONSENT_SCOPES,
    ]) {
      expect(decodeJson(col, '["trips:read"]')).toEqual(['trips:read']);
      expect(decodeJson(col, 'garbage')).toEqual([]);
      expect(decodeJson(col, '[1]')).toEqual([]);
    }
  });

  it('JSONCOL-032: the lenient lists keep whatever list is stored', () => {
    expect(decodeJson(MCP_TOKEN_API_SCOPES, '["a",1]')).toEqual(['a', 1]);
    expect(decodeJson(USER_MFA_BACKUP_CODES, '["h1",null]')).toEqual(['h1', null]);
    expect(decodeJson(COLLAB_POLL_OPTIONS, '["Yes",{"label":"No"}]')).toEqual(['Yes', { label: 'No' }]);
    expect(decodeJson(COLLAB_POLL_OPTIONS, '{"a":1}')).toEqual([]);
  });

  it('JSONCOL-033: journey entry tags and pros/cons', () => {
    expect(decodeJson(JOURNEY_ENTRY_TAGS, '["beach"]')).toEqual(['beach']);
    expect(decodeJson(JOURNEY_ENTRY_TAGS, '{bad')).toEqual([]);
    expect(decodeJson(JOURNEY_ENTRY_PROS_CONS, '{"pros":["sun"],"cons":[]}')).toEqual({ pros: ['sun'], cons: [] });
    expect(decodeJson(JOURNEY_ENTRY_PROS_CONS, 'null')).toBeNull();
    expect(decodeJson(JOURNEY_ENTRY_PROS_CONS, '{bad')).toBeNull();
  });
});
