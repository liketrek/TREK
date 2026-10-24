/// <reference types="node" />
import {
  ASSISTANT_CHANGE_LABEL_KEYS,
  assistantAddFoundPlaceRequestSchema,
  assistantAddFoundPlaceResponseSchema,
  assistantAttachmentRequestSchema,
  assistantChangePreviewSchema,
  assistantChangePreviewWriteSchema,
  assistantChatRequestSchema,
  assistantDecisionsRequestSchema,
  assistantFoundPlaceSchema,
  assistantInsertFoundPlaceRequestSchema,
  assistantMessageSchema,
  assistantPlacesSchema,
  assistantStopRequestSchema,
  assistantWeatherSchema,
  isAssistantTourFile,
  UI_STREAM_DONE,
  uiStreamChunkSchema,
  type UiStreamChunk,
} from './assistant.schema';

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ctx = { locale: 'de', timeZone: 'Europe/Berlin' };

/** The `data:` payloads of an SSE body, in order. */
const dataEvents = (body: string) =>
  body
    .split('\n\n')
    .filter((event) => event.startsWith('data: '))
    .map((event) => event.slice('data: '.length));

const fixture = readFileSync(fileURLToPath(new URL('./__fixtures__/ui-stream.v1.txt', import.meta.url)), 'utf8');

describe('assistantChatRequestSchema', () => {
  it('takes a first message without a thread and trims the text', () => {
    const parsed = assistantChatRequestSchema.parse({ ...ctx, threadId: null, text: '  Plan day 2  ' });
    expect(parsed.text).toBe('Plan day 2');
  });

  it('refuses blank or overlong text, a bad thread id and unknown keys', () => {
    expect(assistantChatRequestSchema.safeParse({ ...ctx, threadId: null, text: '   ' }).success).toBe(false);
    expect(assistantChatRequestSchema.safeParse({ ...ctx, threadId: null, text: 'x'.repeat(32_001) }).success).toBe(
      false,
    );
    expect(assistantChatRequestSchema.safeParse({ ...ctx, threadId: 0, text: 'hi' }).success).toBe(false);
    expect(assistantChatRequestSchema.safeParse({ ...ctx, threadId: null, text: 'hi', tripId: 9 }).success).toBe(false);
  });

  it('carries a focus of at most 20 places', () => {
    const many = Array.from({ length: 21 }, (_, i) => i + 1);
    expect(
      assistantChatRequestSchema.safeParse({ ...ctx, threadId: 3, text: 'hi', focus: { dayId: 4, placeIds: [1] } })
        .success,
    ).toBe(true);
    expect(
      assistantChatRequestSchema.safeParse({ ...ctx, threadId: 3, text: 'hi', focus: { placeIds: many } }).success,
    ).toBe(false);
  });

  it('needs the locale and time zone', () => {
    expect(assistantChatRequestSchema.safeParse({ threadId: null, text: 'hi' }).success).toBe(false);
  });
});

describe('assistantAttachmentRequestSchema', () => {
  it('reads the multipart text fields, the thread id from its text', () => {
    expect(assistantAttachmentRequestSchema.parse({ ...ctx })).toEqual(ctx);
    expect(assistantAttachmentRequestSchema.parse({ ...ctx, threadId: '12' })).toEqual({ ...ctx, threadId: 12 });
  });

  it('refuses a bad thread id, unknown fields and a missing context', () => {
    for (const threadId of ['0', '-1', 'abc', '1.5']) {
      expect(assistantAttachmentRequestSchema.safeParse({ ...ctx, threadId }).success, threadId).toBe(false);
    }
    expect(assistantAttachmentRequestSchema.safeParse({ ...ctx, text: 'hi' }).success).toBe(false);
    expect(assistantAttachmentRequestSchema.safeParse({ threadId: '3' }).success).toBe(false);
  });
});

