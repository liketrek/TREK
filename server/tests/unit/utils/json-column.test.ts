import {
  ASSISTANT_MESSAGE_PARTS,
  ASSISTANT_MESSAGE_PARTS_WRITE,
  ASSISTANT_TOOL_PREVIEW,
  ASSISTANT_TOOL_PREVIEW_WRITE,
  COLLAB_POLL_OPTIONS,
  JOURNEY_ENTRY_PROS_CONS,
  JOURNEY_ENTRY_TAGS,
  MCP_TOKEN_API_SCOPES,
  OAUTH_CLIENT_ALLOWED_SCOPES,
  OAUTH_CLIENT_REDIRECT_URIS,
  OAUTH_CONSENT_SCOPES,
  OAUTH_TOKEN_SCOPES,
  RESERVATION_METADATA,
  TOUR_CHANGE_STEP_BEFORE,
  TOUR_CHANGE_STEP_CHANGES,
  USER_MFA_BACKUP_CODES,
  type TourChangeStepBefore,
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

  it('JSONCOL-034: a saved tour change keeps its changes and the tour before, a broken row claims neither', () => {
    const changes = [{ op: 'remove', key: 'stop-park' }];
    expect(decodeJson(TOUR_CHANGE_STEP_CHANGES, JSON.stringify(changes))).toEqual(changes);
    expect(decodeJson(TOUR_CHANGE_STEP_CHANGES, '[{"op":"rename"}]')).toEqual([]);
    const before: TourChangeStepBefore = {
      route_geometry: [
        [48.1, 11.5, 520],
        [48.2, 11.6],
      ],
      waypoints: [{ lat: 48.1, lng: 11.5, role: 'start', sequence: 0, key: 'stop-gate', name: 'Gate' }],
      distance: 1.6,
      duration: 22,
      elevation_gain: null,
      elevation_loss: null,
    };
    expect(decodeJson(TOUR_CHANGE_STEP_BEFORE, encodeJson(TOUR_CHANGE_STEP_BEFORE, before))).toEqual(before);
    expect(decodeJson(TOUR_CHANGE_STEP_BEFORE, '{"waypoints":"none"}')).toBeNull();
    expect(decodeJson(TOUR_CHANGE_STEP_BEFORE, '{bad')).toBeNull();
  });

  it('JSONCOL-035: an assistant message drops a data part or card a later build wrote, never the message', () => {
    const text = { type: 'text', text: 'Here is the walk.' };
    const stored = JSON.stringify([
      text,
      { type: 'data-trek-book-page', data: { page: 3 } },
      { type: 'data-trek-card', data: { toolCallId: 'c1', card: { kind: 'bookPage' } } },
    ]);
    expect(decodeJson(ASSISTANT_MESSAGE_PARTS, stored)).toEqual([
      text,
      { type: 'data-trek-card', data: { toolCallId: 'c1', card: null } },
    ]);
    expect(logMock.logWarn).not.toHaveBeenCalled();
    expect(decodeJson(ASSISTANT_MESSAGE_PARTS, '[{"type":"text","text":5}]', 'message 9')).toEqual([]);
    expect(logMock.logWarn).toHaveBeenCalledTimes(1);
  });

  it('JSONCOL-036: an assistant message is written strictly: a part this build cannot describe is refused', () => {
    const parts = [{ type: 'data-trek-card' as const, data: { toolCallId: 'c1', card: null } }];
    expect(JSON.parse(encodeJson(ASSISTANT_MESSAGE_PARTS_WRITE, parts))).toEqual(parts);
    const unknown = [{ type: 'data-trek-book-page', data: {} }] as unknown as typeof parts;
    expect(() => encodeJson(ASSISTANT_MESSAGE_PARTS_WRITE, unknown)).toThrow();
    const misbuilt = [{ type: 'data-trek-card', data: { toolCallId: 'c1', card: { kind: 'bookPage' } } }];
    expect(() => encodeJson(ASSISTANT_MESSAGE_PARTS_WRITE, misbuilt as unknown as typeof parts)).toThrow();
    expect(ASSISTANT_MESSAGE_PARTS_WRITE.column).toBe(ASSISTANT_MESSAGE_PARTS.column);
  });

  it('JSONCOL-037: a stored change card reads a later verb as a plain update, and is written strictly', () => {
    const preview = {
      toolCallId: 'c1',
      verbKey: 'addPlace' as const,
      subject: 'Lake',
      rows: [],
      dayId: null,
      placeIds: [],
      undoable: false,
    };
    const later = JSON.stringify({ ...preview, verbKey: 'laterVerb' });
    expect(decodeJson(ASSISTANT_TOOL_PREVIEW, later)).toEqual({ ...preview, verbKey: 'genericUpdate' });
    expect(JSON.parse(encodeJson(ASSISTANT_TOOL_PREVIEW_WRITE, preview))).toEqual(preview);
    const misbuilt = { ...preview, verbKey: 'laterVerb' } as unknown as typeof preview;
    expect(() => encodeJson(ASSISTANT_TOOL_PREVIEW_WRITE, misbuilt)).toThrow();
    expect(ASSISTANT_TOOL_PREVIEW_WRITE.column).toBe(ASSISTANT_TOOL_PREVIEW.column);
  });
});