describe('assistantDecisionsRequestSchema', () => {
  it('takes one to twelve decisions', () => {
    const decision = { toolCallId: 'a', approved: true };
    expect(assistantDecisionsRequestSchema.safeParse({ ...ctx, decisions: [decision] }).success).toBe(true);
    expect(assistantDecisionsRequestSchema.safeParse({ ...ctx, decisions: [] }).success).toBe(false);
    expect(
      assistantDecisionsRequestSchema.safeParse({ ...ctx, decisions: Array.from({ length: 51 }, () => decision) })
        .success,
    ).toBe(false);
  });

  it('never takes arguments for a call, only the decision', () => {
    expect(
      assistantDecisionsRequestSchema.safeParse({
        ...ctx,
        decisions: [{ toolCallId: 'a', approved: true, args: { name: 'x' } }],
      }).success,
    ).toBe(false);
  });
});

describe('assistantStopRequestSchema', () => {
  it('is an empty JSON object', () => {
    expect(assistantStopRequestSchema.safeParse({}).success).toBe(true);
    expect(assistantStopRequestSchema.safeParse({ force: true }).success).toBe(false);
  });
});

describe('assistantChangePreviewSchema', () => {
  const preview = {
    toolCallId: 'c1',
    verbKey: 'addPlace',
    subject: 'Kinkaku-ji',
    rows: [{ op: 'add', labelKey: 'address', before: null, after: 'Kyoto' }],
    dayId: null,
    placeIds: [],
    undoable: true,
  };

  it('labels rows from the closed key list only', () => {
    expect(assistantChangePreviewSchema.safeParse(preview).success).toBe(true);
    expect(
      assistantChangePreviewSchema.safeParse({ ...preview, rows: [{ ...preview.rows[0], labelKey: 'evil' }] }).success,
    ).toBe(false);
    expect(assistantChangePreviewWriteSchema.safeParse({ ...preview, verbKey: 'deleteTrip' }).success).toBe(false);
  });

  it('reads a verb a later build added as a plain update, and writes none it does not know', () => {
    expect(assistantChangePreviewSchema.parse({ ...preview, verbKey: 'laterVerb' }).verbKey).toBe('genericUpdate');
    expect(assistantChangePreviewWriteSchema.parse(preview).verbKey).toBe('addPlace');
    expect(assistantChangePreviewWriteSchema.safeParse({ ...preview, card: { kind: 'nope' } }).success).toBe(false);
  });

  it('names the proposal a taken change came from by its call id, bounded like the take request', () => {
    expect(assistantChangePreviewWriteSchema.parse({ ...preview, takenFrom: 'call_hike' }).takenFrom).toBe('call_hike');
    expect(assistantChangePreviewSchema.parse(preview).takenFrom).toBeUndefined();
    expect(assistantChangePreviewWriteSchema.safeParse({ ...preview, takenFrom: '' }).success).toBe(false);
    expect(assistantChangePreviewWriteSchema.safeParse({ ...preview, takenFrom: 'c'.repeat(65) }).success).toBe(false);
  });

  it('holds at most twelve rows', () => {
    const rows = ASSISTANT_CHANGE_LABEL_KEYS.slice(0, 13).map((labelKey) => ({
      op: 'add',
      labelKey,
      before: null,
      after: 'x',
    }));
    expect(assistantChangePreviewSchema.safeParse({ ...preview, rows }).success).toBe(false);
  });
});

describe('assistantMessageSchema', () => {
  it('reads a stored message with an expired approval', () => {
    const parsed = assistantMessageSchema.safeParse({
      id: '12',
      role: 'assistant',
      status: 'awaiting_approval',
      createdAt: '2026-10-21T08:00:00.000Z',
      parts: [
        { type: 'text', text: 'Adding it.' },
        {
          type: 'tool-call',
          toolCallId: 'c1',
          toolName: 'create_place',
          args: { name: 'Kinkaku-ji' },
          approval: { id: 'c1', resolution: 'expired' },
        },
      ],
    });
    expect(parsed.success).toBe(true);
  });

  it('reads a user message that attached a file, by its name, type and size only', () => {
    const message = { id: '13', role: 'user', status: 'complete', createdAt: '2026-10-21T08:00:00.000Z' };
    const attachment = { type: 'attachment', name: 'ticket.pdf', mime: 'application/pdf', size: 2048 };
    expect(assistantMessageSchema.safeParse({ ...message, parts: [attachment] }).success).toBe(true);
    const negative = { ...attachment, size: -1 };
    expect(assistantMessageSchema.safeParse({ ...message, parts: [negative] }).success).toBe(false);
  });
});

describe('uiStreamChunkSchema', () => {
  it('reads an unknown error code as generic', () => {
    expect(uiStreamChunkSchema.parse({ type: 'error', errorText: 'something_new' })).toEqual({
      type: 'error',
      errorText: 'generic',
    });
    expect(uiStreamChunkSchema.parse({ type: 'error', errorText: 'daily_limit' })).toEqual({
      type: 'error',
      errorText: 'daily_limit',
    });
  });

  it('refuses a chunk type it does not know', () => {
    expect(uiStreamChunkSchema.safeParse({ type: 'reasoning-delta', id: 'r', delta: 'x' }).success).toBe(false);
  });
});

describe('ui-stream.v1 fixture', () => {
  const events = dataEvents(fixture);
  const chunks = events.slice(0, -1).map((event) => uiStreamChunkSchema.parse(JSON.parse(event)));
  const ofType = <T extends UiStreamChunk['type']>(type: T) =>
    chunks.filter((c): c is Extract<UiStreamChunk, { type: T }> => c.type === type);

  it('is a stream of valid chunks closed by [DONE]', () => {
    expect(events.at(-1)).toBe(UI_STREAM_DONE);
    expect(chunks[0]?.type).toBe('start');
    expect(chunks.at(-1)).toEqual({ type: 'finish', finishReason: 'tool-calls' });
  });

  it('names the new thread before anything else is said', () => {
    expect(chunks[1]?.type).toBe('data-trek-thread');
  });

  it('asks for approval with the call id and previews that same call', () => {
    const [request] = ofType('tool-approval-request');
    const [change] = ofType('data-trek-change');
    expect(request).toBeDefined();
    expect(request?.approvalId).toBe(request?.toolCallId);
    expect(change?.data.toolCallId).toBe(request?.toolCallId);
    expect(ofType('tool-input-available').map((c) => c.toolCallId)).toContain(request?.toolCallId);
  });

  it('closes every text block it opens', () => {
    const opened = ofType('text-start').map((c) => c.id);
    expect(opened.length).toBeGreaterThan(0);
    expect(ofType('text-end').map((c) => c.id)).toEqual(opened);
  });
});

describe('mentions in a chat request', () => {
  const base = { ...ctx, threadId: 3, text: 'Move @Louvre to @Friday' };

  it('names up to ten days, places or bookings by id, never by label', () => {
    const mentions = [
      { kind: 'place', id: 4 },
      { kind: 'day', id: 9 },
      { kind: 'reservation', id: 2 },
    ];
    expect(assistantChatRequestSchema.safeParse({ ...base, mentions }).success).toBe(true);
    const tooMany = Array.from({ length: 51 }, () => ({ kind: 'place', id: 4 }));
    expect(assistantChatRequestSchema.safeParse({ ...base, mentions: tooMany }).success).toBe(false);
    const labelled = [{ kind: 'place', id: 4, label: 'Louvre' }];
    expect(assistantChatRequestSchema.safeParse({ ...base, mentions: labelled }).success).toBe(false);
    expect(assistantChatRequestSchema.safeParse({ ...base, mentions: [{ kind: 'trip', id: 4 }] }).success).toBe(false);
  });
});

describe('assistantAddFoundPlaceRequestSchema', () => {
  const parse = (body: Record<string, unknown>) => assistantAddFoundPlaceRequestSchema.safeParse({ ...ctx, ...body });

  it('names a found place by its ref and the day it goes on', () => {
    expect(parse({ ref: 'toolu_01:2', dayId: 32 }).success).toBe(true);
  });

  it('refuses an empty or overlong ref, a bad day and anything about the place itself', () => {
    expect(parse({ ref: '', dayId: 32 }).success).toBe(false);
    expect(parse({ ref: 'x'.repeat(81), dayId: 32 }).success).toBe(false);
    expect(parse({ ref: 'a:1', dayId: 0 }).success).toBe(false);
    expect(parse({ ref: 'a:1', dayId: 3, name: 'Elsewhere' }).success).toBe(false);
    expect(assistantAddFoundPlaceRequestSchema.safeParse({ ref: 'a:1', dayId: 3 }).success).toBe(false);
  });
});

describe('assistantInsertFoundPlaceRequestSchema', () => {
  const parse = (body: Record<string, unknown>) =>
    assistantInsertFoundPlaceRequestSchema.safeParse({ ...ctx, ...body });

  it('names a found place by its ref and the saved tour it goes into', () => {
    expect(parse({ ref: 'toolu_01:2', tourId: 64 }).success).toBe(true);
  });

  it('refuses a bad tour, a day instead of a tour and anything about the stop itself', () => {
    expect(parse({ ref: 'a:1', tourId: 0 }).success).toBe(false);
    expect(parse({ ref: 'a:1', dayId: 3 }).success).toBe(false);
    expect(parse({ ref: 'a:1', tourId: 64, after_key: 'abc123' }).success).toBe(false);
    expect(assistantInsertFoundPlaceRequestSchema.safeParse({ ref: 'a:1', tourId: 64 }).success).toBe(false);
  });
});

describe('route files attached in the chat', () => {
  it('tells a GPX, KML or KMZ file by its name, whatever its case', () => {
    expect(isAssistantTourFile('Herzogstand.GPX')).toBe(true);
    expect(isAssistantTourFile('map.kml')).toBe(true);
    expect(isAssistantTourFile('map.kmz')).toBe(true);
    expect(isAssistantTourFile('ticket.pdf')).toBe(false);
    expect(isAssistantTourFile('gpx')).toBe(false);
  });
});

describe('the effect of a change', () => {
  const preview = {
    toolCallId: 'c1',
    verbKey: 'addPlaceToDay',
    subject: 'Kinkaku-ji',
    rows: [],
    dayId: 32,
    placeIds: [],
    undoable: true,
  };
  const ghost = { name: 'Kinkaku-ji', lat: 35.0394, lng: 135.7292, categoryId: null };
  const add = { kind: 'add', dayId: 32, fromDayId: null, placeId: null, assignmentId: null, place: ghost };
  const withEffect = (effect: unknown) => assistantChangePreviewSchema.safeParse({ ...preview, effect }).success;

  it('is optional, so previews stored before it still read', () => {
    expect(assistantChangePreviewSchema.safeParse(preview).success).toBe(true);
    expect(withEffect(null)).toBe(true);
  });

  it('places a new place on its day, or moves an existing one between days', () => {
    expect(withEffect(add)).toBe(true);
    const existing = { placeId: 7, assignmentId: 12, place: null };
    expect(withEffect({ kind: 'move', dayId: 32, fromDayId: 31, ...existing })).toBe(true);
    expect(withEffect({ kind: 'remove', dayId: 31, fromDayId: null, ...existing })).toBe(true);
  });

  it('refuses a position off the globe, an overlong name and an unknown kind', () => {
    expect(withEffect({ ...add, place: { ...ghost, lat: 91 } })).toBe(false);
    expect(withEffect({ ...add, place: { ...ghost, lng: -181 } })).toBe(false);
    expect(withEffect({ ...add, place: { ...ghost, name: 'x'.repeat(201) } })).toBe(false);
    expect(withEffect({ ...add, kind: 'swap' })).toBe(false);
  });
});

describe('assistantFoundPlaceSchema', () => {
  const place = {
    ref: 'toolu_01:0',
    name: 'Trattoria da Enzo',
    address: 'Via dei Vascellari 29, Roma',
    lat: 41.8885,
    lng: 12.4771,
    kind: 'food',
    rating: 4.6,
    openNow: null,
    googlePlaceId: 'ChIJ-abc_123',
    osmId: null,
    photoKey: 'ChIJ-abc_123',
    inTripPlaceId: null,
  };
  const withPlace = (patch: Record<string, unknown>) => assistantFoundPlaceSchema.safeParse({ ...place, ...patch });

  it('reads a place with a source id as its photo key, or coordinates', () => {
    expect(withPlace({}).success).toBe(true);
    expect(withPlace({ photoKey: 'coords:41.8885,12.4771' }).success).toBe(true);
    expect(withPlace({ photoKey: 'coords:-33.9,-70.6' }).success).toBe(true);
    expect(withPlace({ photoKey: null }).success).toBe(true);
  });

  it('never takes a URL or anything with a path as the photo key', () => {
    const notKeys = [
      'https://evil.example/p.jpg',
      '//evil.example/p.jpg',
      '/api/maps/place-photo/x/bytes',
      'a/b',
      'coords:1,2;x',
      '',
    ];
    for (const photoKey of notKeys) expect(withPlace({ photoKey }).success, photoKey).toBe(false);
  });

  it('refuses a Google id that is not one, a rating past five and an unknown kind', () => {
    expect(withPlace({ googlePlaceId: 'a b' }).success).toBe(false);
    expect(withPlace({ rating: 5.1 }).success).toBe(false);
    expect(withPlace({ kind: 'casino' }).success).toBe(false);
  });

  it('holds at most twenty places to a step and counts the rest', () => {
    const places = Array.from({ length: 21 }, (_, i) => ({ ...place, ref: `toolu_01:${i}` }));
    const step = (body: Record<string, unknown>) =>
      assistantPlacesSchema.safeParse({ toolCallId: 'toolu_01', ...body });
    expect(step({ places: places.slice(0, 20), more: 1 }).success).toBe(true);
    expect(step({ places, more: 0 }).success).toBe(false);
    expect(step({ places: [], more: -1 }).success).toBe(false);
  });
});

describe('assistantWeatherSchema', () => {
  const day = {
    dayId: 32,
    date: '2026-06-12',
    main: 'Clear',
    tempMax: 24.5,
    tempMin: 16,
    rainPct: 10,
    kind: 'forecast',
  };

  it('reads one to sixteen days, a climate day without a low or a rain chance', () => {
    expect(assistantWeatherSchema.safeParse({ days: [day] }).success).toBe(true);
    const climate = { ...day, dayId: null, tempMin: null, rainPct: null, kind: 'climate' };
    expect(assistantWeatherSchema.safeParse({ days: [climate] }).success).toBe(true);
    expect(assistantWeatherSchema.safeParse({ days: [] }).success).toBe(false);
    expect(assistantWeatherSchema.safeParse({ days: Array.from({ length: 17 }, () => day) }).success).toBe(false);
  });

  it('refuses a date that is not a calendar date and a rain chance past 100', () => {
    expect(assistantWeatherSchema.safeParse({ days: [{ ...day, date: '12.06.2026' }] }).success).toBe(false);
    expect(assistantWeatherSchema.safeParse({ days: [{ ...day, rainPct: 101 }] }).success).toBe(false);
  });
});

describe('the new message parts', () => {
  const message = { id: '14', status: 'complete', createdAt: '2026-10-21T08:00:00.000Z' };
  const rainyDay = { dayId: 32, date: '2026-06-12', main: 'Rain', tempMax: 18, tempMin: 12, rainPct: 80 };

  it('keeps found places and the weather on an answer', () => {
    const parts = [
      { type: 'data-trek-places', data: { toolCallId: 'toolu_01', places: [], more: 0 } },
      { type: 'data-trek-weather', data: { days: [{ ...rainyDay, kind: 'forecast' }] } },
    ];
    expect(assistantMessageSchema.safeParse({ ...message, role: 'assistant', parts }).success).toBe(true);
  });

  it('keeps the checked mentions of a question with their labels', () => {
    const item = { kind: 'place', id: 4, label: 'Louvre' };
    const parts = [
      { type: 'text', text: 'Is @Louvre open on Monday?' },
      { type: 'data-trek-mentions', data: { items: [item] } },
    ];
    expect(assistantMessageSchema.safeParse({ ...message, role: 'user', parts }).success).toBe(true);
    const tooLong = [{ type: 'data-trek-mentions', data: { items: [{ ...item, label: 'x'.repeat(121) }] } }];
    expect(assistantMessageSchema.safeParse({ ...message, role: 'user', parts: tooLong }).success).toBe(false);
  });

  it('never stores the live activity of a step', () => {
    const activity = { type: 'data-trek-activity', data: { toolCallId: 'toolu_01', label: null, area: null } };
    expect(assistantMessageSchema.safeParse({ ...message, role: 'assistant', parts: [activity] }).success).toBe(false);
  });

  it('answers a suggested found place with the message that holds it', () => {
    const answer = { ...message, role: 'assistant', status: 'awaiting_approval', parts: [] };
    expect(assistantAddFoundPlaceResponseSchema.safeParse({ message: answer }).success).toBe(true);
    expect(assistantAddFoundPlaceResponseSchema.safeParse({}).success).toBe(false);
  });
});

describe('the new stream chunks', () => {
  const activity = (data: Record<string, unknown>) =>
    uiStreamChunkSchema.safeParse({ type: 'data-trek-activity', data: { toolCallId: 'toolu_01', ...data } }).success;

  it('streams the live activity of a step, marked transient, with a point or a box', () => {
    const point = { type: 'point', lat: 41.89, lng: 12.47, radiusM: 1500 };
    const bbox = { type: 'bbox', south: 41.8, west: 12.4, north: 41.95, east: 12.6 };
    for (const area of [point, bbox, null]) expect(activity({ label: 'Trastevere', area })).toBe(true);
    const chunk = { type: 'data-trek-activity', transient: true, data: { toolCallId: 't', label: null, area: null } };
    expect(uiStreamChunkSchema.safeParse(chunk).success).toBe(true);
  });

  it('refuses an activity with a radius past 50 km or a label past 80 characters', () => {
    const area = { type: 'point', lat: 41.89, lng: 12.47, radiusM: 50_001 };
    expect(activity({ label: null, area })).toBe(false);
    expect(activity({ label: 'x'.repeat(81), area: null })).toBe(false);
  });

  it('streams found places and the weather as they are stored', () => {
    const places = { type: 'data-trek-places', data: { toolCallId: 'toolu_01', places: [], more: 3 } };
    const day = { dayId: null, date: '2026-06-12', main: 'Clouds', tempMax: 21, tempMin: null, rainPct: null };
    const weather = { type: 'data-trek-weather', data: { days: [{ ...day, kind: 'current' }] } };
    expect(uiStreamChunkSchema.safeParse(places).success).toBe(true);
    expect(uiStreamChunkSchema.safeParse(weather).success).toBe(true);
  });

  it('names the found-place refusal by its code', () => {
    expect(uiStreamChunkSchema.parse({ type: 'error', errorText: 'decide_first' })).toEqual({
      type: 'error',
      errorText: 'decide_first',
    });
  });
});
